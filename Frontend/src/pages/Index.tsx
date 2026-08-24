import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);

  const handleLoginClick = () => {
    navigate("/login");
  };

  if (isLoggedIn) {
    return <Dashboard />;
  }

  return <LandingPage onClickLogin={handleLoginClick} />;
};

export default Index;
