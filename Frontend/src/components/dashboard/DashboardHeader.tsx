import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import {
  Tractor,
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
  Languages,
  Check
} from "lucide-react";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

import { useAuth } from "@/context/AuthContext";
import { useWeather } from "@/components/dashboard/WeatherContext";
import GoogleTranslate from "@/components/common/GoogleTranslate";

const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', label: 'English' },
  { code: 'hi', name: 'Hindi', label: 'हिंदी' },
  { code: 'bn', name: 'Bengali', label: 'বাংলা' },
  { code: 'te', name: 'Telugu', label: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', label: 'मराठी' },
  { code: 'ta', name: 'Tamil', label: 'தமிழ்' },
  { code: 'ur', name: 'Urdu', label: 'اردو' },
  { code: 'gu', name: 'Gujarati', label: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', label: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', label: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', label: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', label: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', label: 'অসমীয়া' },
] as const;

const DashboardHeader = ({ onToggleSidebar, sidebarCollapsed }: DashboardHeaderProps) => {
  // Use alerts from WeatherContext
  const { alerts } = useWeather();
  const notifications = alerts.length;

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // Check for existing language cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const cookieLang = getCookie('googtrans');
    if (cookieLang) {
      // googtrans cookie format is /source/target (e.g., /en/hi)
      const targetLang = cookieLang.split('/').pop();
      if (targetLang) {
        setCurrentLang(targetLang);
      }
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    // Set google translate cookie
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/en/${langCode}; path=/;`; // fallback for some browsers

    // Allow React state to update before reload
    setCurrentLang(langCode);

    // Reload page to apply translation
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Get today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentLanguageLabel = INDIAN_LANGUAGES.find(l => l.code === currentLang)?.name || 'English';

  return (
    <header className="bg-card border-b border-border px-4 py-3 h-16 flex items-center justify-between sticky top-0 z-40">
      <GoogleTranslate />

      {/* Left section */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo and brand */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Tractor className="h-8 w-8 text-primary" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">FarmIQ</h1>
              <p className="text-xs text-muted-foreground">Smart Farming Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Center section - Date */}
      <div className="hidden md:flex items-center">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Today</p>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
              <Languages className="h-5 w-5" />
              <span className="text-sm hidden lg:inline">{currentLanguageLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel>Select Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {INDIAN_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{lang.label} ({lang.name})</span>
                {currentLang === lang.code && <Check className="h-4 w-4 text-green-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Language Button (Icon only) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="sm:hidden">
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel>Select Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {INDIAN_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{lang.name}</span>
                {currentLang === lang.code && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {notifications}
            </span>
          )}
        </Button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/farmer-avatar.jpg" alt="Farmer" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">{user?.username || "Guest"}</p>
                <p className="text-xs text-muted-foreground">Farmer</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-card" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;