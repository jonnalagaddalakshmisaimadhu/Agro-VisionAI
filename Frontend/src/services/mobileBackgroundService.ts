import { registerPlugin, Capacitor } from "@capacitor/core";
import { toast } from "sonner";

// Safely register plugins to prevent web crashes
interface BackgroundGeolocationPlugin {
  addWatcher(
    options: {
      backgroundMessage?: string;
      backgroundTitle?: string;
      requestPermissions?: boolean;
      stale?: boolean;
      distanceFilter?: number;
    },
    callback: (
      location?: {
        latitude: number;
        longitude: number;
        accuracy: number;
        altitude: number;
        speed: number;
        bearing: number;
        time: number;
      },
      error?: any
    ) => void
  ): Promise<string>;
  removeWatcher(options: { id: string }): Promise<void>;
  openSettings(): Promise<void>;
}

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation"
);

// Capgo Live Updater Plugin
interface CapgoUpdaterPlugin {
  notifyAppReady(): Promise<void>;
  download(options: { url: string; version: string }): Promise<any>;
  set(options: { version: string }): Promise<any>;
  reload(): Promise<void>;
  getLatest(): Promise<any>;
}

const CapgoUpdater = registerPlugin<CapgoUpdaterPlugin>("CapacitorUpdater");

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class MobileBackgroundService {
  private watcherId: string | null = null;
  private isTracking: boolean = false;
  private activeTripId: number | null = null;
  private activeVehicleId: string = "AP-07-TA-8822";

  /**
   * Initializes Capgo Live OTA Updates on mobile startup.
   */
  public async initOTAUpdater(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Notify Capgo native runtime that app is running successfully
      await CapgoUpdater.notifyAppReady();
      console.log("Capgo OTA Live Updater initialized successfully.");

      // Check if a live update bundle is available on the backend
      const res = await fetch(`${API_BASE_URL}/api/app/check-update?platform=android`);
      if (res.ok) {
        const updateData = await res.json();
        if (updateData.ota_bundle_url && updateData.latest_version) {
          console.log(`Downloading Capgo OTA bundle: v${updateData.latest_version}`);
          await CapgoUpdater.download({
            url: updateData.ota_bundle_url,
            version: updateData.latest_version
          });
          await CapgoUpdater.set({ version: updateData.latest_version });
          console.log("OTA Bundle ready for next launch.");
        }
      }
    } catch (err) {
      console.debug("Capgo OTA check skipped:", err);
    }
  }

  /**
   * Starts persistent foreground GPS collection with notification banner.
   * Continues transmitting coordinates even when device screen is LOCKED or user opens another app.
   */
  public async startBackgroundTracking(
    tripId?: number,
    vehicleId: string = "AP-07-TA-8822"
  ): Promise<boolean> {
    this.activeTripId = tripId || null;
    this.activeVehicleId = vehicleId;

    if (!Capacitor.isNativePlatform()) {
      console.log("Web mode: Background GPS simulated or using standard geolocation.");
      this.isTracking = true;
      return true;
    }

    try {
      if (this.watcherId) {
        await this.stopBackgroundTracking();
      }

      this.watcherId = await BackgroundGeolocation.addWatcher(
        {
          backgroundTitle: "FarmIQ Active Agricultural Transit",
          backgroundMessage: "Live route navigation & telemetry broadcasting active",
          requestPermissions: true,
          stale: false,
          distanceFilter: 5 // Trigger update every 5 meters
        },
        async (location, error) => {
          if (error) {
            if (error.code === "NOT_AUTHORIZED") {
              toast.error("Location permission denied for background tracking.");
              BackgroundGeolocation.openSettings();
            }
            return;
          }

          if (location) {
            await this.transmitCoordinate({
              latitude: location.latitude,
              longitude: location.longitude,
              speed_kmh: Math.max(0, Math.round(location.speed * 3.6)), // m/s to km/h
              heading: location.bearing || 0,
              trip_id: this.activeTripId,
              vehicle_id: this.activeVehicleId
            });
          }
        }
      );

      this.isTracking = true;
      toast.success("Background GPS collection active with foreground notification!");
      return true;
    } catch (err: any) {
      console.error("Failed to start background tracking:", err);
      toast.error(err.message || "Could not start background GPS service");
      return false;
    }
  }

  private microBatchBuffer: any[] = [];
  private lastBatchFlush: number = Date.now();

  /**
   * Transmits instantaneous coordinate to Phase 2 Redis Telemetry Ingestion endpoint
   * and buffers high-frequency pings for Phase 4 Kafka/Redpanda stream batching.
   */
  private async transmitCoordinate(data: {
    latitude: number;
    longitude: number;
    speed_kmh: number;
    heading: number;
    trip_id: number | null;
    vehicle_id: string;
  }) {
    const payload = {
      vehicle_id: data.vehicle_id,
      trip_id: data.trip_id,
      latitude: data.latitude,
      longitude: data.longitude,
      speed_kmh: data.speed_kmh,
      heading: data.heading,
      status: data.speed_kmh > 3 ? "IN_TRANSIT" : "STOPPED",
      battery_pct: 95,
      timestamp: Date.now() / 1000
    };

    // 1. Send single coordinate to Phase 2 Redis telemetry
    try {
      await fetch(`${API_BASE_URL}/api/telemetry/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.debug("Telemetry ingestion transmission warning:", err);
    }

    // 2. Buffer into Phase 4 Stream Processing micro-batch
    this.microBatchBuffer.push(payload);
    const now = Date.now();
    if (this.microBatchBuffer.length >= 5 || now - this.lastBatchFlush > 3000) {
      const batchToSend = [...this.microBatchBuffer];
      this.microBatchBuffer = [];
      this.lastBatchFlush = now;

      try {
        await fetch(`${API_BASE_URL}/api/traffic/stream/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch: batchToSend })
        });
      } catch (err) {
        console.debug("Stream batch ingestion warning:", err);
      }
    }
  }

  /**
   * Stops background location tracking and dismisses the foreground notification.
   */
  public async stopBackgroundTracking(): Promise<void> {
    if (this.watcherId && Capacitor.isNativePlatform()) {
      try {
        await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
      } catch (err) {
        console.debug("Error removing watcher:", err);
      }
    }
    this.watcherId = null;
    this.isTracking = false;
    this.activeTripId = null;
    toast.info("Background GPS tracking paused.");
  }

  public getIsTracking(): boolean {
    return this.isTracking;
  }
}

export const mobileBackgroundService = new MobileBackgroundService();
export default mobileBackgroundService;
