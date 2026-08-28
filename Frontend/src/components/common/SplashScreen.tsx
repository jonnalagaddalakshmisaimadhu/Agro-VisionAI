import { useEffect, useState } from "react";
import { Sprout, Loader2 } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Start fading out after 1.4s
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 1400);

    // Call onFinish callback after 1.8s
    const timer2 = setTimeout(() => {
      onFinish();
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-gray-900 transition-opacity duration-500 ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
        {/* Glowing Centered App Icon */}
        <div className="relative mb-4">
          <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-emerald-400 rounded-3xl blur-md opacity-40 animate-pulse"></div>
          <div className="relative w-20 h-20 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-green-600/30">
            <Sprout className="w-11 h-11 text-white stroke-[2.5]" />
          </div>
        </div>

        {/* App Title */}
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
          Farm<span className="text-green-600">IQ</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm font-medium text-gray-500 tracking-wide">
          Smart Farming, Better Future
        </p>

        {/* Subtle Spinner */}
        <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-green-600/80 bg-green-50 px-3 py-1.5 rounded-full border border-green-200/60">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
          <span>Starting FarmIQ...</span>
        </div>
      </div>
    </div>
  );
};
