import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const SimpleRegisterPage = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate required fields
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }
    
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!formData.password) {
      setError("Password is required");
      return;
    }
    
    if (!formData.confirmPassword) {
      setError("Please confirm your password");
      return;
    }
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Validate terms acceptance
    if (!acceptTerms) {
      setError("You must accept the Terms and Conditions to continue");
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(
        formData.username.trim(),
        formData.email.trim(),
        formData.password,
        formData.username.trim(), // Using username as full name
        "", // phone
        "", // location
        "" // farm size
      );
      
      if (success) {
        // Redirect to login page after successful registration
        navigate("/login", { replace: true });
      } else {
        setError("Registration failed. Username or email may already exist.");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
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
          backgroundImage: `url('https://static.vecteezy.com/system/resources/thumbnails/054/880/166/small_2x/thriving-tree-in-lush-green-environment-nature-conservation-and-protection-concept-free-photo.jpeg')`,
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/95 shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-6">
            {/* Back Button */}
            <div className="flex justify-start mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="text-gray-600 hover:text-gray-800"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-800">
              Create Account
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      !formData.username.trim() && error ? 'border-red-300' : ''
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    name="email"
                    type="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="Email *" 
                    className={`h-12 pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                      !formData.email.trim() && error ? 'border-red-300' : ''
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
                    placeholder="Create Password *" 
                    className={`h-12 pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                      !formData.password && error ? 'border-red-300' : ''
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"} 
                    value={formData.confirmPassword} 
                    onChange={handleInputChange} 
                    placeholder="Confirm Password *" 
                    className={`h-12 pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                      !formData.confirmPassword && error ? 'border-red-300' : ''
                    }`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-1"
                />
                <div className="text-sm text-gray-600">
                  <Label htmlFor="terms" className="cursor-pointer">
                    I agree to the{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium underline"
                      onClick={() => navigate("/terms")}
                    >
                      Terms and Conditions
                    </Button>
                    {" "}and{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium underline"
                      onClick={() => navigate("/privacy")}
                    >
                      Privacy Policy
                    </Button>
                  </Label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Register Button */}
              <Button 
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !formData.username.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim() || !acceptTerms}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => navigate("/login")}
                    disabled={isLoading}
                  >
                    Sign In
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

export default SimpleRegisterPage;
