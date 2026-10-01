import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import DashboardMainContent from "./dashboard/DashboardMainContent";
import DashboardFooter from "./dashboard/DashboardFooter";
import BottomNavigation from "./dashboard/BottomNavigation";
import CropRecommendation from "./modules/CropRecommendation";
import DiseaseDetection from "./modules/DiseaseDetection";
import Marketplace from "./modules/Marketplace";
import EquipmentRental from "./modules/EquipmentRental";
import FarmMarket from "./modules/FarmMarket";
import WeatherAlerts from "./modules/WeatherAlerts";
import GovernmentSchemes from "./modules/GovernmentSchemes";
import HelpPage from "./modules/HelpPage";
import VideoSession from "./modules/VideoSession";
import SettingsPage from "@/pages/Settings";
import { WeatherProvider } from "@/components/dashboard/WeatherContext";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { Suspense } from "react";

const Dashboard = () => {
  const [activeModule, setActiveModuleState] = useState(() => {
    return localStorage.getItem("farmiq_active_module") || "home";
  });

  const setActiveModule = (module: string) => {
    localStorage.setItem("farmiq_active_module", module);
    setActiveModuleState(module);
  };

  // Initialize sidebar based on screen size (collapsed on mobile by default)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);

  // Update sidebar state on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderModuleContent = () => {
    switch (activeModule) {
      // farmiq-assistance removed from UI
      case "crop-recommendation":
      case "crop-profit-predictor":
        return <CropRecommendation />;
      case "disease-detection":
        return <DiseaseDetection />;
      case "marketplace":
        return <Marketplace />;
      case "market-place":
      case "farmer-market":
        return <FarmMarket />;
      case "equipment-rental":
      case "rentals":
        return <EquipmentRental />;
      case "weather-alerts":
      case "market-supply-tracker":
        return <WeatherAlerts />;
      case "government-schemes":
        return <GovernmentSchemes />;
      case "help":
        return <HelpPage setActiveModule={setActiveModule} />;
      case "settings":
        return <SettingsPage />;
      case "video-session":
        return <VideoSession />;
      case "home":
      default:
        return <DashboardMainContent activeModule={activeModule} setActiveModule={setActiveModule} />;
    }
  };

  return (
    <WeatherProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <DashboardHeader
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <div className="flex flex-1 relative">
          {/* Sidebar */}
          <DashboardSidebar
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main Content */}
          <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 pb-20 lg:pb-0 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'
            }`}>
            <div className="flex-1 overflow-auto">
              <ErrorBoundary key={activeModule} onReset={() => setActiveModule("home")}>
                {renderModuleContent()}
              </ErrorBoundary>
            </div>

            {/* Footer */}
            <DashboardFooter />
          </main>
        </div>

        {/* Bottom Navigation for Mobile */}
        <BottomNavigation
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
    </WeatherProvider>
  );
};

export default Dashboard;