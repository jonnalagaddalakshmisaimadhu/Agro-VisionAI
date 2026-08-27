import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Lock, Eye, EyeOff, Sprout, Loader2 } from "lucide-react";
import tractorBg from "@/assets/farmiq-tractor-login-bg.png";

const AuthPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (authError) setAuthError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Validate required fields
    if (!formData.username.trim()) {
      setAuthError("Username is required");
      return;
    }

    if (!formData.password.trim()) {
      setAuthError("Password is required");
      return;
    }

    setIsLoading(true);

    try {
      const ok = await login(formData.username.trim(), formData.password);
      if (!ok) {
        setAuthError("Invalid username or password");
        return;
      }
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      setAuthError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const ok = await loginWithGoogle();
      if (ok) {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        setAuthError("Google Sign-in failed. Please try again.");
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      setAuthError("Google Sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center lg:justify-end p-4 sm:p-6 lg:pr-24 xl:pr-36">
      {/* FarmIQ Tractor Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${tractorBg})`,
        }}
      />

      {/* Main Login Card Container */}
      <div className="relative z-10 w-full max-w-[420px]">
        <Card className="bg-white/95 backdrop-blur-md shadow-2xl border border-white/60 rounded-3xl overflow-hidden p-6 sm:p-8">
          <CardContent className="p-0">
            {/* FarmIQ Brand Logo Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sprout className="w-8 h-8 text-green-600 stroke-[2.5]" />
                <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                  Farm<span className="text-green-600">IQ</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Smart Farming, <span className="text-green-600 font-semibold">Better Future</span>
              </p>
            </div>

            {/* Welcome Heading */}
            <div className="text-left mb-6">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Welcome!
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Login to your account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-1">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Username *"
                    className={`h-12 pl-10 pr-4 rounded-xl border-gray-200 bg-gray-50/50 hover:bg-gray-50/80 focus:bg-white focus:border-green-600 focus:ring-1 focus:ring-green-600 text-gray-900 placeholder:text-gray-400 transition-all ${
                      !formData.username.trim() && authError ? "border-red-300 ring-1 ring-red-200" : ""
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password *"
                    className={`h-12 pl-10 pr-11 rounded-xl border-gray-200 bg-gray-50/50 hover:bg-gray-50/80 focus:bg-white focus:border-green-600 focus:ring-1 focus:ring-green-600 text-gray-900 placeholder:text-gray-400 transition-all ${
                      !formData.password.trim() && authError ? "border-red-300 ring-1 ring-red-200" : ""
                    }`}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="rounded border-gray-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal text-gray-600 cursor-pointer select-none">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 text-center">{authError}</p>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-base rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Login"
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-2 text-gray-400 font-semibold tracking-wider">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2.5 shadow-sm"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Sign in with Google</span>
              </Button>

              {/* Sign Up Link */}
              <div className="text-center pt-2">
                <span className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors"
                    onClick={() => navigate("/register")}
                  >
                    Sign Up
                  </button>
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
