import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { localAuthService, User } from "@/services/localAuthService";

type AuthUser = {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  location?: string;
  farm_size?: string;
  created_at: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, full_name: string, phone?: string, location?: string, farm_size?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => Promise<boolean>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeAuth = () => {
      if (localAuthService.isLoggedIn()) {
        const userData = localAuthService.getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await localAuthService.login(username, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string, 
    email: string, 
    password: string, 
    full_name: string,
    phone?: string,
    location?: string,
    farm_size?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await localAuthService.register(
        username,
        email,
        password,
        full_name,
        phone,
        location,
        farm_size
      );
      
      if (result.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localAuthService.logout();
  };

  const updateUser = async (updates: Partial<AuthUser>): Promise<boolean> => {
    try {
      if (!localAuthService.isLoggedIn()) return false;

      setIsLoading(true);
      const currentUser = localAuthService.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        setUser(updatedUser);
        // Update in localStorage
        localStorage.setItem('farmiq_current_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Update failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(() => ({ 
    user, 
    login, 
    register, 
    logout, 
    updateUser, 
    isLoading 
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


