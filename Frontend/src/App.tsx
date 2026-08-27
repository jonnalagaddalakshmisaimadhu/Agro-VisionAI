import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import SimpleLoginPage from "./pages/SimpleLogin";
import SimpleRegisterPage from "./pages/SimpleRegister";
import QuickLoginPage from "./pages/QuickLogin";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { WeatherProvider } from "@/components/dashboard/WeatherContext";
import ProfilePage from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ExpertConsultation from "./components/modules/ExpertConsultation";
import AccuracyTest from "./components/modules/AccuracyTest";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginDemo from "./components/LoginDemo";
import DiseaseDetection from "./components/modules/DiseaseDetection";
import { FarmIQAssistance } from "./components/chatbot/FarmIQAssistance";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <WeatherProvider>
          <LocationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<SimpleRegisterPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login-demo" element={<LoginDemo />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/expert-consultation" element={<ProtectedRoute><ExpertConsultation /></ProtectedRoute>} />
                <Route path="/accuracy-test" element={<ProtectedRoute><AccuracyTest /></ProtectedRoute>} />
                <Route path="/disease-detection" element={<ProtectedRoute><DiseaseDetection /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FarmIQAssistance />
            </BrowserRouter>
          </LocationProvider>
        </WeatherProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
