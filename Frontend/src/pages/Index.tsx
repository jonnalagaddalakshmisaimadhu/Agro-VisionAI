import { useNavigate } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/context/AuthContext";
import { Capacitor } from "@capacitor/core";
import { useState, useEffect } from "react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => {
    return Capacitor.isNativePlatform() || window.innerWidth < 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(Capacitor.isNativePlatform() || window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLoginClick = () => {
    navigate("/login");
  };

  // On Native Android App (Capacitor), mobile viewports, or authenticated sessions:
  // Directly launch into the functional FarmIQ App Dashboard with 5-Tab & Center Hub UI!
  if (user || isMobile || Capacitor.isNativePlatform()) {
    return <Dashboard />;
  }

  return <LandingPage onClickLogin={handleLoginClick} />;
};

export default Index;

