import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Download, 
  ArrowUpCircle, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw,
  ExternalLink,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Current Installed App Version
export const APP_CURRENT_VERSION = "1.0.0";

export interface UpdateInfo {
  update_available: boolean;
  force_update: boolean;
  current_installed_version: string;
  latest_version: string;
  title: string;
  title_te?: string;
  release_notes: string[];
  release_notes_te?: string[];
  apk_url: string;
  apk_size_mb: number;
  published_date: string;
}

export const AppUpdateChecker: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Check language preference
  const currentLang = localStorage.getItem("farmiq_language") || "en";
  const isTelugu = currentLang === "te";

  useEffect(() => {
    // Check for updates on app launch
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const apiUrl = isLocalhost 
        ? `http://localhost:8000/api/app/check-update?current_version=${APP_CURRENT_VERSION}&platform=android`
        : `/api/app/check-update?current_version=${APP_CURRENT_VERSION}&platform=android`;

      const response = await fetch(apiUrl, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data: UpdateInfo = await response.json();
        if (data.update_available) {
          // Check if this version was already dismissed today (unless force_update is true)
          const dismissedVersion = localStorage.getItem("farmiq_dismissed_update");
          const dismissedTime = localStorage.getItem("farmiq_dismissed_time");
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;

          const recentlyDismissed = dismissedVersion === data.latest_version && 
            dismissedTime && (now - parseInt(dismissedTime, 10)) < oneDay;

          if (data.force_update || !recentlyDismissed) {
            setUpdateInfo(data);
            setShowModal(true);
          }
        }
      }
    } catch (error) {
      // Gracefully skip update check if offline or server is sleeping
    }
  };

  const handleDismiss = () => {
    if (updateInfo && !updateInfo.force_update) {
      localStorage.setItem("farmiq_dismissed_update", updateInfo.latest_version);
      localStorage.setItem("farmiq_dismissed_time", Date.now().toString());
    }
    setShowModal(false);
  };

  const handleStartUpdate = () => {
    if (!updateInfo) return;
    setIsDownloading(true);
    setDownloadProgress(10);

    // Simulate progress and initiate direct APK download
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setDownloadComplete(true);
          // Trigger actual APK file download / browser intent
          window.location.href = updateInfo.apk_url;
          return 100;
        }
        return prev + 15;
      });
    }, 350);
  };

  if (!showModal || !updateInfo) return null;

  const title = isTelugu && updateInfo.title_te ? updateInfo.title_te : updateInfo.title;
  const notes = isTelugu && updateInfo.release_notes_te ? updateInfo.release_notes_te : updateInfo.release_notes;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border-2 border-primary/30 shadow-2xl rounded-3xl max-w-md w-full p-5 overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Glowing Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400" />

        {/* Header */}
        <div className="flex items-start justify-between mt-1 mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Smartphone className="h-6 w-6 text-emerald-600 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                  v{updateInfo.latest_version}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {updateInfo.apk_size_mb} MB
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground mt-0.5 leading-tight">
                {title}
              </h3>
            </div>
          </div>

          {!updateInfo.force_update && !isDownloading && (
            <button 
              onClick={handleDismiss}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Release Notes */}
        <div className="bg-muted/50 dark:bg-muted/20 border border-border/60 rounded-2xl p-3.5 mb-4 max-h-48 overflow-y-auto">
          <p className="text-xs font-bold text-foreground mb-2 flex items-center">
            <Sparkles className="h-3.5 w-3.5 text-primary mr-1" />
            {isTelugu ? "కొత్త ఫీచర్లు & మెరుగుదలలు:" : "What's New in this Version:"}
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {notes.map((note, idx) => (
              <li key={idx} className="flex items-start space-x-1.5 leading-snug">
                <span className="text-primary font-bold">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Download Progress Bar */}
        {isDownloading && (
          <div className="mb-4 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-foreground flex items-center">
                <RefreshCw className="h-3 w-3 text-primary animate-spin mr-1.5" />
                {downloadComplete ? (isTelugu ? "డౌన్‌లోడ్ పూర్తయింది! ఇన్‌స్టాల్ చేస్తోంది..." : "Download Complete! Installing...") : (isTelugu ? "అప్‌డేట్ డౌన్‌లోడ్ అవుతోంది..." : "Downloading Update Package...")}
              </span>
              <span className="font-bold text-primary">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300 rounded-full"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-1">
          {!updateInfo.force_update && !isDownloading && (
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 rounded-xl text-xs py-5 cursor-pointer font-medium"
            >
              {isTelugu ? "తర్వాత" : "Later"}
            </Button>
          )}

          <Button
            onClick={handleStartUpdate}
            disabled={isDownloading && !downloadComplete}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs py-5 font-bold shadow-md cursor-pointer"
          >
            {downloadComplete ? (
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {isTelugu ? "ఇన్‌స్టాల్ చేయండి" : "Install APK"}
              </span>
            ) : isDownloading ? (
              <span className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                {downloadProgress}%
              </span>
            ) : (
              <span className="flex items-center">
                <Download className="h-4 w-4 mr-1.5" />
                {isTelugu ? "ఇప్పుడే అప్‌డేట్ చేయండి" : "Update & Install Now"}
              </span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AppUpdateChecker;
