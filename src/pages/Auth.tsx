import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, User, Lock, Eye, EyeOff } from "lucide-react";

const AuthPage = () => {
  const { login } = useAuth();
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

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Beautiful nature background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/src/assets/hero-farming.jpg')`,
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/95 shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Login
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    name="username"
                    type="text" 
                    value={formData.username} 
                    onChange={handleInputChange} 
                    placeholder="Username *" 
                    className={`h-12 pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                      !formData.username.trim() && authError ? 'border-red-300' : ''
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="Password *" 
                    className={`h-12 pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                      !formData.password.trim() && authError ? 'border-red-300' : ''
                    }`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-700 text-sm"
                >
                  Forgot Password?
                </Button>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{authError}</p>
                </div>
              )}

              {/* Login Button */}
              <Button 
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
              >
                {isLoading ? "Signing in..." : "Login"}
              </Button>

              {/* Sign Up Link */}
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => navigate("/register")}
                  >
                    Sign Up
                  </Button>
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


