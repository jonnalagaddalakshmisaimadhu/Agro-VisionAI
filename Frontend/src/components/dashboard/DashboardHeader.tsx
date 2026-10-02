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
    // Check for existing language in localStorage or cookie
    const storedLang = localStorage.getItem('farmiq_language');
    if (storedLang) {
      setCurrentLang(storedLang);
      return;
    }

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
        localStorage.setItem('farmiq_language', targetLang);
      }
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem('farmiq_language', langCode);

    const hostname = window.location.hostname;
    if (langCode === 'en') {
      // Clear cookies to return to default English
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } else {
      // Set Google Translate cookies
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${hostname}`;
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${hostname}`;
      document.cookie = `googtrans=/auto/${langCode}; path=/;`;
    }

    // Perform quick reload to apply Google Translate cleanly
    setTimeout(() => {
      window.location.reload();
    }, 80);
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
    <header className="bg-card/95 backdrop-blur-md border-b border-border px-3 sm:px-4 pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pt-safe min-h-[3.75rem] sm:min-h-[4rem] h-auto py-2 flex items-center justify-between sticky top-0 z-40 shadow-xs transition-all">
      <GoogleTranslate />

      {/* Left section */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 text-foreground hover:bg-muted shrink-0"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        {/* Logo and brand */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Tractor className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-tight">FarmIQ</span>
            <span className="text-[10px] text-muted-foreground hidden sm:block leading-none">Smart Farming</span>
          </div>
        </div>
      </div>

      {/* Center section - Date */}
      <div className="hidden md:flex items-center">
        <div className="text-center">
          <p className="text-xs font-medium text-foreground">Today</p>
          <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">

        {/* Language Selector (Desktop) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5 h-8 px-2.5">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">{currentLanguageLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel>Select Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {INDIAN_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center justify-between cursor-pointer text-xs"
              >
                <span>{lang.label} ({lang.name})</span>
                {currentLang === lang.code && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Language Button (Icon only) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8 text-foreground hover:bg-muted">
              <Languages className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel>Select Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {INDIAN_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center justify-between cursor-pointer text-xs"
              >
                <span>{lang.name}</span>
                {currentLang === lang.code && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none shadow-xs">
              {notifications}
            </span>
          )}
        </Button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent p-0 ring-1 ring-border/70 overflow-hidden">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage src="/farmer-avatar.jpg" alt="Farmer" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {user?.username ? user.username.slice(0, 2).toUpperCase() : <User className="h-3.5 w-3.5" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.username || "Farmer User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || "farmer@farmiq.ai"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;