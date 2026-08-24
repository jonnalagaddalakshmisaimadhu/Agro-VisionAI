import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Tractor, Loader2 } from "lucide-react";

const QuickLoginPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");
    setDebugInfo("");

    try {
      let success = false;
      
      if (isLogin) {
        // For login, use email as username
        setDebugInfo(`Attempting login with email: ${formData.email.trim()}`);
        success = await login(formData.email.trim(), formData.password);
      } else {
        // For register, create account with unique username
        const username = formData.email.split('@')[0] + Math.floor(Math.random() * 1000);
        setDebugInfo(`Attempting registration with username: ${username}, email: ${formData.email.trim()}`);
        success = await register(
          username, // use email prefix + random number as username
          formData.email.trim(),
          formData.password,
          formData.name.trim()
        );
      }
      
      if (success) {
        if (isLogin) {
          setError("Login successful! You can now access the dashboard.");
        } else {
          setError("Registration successful! You can now login.");
        }
      } else {
        setError(isLogin ? "Invalid credentials" : "Registration failed. Email may already be in use.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Tractor className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {isLogin ? "Welcome Back" : "Join FarmIQ"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="h-11"
                disabled={isLoading}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="h-11"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="h-11"
                disabled={isLoading}
              />
            </div>

            {/* Debug Information */}
            {debugInfo && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-600">{debugInfo}</p>
              </div>
            )}

            {/* Success/Error Message */}
            {error && (
              <div className={`p-3 border rounded-md ${
                error.includes("successful") 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              }`}>
                <p className={`text-sm ${
                  error.includes("successful") 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>{error}</p>
                {error.includes("Login successful") && (
                  <Button
                    onClick={() => navigate("/")}
                    className="mt-2 w-full h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating Account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          <div className="text-center mt-4">
            <Button
              variant="link"
              className="text-green-600 hover:text-green-700"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickLoginPage;
