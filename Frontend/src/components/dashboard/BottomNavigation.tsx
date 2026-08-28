import React, { useState } from "react";
import { 
  Home, 
  TrendingUp, 
  Sprout, 
  ShoppingCart, 
  LayoutGrid, 
  X, 
  CloudRain, 
  FileText, 
  Truck, 
  MessageCircle, 
  Video,
  Sparkles,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  onToggleSidebar?: () => void;
}

interface QuickFeature {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const BottomNavigation = ({ activeModule, setActiveModule }: BottomNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Left & Right Primary Bar Items
  const leftNavItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "crop-profit-predictor", icon: TrendingUp, label: "Predict" },
  ];

  const rightNavItems = [
    { id: "disease-detection", icon: Sprout, label: "Disease" },
    { id: "marketplace", icon: ShoppingCart, label: "Market" },
  ];

  // All Remaining & Quick Features for Circular Popup Hub
  const circularFeatures: QuickFeature[] = [
    {
      id: "market-supply-tracker",
      label: "Weather & Alerts",
      shortLabel: "Weather",
      icon: CloudRain,
      badge: "Live",
      color: "text-sky-500",
      bgColor: "bg-sky-50 dark:bg-sky-950/60",
      borderColor: "border-sky-200 dark:border-sky-800"
    },
    {
      id: "government-schemes",
      label: "Govt Schemes",
      shortLabel: "Schemes",
      icon: FileText,
      badge: "Gov",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/60",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    },
    {
      id: "rentals",
      label: "Equipment Rentals",
      shortLabel: "Rentals",
      icon: Truck,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/60",
      borderColor: "border-amber-200 dark:border-amber-800"
    },
    {
      id: "video-session",
      label: "Live Video Sessions",
      shortLabel: "Video",
      badge: "New",
      icon: Video,
      color: "text-rose-500",
      bgColor: "bg-rose-50 dark:bg-rose-950/60",
      borderColor: "border-rose-200 dark:border-rose-800"
    },
    {
      id: "help",
      label: "Help & Knowledge",
      shortLabel: "Help",
      icon: MessageCircle,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/60",
      borderColor: "border-indigo-200 dark:border-indigo-800"
    },
    {
      id: "disease-detection",
      label: "Disease Scanner",
      shortLabel: "Doctor AI",
      badge: "AI",
      icon: Sprout,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/60",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    }
  ];

  const handleSelect = (id: string) => {
    setActiveModule(id);
    setIsOpen(false);
  };

  // Radial positioning math for circular arc (angles from 170° to 10°)
  const radius = 125; // Distance in px from center button
  const totalItems = circularFeatures.length;

  return (
    <>
      {/* Dim Backdrop when Circular Menu is Open */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🎡 Circular Radial Menu Popup from Center Button */}
      {isOpen && (
        <div className="lg:hidden fixed bottom-16 left-1/2 -translate-x-1/2 z-55 pointer-events-none">
          {/* Radial Wheel Container */}
          <div className="relative w-72 h-44 flex items-end justify-center pointer-events-auto">
            {circularFeatures.map((feat, index) => {
              // Calculate radial angle in an arc over the center button
              // Distribute evenly from 170 deg to 10 deg
              const angleDeg = 170 - (index * (160 / (totalItems - 1)));
              const angleRad = (angleDeg * Math.PI) / 180;
              const x = Math.round(Math.cos(angleRad) * radius);
              const y = Math.round(-Math.sin(angleRad) * radius);

              const isSelected = activeModule === feat.id;

              return (
                <div
                  key={feat.id}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    transitionDelay: `${index * 35}ms`
                  }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out animate-in zoom-in-50"
                >
                  <button
                    onClick={() => handleSelect(feat.id)}
                    className={cn(
                      "group flex flex-col items-center justify-center p-2 rounded-2xl border shadow-lg bg-card backdrop-blur-md hover:scale-110 active:scale-95 transition-all duration-200 w-16 h-16",
                      feat.borderColor,
                      isSelected ? "ring-2 ring-primary shadow-primary/20 scale-105" : "hover:border-primary/50"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-xl mb-0.5", feat.bgColor, feat.color)}>
                      <feat.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[9px] font-bold text-foreground truncate w-full text-center leading-tight">
                      {feat.shortLabel}
                    </span>
                    {feat.badge && (
                      <span className="absolute -top-1 -right-1 px-1 py-0.1 text-[8px] font-extrabold rounded-full bg-primary text-primary-foreground shadow-xs">
                        {feat.badge}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Central Glow Halo */}
            <div className="absolute -bottom-2 w-28 h-28 rounded-full bg-primary/20 blur-xl pointer-events-none -z-10 animate-pulse" />
          </div>
        </div>
      )}

      {/* 📱 Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 px-2 pb-safe shadow-lg">
        <div className="flex justify-between items-center h-16 max-w-md mx-auto relative">
          
          {/* Left Nav Items */}
          <div className="flex flex-1 justify-around items-center">
            {leftNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-all",
                  activeModule === item.id ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-transform", activeModule === item.id && "scale-110")} />
                <span className="text-[10px]">{item.label}</span>
              </button>
            ))}
          </div>

          {/* 🪟 CENTER WINDOWS-STYLE FLOATING HUB BUTTON */}
          <div className="relative -top-5 flex flex-col items-center px-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "w-13 h-13 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform active:scale-95 border-4 border-card ring-2",
                isOpen 
                  ? "bg-destructive text-white ring-destructive/30 rotate-90 scale-105" 
                  : "bg-gradient-to-tr from-emerald-600 via-teal-600 to-green-500 text-white ring-primary/30 hover:scale-105 shadow-emerald-600/30"
              )}
              aria-label="Toggle Features Menu"
            >
              {isOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                /* Windows 4-Square Style Grid Logo */
                <div className="grid grid-cols-2 gap-1 p-0.5">
                  <div className="w-2.5 h-2.5 bg-white rounded-xs opacity-95 group-hover:scale-105 transition-transform" />
                  <div className="w-2.5 h-2.5 bg-white/90 rounded-xs opacity-95 group-hover:scale-105 transition-transform" />
                  <div className="w-2.5 h-2.5 bg-white/90 rounded-xs opacity-95 group-hover:scale-105 transition-transform" />
                  <div className="w-2.5 h-2.5 bg-white rounded-xs opacity-95 group-hover:scale-105 transition-transform" />
                </div>
              )}
            </button>
            <span className={cn(
              "text-[10px] font-bold mt-0.5 transition-colors",
              isOpen ? "text-destructive" : "text-primary"
            )}>
              {isOpen ? "Close" : "Apps"}
            </span>
          </div>

          {/* Right Nav Items */}
          <div className="flex flex-1 justify-around items-center">
            {rightNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-all",
                  activeModule === item.id ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-transform", activeModule === item.id && "scale-110")} />
                <span className="text-[10px]">{item.label}</span>
              </button>
            ))}
          </div>

        </div>
      </nav>
    </>
  );
};

export default BottomNavigation;
