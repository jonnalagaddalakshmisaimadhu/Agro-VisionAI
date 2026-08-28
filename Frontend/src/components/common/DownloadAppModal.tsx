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

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        onClose();
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions for Chrome/Safari mobile
      alert("To install on your phone:\n1. Tap the 3 dots (⋮) in Chrome or Share button in Safari\n2. Select 'Add to Home screen' or 'Install App'\n3. FarmIQ will appear as a native app on your phone!");
    }
  };

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
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            Install FarmIQ on Mobile
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 font-medium">
            Smart Farming AI • Fast & Free
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Quick 1-Tap Install Button */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/80 border border-green-200/80 rounded-2xl p-4 text-center space-y-3">
            <p className="text-xs text-green-900 font-medium leading-relaxed">
              Install FarmIQ directly onto your phone's Home Screen for instant 1-tap access with full offline support.
            </p>
            
            <Button
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-600/25 flex items-center justify-center gap-2"
              onClick={handleInstallPWA}
            >
              <Download className="w-4 h-4" />
              {deferredPrompt ? "Install App on Phone" : "Add to Home Screen (1-Tap Install)"}
            </Button>
          </div>

          {/* Quick 3-Step Install Guide */}
          <div className="space-y-2.5 pt-1">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              2 Easy Ways to Use on Mobile:
            </p>

            <div className="grid gap-2">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                  A
                </span>
                <p className="text-xs text-gray-600 leading-tight">
                  <strong>Instant App (Recommended):</strong> Tap the <strong>Install / Add to Home Screen</strong> button above. FarmIQ installs immediately on your mobile without needing an APK file!
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                  B
                </span>
                <p className="text-xs text-gray-600 leading-tight">
                  <strong>Android APK Sideload:</strong> You can also copy the pre-built <code>app-debug.apk</code> from your project folder directly to your Android device.
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
              Close / Got It
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
