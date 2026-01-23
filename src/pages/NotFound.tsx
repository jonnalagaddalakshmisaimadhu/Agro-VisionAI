import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="text-8xl">🌾</div>
        <div>
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Oops! This field seems to be empty
          </p>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist. Let's get you back to farming!
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/">
              <Leaf className="mr-2 h-4 w-4" />
              Explore FarmIQ
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
