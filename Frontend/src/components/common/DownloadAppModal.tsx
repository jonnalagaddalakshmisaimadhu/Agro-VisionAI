import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Loader2,
  X
} from "lucide-react";

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APK_DOWNLOAD_URL = "https://github.com/jonnalagaddalakshmisaimadhu/Agro-VisionAI/raw/refs/heads/main/Frontend/android/release/FarmIQ.apk";

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  const startDownload = () => {
    setDownloadStarted(true);
    setProgress(30);

    // Direct browser file download of real compiled APK binary
    const link = document.createElement("a");
    link.href = APK_DOWNLOAD_URL;
    link.setAttribute("download", "FarmIQ.apk");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also trigger direct navigation fallback for mobile Chrome
    try {
      window.location.assign(APK_DOWNLOAD_URL);
    } catch (e) {}

    // Visual progress indicator
    const t1 = setTimeout(() => setProgress(65), 300);
    const t2 = setTimeout(() => setProgress(95), 700);
    const t3 = setTimeout(() => setProgress(100), 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  useEffect(() => {
    if (isOpen) {
      startDownload();
    } else {
      setDownloadStarted(false);
      setProgress(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white p-6 rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
        <DialogHeader className="text-center sm:text-center items-center pb-2">
          {/* Logo Badge */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-400 p-0.5 shadow-lg shadow-green-600/20 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <svg
                  viewBox="0 0 120 120"
                  className="w-10 h-10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="modalLeafCenter" x1="60" y1="10" x2="60" y2="70" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                  </defs>
                  <path d="M 58 74 C 34 70 18 52 26 34 C 42 30 54 48 58 74 Z" fill="#22c55e" />
                  <path d="M 62 74 C 86 70 102 52 94 34 C 78 30 66 48 62 74 Z" fill="#16a34a" />
                  <path d="M 60 14 C 46 32 50 56 60 76 C 70 56 74 32 60 14 Z" fill="url(#modalLeafCenter)" />
                  <path d="M 60 22 L 60 74" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-600 text-white p-1 rounded-full shadow">
              <Download className="w-3.5 h-3.5" />
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            Download FarmIQ Android APK
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 font-medium">
            Version 2.0 • 64.5 MB • Android 8.0+
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Download Progress Card */}
          <div className="bg-green-50/80 border border-green-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-green-900 mb-2">
              <div className="flex items-center gap-2">
                {progress < 100 ? (
                  <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
                <span>
                  {progress < 100 ? "Starting FarmIQ.apk download..." : "Downloading FarmIQ.apk (Check Notifications)"}
                </span>
              </div>
              <span className="text-green-700">{progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-green-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Quick Direct Download Button */}
          <button
            type="button"
            onClick={startDownload}
            className="w-full h-12 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all border-0"
          >
            <Download className="w-4 h-4" />
            Download FarmIQ.apk (64.5 MB)
          </button>

          {/* Quick 3-Step Install Guide */}
          <div className="space-y-2.5 pt-1">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Installation Steps:
            </p>

            <div className="grid gap-2">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <p className="text-xs text-gray-600 leading-tight">
                  When prompted by Chrome, tap <strong>Download anyway</strong> / <strong>Download</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <p className="text-xs text-gray-600 leading-tight">
                  Once downloaded, tap the file in your notification bar or <strong>Downloads</strong> folder.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <p className="text-xs text-gray-600 leading-tight">
                  Android will show the <strong>FarmIQ</strong> logo prompt. Tap <strong>Install</strong> to start!
                </p>
              </div>
            </div>
          </div>

          {/* Safety note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span>100% Virus-Free & Safe Official Build</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full rounded-xl h-11 border-gray-200 text-xs font-semibold"
              onClick={onClose}
            >
              Close / Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
