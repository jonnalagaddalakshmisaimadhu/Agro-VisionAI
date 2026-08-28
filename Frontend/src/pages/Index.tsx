import { useState } from "react";
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
  
  // Only the installed native mobile app starts from the animated loading/splash screen!
  // The website (desktop or mobile web browser) starts directly from the Landing Page.
  const isNative = Capacitor.isNativePlatform();
  const [showSplash, setShowSplash] = useState(isNative);

  const handleLoginClick = () => {
    navigate("/login");
  };

  // 1. If running inside installed native mobile app -> Start with Pleasant Loading Screen
  if (showSplash && isNative) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. If user is already authenticated (Logged in) -> Open FarmIQ Dashboard
  if (user) {
    return <Dashboard />;
  }

  // 3. If running inside installed native mobile app (not yet logged in) -> Open Login Page
  if (isNative) {
    return <AuthPage />;
  }

  // 4. If visiting the Website from web browser (Desktop / Mobile web) -> Start from Landing Page!
  return <LandingPage onClickLogin={handleLoginClick} />;
};

export default Index;

