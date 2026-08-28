import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";
import AuthPage from "@/pages/Auth";
import { useAuth } from "@/context/AuthContext";
import { SplashScreen } from "@/components/common/SplashScreen";
import { Capacitor } from "@capacitor/core";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
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

  // 1. Show Clean Animated Native Splash Screen on Launch (Centered App Logo + Title)
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. If user is already authenticated -> Open Dashboard
  if (user) {
    return <Dashboard />;
  }

  // 3. On Native Android/iOS App (Capacitor) or Mobile screens -> Ask for Login Page directly!
  if (isMobile || Capacitor.isNativePlatform()) {
    return <AuthPage />;
  }

  // 4. On Desktop Web Browser -> Show Marketing Landing Page
  return <LandingPage onClickLogin={handleLoginClick} />;
};

export default Index;

