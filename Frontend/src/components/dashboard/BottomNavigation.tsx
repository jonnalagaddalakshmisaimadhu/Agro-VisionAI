import React, { useState } from "react";
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
  ShieldCheck,
  Search,
  Sparkles,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  onToggleSidebar?: () => void;
}

interface FeatureItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  color: string;
  bgColor: string;
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

  // 🌟 COMPLETE LIST OF ALL FEATURES FOR WINDOWS APPS HUB
  const allFeatures: FeatureItem[] = [
    {
      id: "crop-profit-predictor",
      label: "Crop Predictor",
      icon: TrendingUp,
      badge: "AI",
      badgeColor: "bg-emerald-600",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100/80 dark:bg-emerald-950/70"
    },
    {
      id: "disease-detection",
      label: "Disease Doctor",
      icon: Sprout,
      badge: "AI",
      badgeColor: "bg-emerald-600",
      color: "text-green-600",
      bgColor: "bg-green-100/80 dark:bg-green-950/70"
    },
    {
      id: "marketplace",
      label: "Crop Trade",
      icon: ShoppingCart,
      badge: "0% Fee",
      badgeColor: "bg-teal-600",
      color: "text-teal-600",
      bgColor: "bg-teal-100/80 dark:bg-teal-950/70"
    },
    {
      id: "farmer-market",
      label: "Farm Inputs",
      icon: Package,
      badge: "Seeds",
      badgeColor: "bg-amber-600",
      color: "text-amber-600",
      bgColor: "bg-amber-100/80 dark:bg-amber-950/70"
    },
    {
      id: "rentals",
      label: "Equipment Rentals",
      icon: Truck,
      badge: "Machinery",
      badgeColor: "bg-orange-600",
      color: "text-orange-600",
      bgColor: "bg-orange-100/80 dark:bg-orange-950/70"
    },
    {
      id: "market-supply-tracker",
      label: "Weather & Alerts",
      icon: CloudRain,
      badge: "Live",
      badgeColor: "bg-sky-600",
      color: "text-sky-600",
      bgColor: "bg-sky-100/80 dark:bg-sky-950/70"
    },
    {
      id: "government-schemes",
      label: "Govt Schemes",
      icon: FileText,
      badge: "Gov",
      badgeColor: "bg-indigo-600",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100/80 dark:bg-indigo-950/70"
    },
    {
      id: "video-session",
      label: "Video Sessions",
      icon: Video,
      badge: "Live",
      badgeColor: "bg-rose-600",
      color: "text-rose-600",
      bgColor: "bg-rose-100/80 dark:bg-rose-950/70"
    },
    {
      id: "help",
      label: "Kisan Help",
      icon: MessageCircle,
      badge: "24/7",
      badgeColor: "bg-purple-600",
      color: "text-purple-600",
      bgColor: "bg-purple-100/80 dark:bg-purple-950/70"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      color: "text-slate-600",
      bgColor: "bg-slate-100/80 dark:bg-slate-800"
    }
  ];

  const handleSelect = (id: string) => {
    setActiveModule(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* 🌑 Dim Backdrop when Menu is Open */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🪟 WINDOWS APPS HUB POPUP (Above center button) */}
      {isOpen && (
        <div className="lg:hidden fixed bottom-20 left-3 right-3 max-w-sm mx-auto z-55 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-card border-2 border-border/80 shadow-2xl rounded-3xl p-4 overflow-hidden">
            
            {/* Hub Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-xs" />
                    <div className="w-1.5 h-1.5 bg-white rounded-xs" />
                    <div className="w-1.5 h-1.5 bg-white rounded-xs" />
                    <div className="w-1.5 h-1.5 bg-white rounded-xs" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-none">FarmIQ All Features</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Select any smart farming tool</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 3-Column Apps Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-0.5 pb-1">
              {allFeatures.map((feat) => {
                const isSelected = activeModule === feat.id;
                return (
                  <button
                    key={feat.id}
                    onClick={() => handleSelect(feat.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-200 active:scale-95 group",
                      isSelected 
                        ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary" 
                        : "bg-background/80 hover:bg-muted/60 border-border/60"
                    )}
                  >
                    {/* App Icon Circle */}
                    <div className={cn("p-2 rounded-xl mb-1.5 shadow-xs transition-transform group-hover:scale-105", feat.bgColor, feat.color)}>
                      <feat.icon className="h-5 w-5" />
                    </div>

                    {/* App Title */}
                    <span className="text-[11px] font-semibold text-foreground text-center line-clamp-1 leading-tight">
                      {feat.label}
                    </span>

                    {/* Badge */}
                    {feat.badge && (
                      <span className={cn(
                        "absolute -top-1 -right-1 px-1.5 py-0.2 text-[8px] font-bold text-white rounded-full shadow-xs",
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
