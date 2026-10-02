export interface InAppNotificationItem {
  id: string | number;
  title: string;
  message: string;
  category: "weather" | "mandi" | "system" | "personal" | "general";
  priority?: "urgent" | "high" | "normal" | "low";
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

const STORAGE_KEY = "farmiq_in_app_notifications";
const EVENT_NAME = "farmiq-notification-event";

// Initial seed notifications if user opens the app fresh
const DEFAULT_SEED_NOTIFICATIONS: InAppNotificationItem[] = [
  {
    id: "welcome-system-seed",
    title: "🌾 Welcome to FarmIQ Agro-VisionAI",
    message: "Your AI-powered precision farming suite is active. All alert switches are in OFF mode by default. Turn ON alerts in Weather or Settings to receive live automated farm advisories.",
    category: "system",
    priority: "normal",
    action_url: "/weather",
    is_read: false,
    created_at: new Date().toISOString()
  }
];

export function getStoredNotifications(): InAppNotificationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_NOTIFICATIONS));
      return DEFAULT_SEED_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading notifications from localStorage:", err);
    return [];
  }
}

export function saveStoredNotifications(notifications: InAppNotificationItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: notifications }));
  } catch (err) {
    console.error("Error saving notifications to localStorage:", err);
  }
}

export function addInAppNotification(item: Omit<InAppNotificationItem, "id" | "created_at" | "is_read"> & { id?: string | number }): InAppNotificationItem {
  const current = getStoredNotifications();
  const newItem: InAppNotificationItem = {
    id: item.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: item.title,
    message: item.message,
    category: item.category,
    priority: item.priority || "normal",
    action_url: item.action_url,
    is_read: false,
    created_at: new Date().toISOString()
  };

  const updated = [newItem, ...current.slice(0, 49)]; // Keep max 50 recent items
  saveStoredNotifications(updated);

  // Sync optionally to backend in background
  try {
    fetch("/api/notifications/inbox/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newItem.title,
        message: newItem.message,
        category: newItem.category,
        priority: newItem.priority,
        action_url: newItem.action_url
      })
    }).catch(() => {
      // Backend offline or non-blocking
    });
  } catch (e) {}

  return newItem;
}

export function markNotificationRead(id: string | number): void {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, is_read: true } : n));
  saveStoredNotifications(updated);

  try {
    if (typeof id === "number" || !isNaN(Number(id))) {
      fetch(`/api/notifications/inbox/${id}/read`, { method: "PUT" }).catch(() => {});
    }
  } catch (e) {}
}

export function markAllNotificationsRead(): void {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, is_read: true }));
  saveStoredNotifications(updated);

  try {
    fetch("/api/notifications/inbox/read-all", { method: "PUT" }).catch(() => {});
  } catch (e) {}
}

export function deleteNotification(id: string | number): void {
  const current = getStoredNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveStoredNotifications(updated);
}

export function clearAllNotifications(): void {
  saveStoredNotifications([]);
  try {
    fetch("/api/notifications/inbox/clear", { method: "DELETE" }).catch(() => {});
  } catch (e) {}
}

/**
 * Triggered whenever the user turns ON any alert switch in the UI.
 * Creates an immediate high-fidelity notification inside the Bell notification icon drawer!
 */
export function handleSwitchToggleNotification(
  switchKey: "rain" | "temp" | "frost" | "wind" | "mandi" | "language",
  isActive: boolean,
  extraMeta?: { languageName?: string; priceSummary?: string }
): void {
  if (!isActive) return; // Notification triggered only when turned ON as requested

  switch (switchKey) {
    case "rain":
      addInAppNotification({
        title: "🌧️ Rain Alerts Activated",
        message: "Live rainfall prediction notifications are now armed. You will receive alerts when precipitation probability exceeds 40%.",
        category: "weather",
        priority: "normal",
        action_url: "/weather"
      });
      break;

    case "temp":
      addInAppNotification({
        title: "🌡️ Temperature Warnings Activated",
        message: "Extreme weather warning monitor is active. High temperature (>38°C) and cold shock alerts will appear here.",
        category: "weather",
        priority: "high",
        action_url: "/weather"
      });
      break;

    case "frost":
      addInAppNotification({
        title: "❄️ Frost Alerts Activated",
        message: "Ground frost detector armed. Early morning frost warnings (<4°C) will notify you to protect delicate crop canopies.",
        category: "weather",
        priority: "normal",
        action_url: "/weather"
      });
      break;

    case "wind":
      addInAppNotification({
        title: "💨 Wind Speed Alerts Activated",
        message: "High velocity wind alert system is armed (>25 km/h) to protect foliar spray operations and greenhouse structures.",
        category: "weather",
        priority: "normal",
        action_url: "/weather"
      });
      break;

    case "mandi":
      addInAppNotification({
        title: "📈 Daily Mandi Price Ticker Activated",
        message: extraMeta?.priceSummary || "Morning rate alerts enabled for Guntur Mirchi Yard (₹18,500/Q), Tenali Paddy Market (₹2,450/Q), and Warangal Cotton (₹7,100/Q).",
        category: "mandi",
        priority: "normal",
        action_url: "/market-prices"
      });
      break;

    case "language":
      addInAppNotification({
        title: "🌐 Application Language Updated",
        message: `Your preferred application language has been switched to ${extraMeta?.languageName || "the selected regional dialect"}. All advisories and alerts will adapt accordingly.`,
        category: "system",
        priority: "low",
        action_url: "/settings"
      });
      break;
  }
}
