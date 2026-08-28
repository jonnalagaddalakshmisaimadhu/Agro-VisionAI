import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, 
  TrendingUp, 
  Sprout, 
  ShoppingCart, 
  X, 
  CloudRain, 
  FileText, 
  Truck, 
  MessageCircle, 
  Video,
  Package,
  Settings,
  Stethoscope,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  onToggleSidebar?: () => void;
}

interface RemainingFeature {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  color: string;
  bgColor: string;
  route?: string;
}

const BottomNavigation = ({ activeModule, setActiveModule }: BottomNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // 4 Primary Navigation Items displayed on the bottom bar
  const leftNavItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "crop-profit-predictor", icon: TrendingUp, label: "Predict" },
  ];

  const rightNavItems = [
    { id: "disease-detection", icon: Sprout, label: "Disease" },
    { id: "marketplace", icon: ShoppingCart, label: "Market" },
  ];

  // 🌟 ONLY REMAINING FEATURES (Excluded items already in bottom bar: Home, Predict, Disease, Market)
  const remainingFeatures: RemainingFeature[] = [
    {
      id: "market-supply-tracker",
      label: "Weather",
      icon: CloudRain,
      badge: "Live",
      badgeColor: "bg-sky-500",
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-100/90 dark:bg-sky-950/80"
    },
    {
      id: "government-schemes",
      label: "Schemes",
      icon: FileText,
      badge: "Gov",
      badgeColor: "bg-indigo-500",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100/90 dark:bg-indigo-950/80"
    },
    {
      id: "rentals",
      label: "Rentals",
      icon: Truck,
      badge: "Hire",
      badgeColor: "bg-orange-500",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100/90 dark:bg-orange-950/80"
    },
    {
      id: "farmer-market",
      label: "Inputs",
      icon: Package,
      badge: "Seeds",
      badgeColor: "bg-amber-500",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100/90 dark:bg-amber-950/80"
    },
    {
      id: "video-session",
      label: "Video",
      icon: Video,
      badge: "Live",
      badgeColor: "bg-rose-500",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-100/90 dark:bg-rose-950/80"
    },
    {
      id: "help",
      label: "Help",
      icon: MessageCircle,
      badge: "24/7",
      badgeColor: "bg-purple-500",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100/90 dark:bg-purple-950/80"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      color: "text-slate-600 dark:text-slate-300",
      bgColor: "bg-slate-100 dark:bg-slate-800",
      route: "/settings"
    }
  ];

  const handleSelect = (feat: RemainingFeature | { id: string }) => {
    setIsOpen(false);
    if ('route' in feat && feat.route) {
      navigate(feat.route);
    } else {
      setActiveModule(feat.id);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* 🌑 Dim Backdrop when Menu is Open */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] transition-opacity duration-200 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🪟 COMPACT POPUP - SMALL LOGOS WITH NAMES */}
      {isOpen && (
        <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 w-[310px] z-[70] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          <div className="bg-card border border-border/90 shadow-2xl rounded-2xl p-3">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border/60">
              <div className="flex items-center space-x-1.5">
                <div className="p-1 rounded-md bg-emerald-600 text-white shadow-xs">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1 h-1 bg-white rounded-xs" />
                    <div className="w-1 h-1 bg-white rounded-xs" />
                    <div className="w-1 h-1 bg-white rounded-xs" />
                    <div className="w-1 h-1 bg-white rounded-xs" />
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground">More Services</span>
              </div>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Compact 4-Column Grid of Small Logos with Names */}
            <div className="grid grid-cols-4 gap-2">
              {remainingFeatures.map((feat) => {
                const isSelected = activeModule === feat.id;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(feat);
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-150 active:scale-90 group cursor-pointer pointer-events-auto select-none",
                      isSelected 
                        ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary" 
                        : "bg-background hover:bg-muted/60 border-border/50"
                    )}
                  >
                    {/* Small Logo / Icon */}
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-1 shadow-xs transition-transform group-hover:scale-105", feat.bgColor, feat.color)}>
                      <feat.icon className="h-4 w-4" />
                    </div>

                    {/* Feature Name */}
                    <span className="text-[10px] font-medium text-foreground text-center leading-tight truncate w-full">
                      {feat.label}
                    </span>

                    {/* Small Badge */}
                    {feat.badge && (
                      <span className={cn(
                        "absolute -top-1 -right-1 px-1 py-0.1 text-[7px] font-bold text-white rounded-full shadow-xs leading-none",
                        feat.badgeColor || "bg-primary"
                      )}>
                        {feat.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* 📱 Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-[65] px-2 pb-safe shadow-lg">
        <div className="flex justify-between items-center h-16 max-w-md mx-auto relative">
          
          {/* Left Nav Items */}
          <div className="flex flex-1 justify-around items-center">
            {leftNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-all cursor-pointer",
                  activeModule === item.id ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-transform", activeModule === item.id && "scale-110")} />
                <span className="text-[10px]">{item.label}</span>
              </button>
            ))}
          </div>

          {/* 🪟 CENTER WINDOWS-STYLE FLOATING HUB BUTTON */}
          <div className="relative -top-4 flex flex-col items-center px-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 transform active:scale-95 border-3 border-card ring-2 cursor-pointer",
                isOpen 
                  ? "bg-destructive text-white ring-destructive/30 rotate-90 scale-105" 
                  : "bg-gradient-to-tr from-emerald-600 via-teal-600 to-green-500 text-white ring-primary/30 hover:scale-105 shadow-emerald-600/30"
              )}
              aria-label="Toggle Features Menu"
            >
              {isOpen ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                /* Windows 4-Square Style Grid Logo */
                <div className="grid grid-cols-2 gap-0.5 p-0.5 pointer-events-none">
                  <div className="w-2 h-2 bg-white rounded-xs opacity-95" />
                  <div className="w-2 h-2 bg-white/90 rounded-xs opacity-95" />
                  <div className="w-2 h-2 bg-white/90 rounded-xs opacity-95" />
                  <div className="w-2 h-2 bg-white rounded-xs opacity-95" />
                </div>
              )}
            </button>
            <span className={cn(
              "text-[9px] font-bold mt-0.5 transition-colors",
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
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-all cursor-pointer",
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
