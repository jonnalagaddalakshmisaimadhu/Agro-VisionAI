import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  TrendingUp,
  BarChart3,
  FileText,
  Truck,
  ShoppingCart,
  MessageCircle,
  Settings,
  Sprout,
  X,
  Youtube,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeModule,
  setActiveModule,
  isCollapsed,
  onToggle
}) => {
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      badge: null
    },
    {
      id: "crop-profit-predictor",
      icon: TrendingUp,
      label: "Crop Profit Predictor",
      badge: "AI"
    },
    {
      id: "market-supply-tracker",
      icon: BarChart3,
      label: "Weather & alerts",
      badge: "Live"
    },
    {
      id: "government-schemes",
      icon: FileText,
      label: "Government Schemes",
      badge: "Gov"
    },
    {
      id: "marketplace",
      icon: ShoppingCart,
      label: "Marketplace",
      badge: null
    },
    {
      id: "disease-detection",
      icon: Sprout,
      label: "Crop Disease Detection",
      badge: "AI"
    },
    {
      id: "rentals",
      icon: Truck,
      label: "Equipment Rentals",
      badge: null
    },
    {
      id: "help",
      icon: MessageCircle,
      label: "Help",
      badge: null
    },
    {
      id: "video-session",
      icon: Youtube,
      label: "Video Session",
      badge: "New"
    }
  ];

  return (
    <TooltipProvider delayDuration={150}>
      {/* Mobile backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 shadow-xs z-40 transition-all duration-300 ease-in-out flex flex-col justify-between overflow-hidden",
          "lg:fixed lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0",
          isCollapsed ? "-translate-x-full lg:w-16" : "translate-x-0 w-72"
        )}
      >
        {/* Top Header */}
        <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center space-x-2.5 min-w-0">
              <Sprout className="h-5 w-5 text-green-700 shrink-0" />
              <span className="font-bold text-base text-slate-900 tracking-tight truncate">
                Navigation
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <Sprout className="h-5 w-5 text-green-700" />
            </div>
          )}

          {/* Desktop collapse toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hidden lg:flex h-7 w-7 text-slate-600 hover:text-slate-900"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="lg:hidden h-8 w-8 text-slate-600 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navigationItems.map((item) => {
            const isActive = activeModule === item.id;
            const Icon = item.icon;

            const buttonContent = (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveModule(item.id);
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={cn(
                  "group relative w-full h-11 flex items-center rounded-xl font-semibold transition-all outline-none select-none",
                  isCollapsed ? "justify-center px-0" : "px-3",
                  isActive
                    ? "bg-[#15803d] text-white shadow-sm"
                    : "text-slate-900 hover:text-slate-950 hover:bg-slate-100/90"
                )}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-transform duration-150",
                    isActive ? "text-white" : "text-slate-900",
                    !isCollapsed && "mr-2.5"
                  )}
                />

                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className={cn("text-[13px] font-semibold whitespace-nowrap text-left leading-none", isActive ? "text-white" : "text-slate-900")}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={cn(
                          "ml-2 px-2 py-0.5 text-[10.5px] font-semibold rounded-full border shrink-0 transition-colors",
                          isActive
                            ? "bg-white text-[#15803d] border-white/40 shadow-xs"
                            : "bg-white text-slate-800 border-slate-300 shadow-xs"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-1.5 font-semibold text-slate-900 bg-white border border-slate-200 shadow-md">
                    {item.label}
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-slate-300 bg-slate-100 text-slate-800 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return buttonContent;
          })}
        </nav>

        {/* Bottom Settings */}
        <div className="p-3 border-t border-slate-200 shrink-0 bg-white">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="w-full h-11 flex items-center justify-center rounded-xl text-slate-900 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                >
                  <Settings className="h-5 w-5 text-slate-900" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-semibold text-slate-900 bg-white border border-slate-200 shadow-md">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="w-full h-11 px-3.5 flex items-center rounded-xl text-[14.5px] font-semibold text-slate-900 hover:text-slate-950 hover:bg-slate-100 transition-colors"
            >
              <Settings className="h-5 w-5 mr-3.5 shrink-0 text-slate-900" />
              <span className="truncate">Settings</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default DashboardSidebar;