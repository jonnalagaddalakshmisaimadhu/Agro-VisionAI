import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Tractor, User, Shield, CheckCircle } from "lucide-react";

const LoginDemo = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className={`w-full max-w-md transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Tractor className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Welcome to FarmIQ
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Please log in to access your smart farming dashboard
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-medium" 
              onClick={() => navigate("/auth")}
            >
              Go to Login Page
            </Button>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Don't have an account? Register on the login page
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className={`w-full max-w-md transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Successfully Logged In!
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Welcome back, {user.username}!
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Username: {user.username}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Email: {user.email}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-medium" 
              onClick={() => navigate("/")}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline"
              className="flex-1 h-11 border-green-600 text-green-600 hover:bg-green-50" 
              onClick={logout}
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginDemo;
