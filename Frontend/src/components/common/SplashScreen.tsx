import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(15);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Smooth progress animation to 100%
    const p1 = setTimeout(() => setProgress(45), 300);
    const p2 = setTimeout(() => setProgress(75), 800);
    const p3 = setTimeout(() => setProgress(100), 1400);

    // Fade out and finish transition
    const fadeTimer = setTimeout(() => setFade(true), 1800);
    const finishTimer = setTimeout(() => onFinish(), 2200);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-gray-900 select-none transition-opacity duration-500 ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center justify-center px-4 max-w-sm w-full animate-in fade-in zoom-in-95 duration-700">
        {/* Premium Organic 3-Leaf Emblem Logo */}
        <div className="relative mb-6 flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            className="w-28 h-28 drop-shadow-[0_12px_24px_rgba(22,163,74,0.22)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="centerLeafGrad" x1="60" y1="10" x2="60" y2="70" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="leftLeafGrad" x1="20" y1="35" x2="60" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <linearGradient id="rightLeafGrad" x1="100" y1="35" x2="60" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>

            {/* Left Leaf */}
            <path
              d="M 58 74 C 34 70 18 52 26 34 C 42 30 54 48 58 74 Z"
              fill="url(#leftLeafGrad)"
            />

            {/* Right Leaf */}
            <path
              d="M 62 74 C 86 70 102 52 94 34 C 78 30 66 48 62 74 Z"
              fill="url(#rightLeafGrad)"
            />

            {/* Center Top Leaf */}
            <path
              d="M 60 14 C 46 32 50 56 60 76 C 70 56 74 32 60 14 Z"
              fill="url(#centerLeafGrad)"
            />

            {/* Delicate Center Leaf Vein */}
            <path
              d="M 60 22 L 60 74"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Left Vein Accent */}
            <path
              d="M 60 48 Q 44 46 35 40"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.75"
            />
            {/* Right Vein Accent */}
            <path
              d="M 60 48 Q 76 46 85 40"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Bottom Stem Anchor */}
            <path
              d="M 60 74 L 60 84"
              stroke="#15803d"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Brand Title: Farm (Dark Charcoal) + IQ (Vibrant Green) */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight flex items-center justify-center mb-1">
          <span className="text-[#1e293b]">Farm</span>
          <span className="text-[#16a34a] ml-0.5">IQ</span>
        </h1>

        {/* Subtitle with exact styling */}
        <p className="text-sm font-semibold tracking-wide text-gray-500 mb-9 text-center">
          <span className="text-[#475569]">Smart Farming, </span>
          <span className="text-[#16a34a]">Better Future</span>
        </p>

        {/* Professional Animated Progress Bar with Centered Leaf Indicator Badge */}
        <div className="relative w-48 sm:w-56 h-7 flex items-center justify-center">
          {/* Base Track */}
          <div className="absolute inset-x-0 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            {/* Animated Green Fill */}
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Centered Circular Floating Badge with Small Leaf */}
          <div className="relative z-10 w-6 h-6 rounded-full bg-white shadow-md shadow-green-600/15 border border-gray-100 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 text-green-600 fill-current"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.49 9.49 0 0 0 17 8zM21 3c-7 0-11 4-11 9 3 0 6-1 8-3 2-2 3-6 3-6z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
