import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { localAuthService, User } from "@/services/localAuthService";
import { authService } from "@/services/authService";
import { signInWithGoogle, checkGoogleRedirectResult } from "@/lib/firebase";

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
  loginWithGoogle: (providedEmail?: string, providedName?: string) => Promise<{ success: boolean; needsPrompt?: boolean }>;
  register: (
    username: string, 
    email: string, 
    password: string, 
    full_name: string, 
    phone?: string, 
    location?: string, 
    farm_size?: string
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => Promise<boolean>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const cached = localStorage.getItem('farmiq_current_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.id || parsed.email || parsed.username)) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // 0. Check if returning from a mobile Google OAuth redirect
      const redirectAuth = await checkGoogleRedirectResult();
      if (redirectAuth && redirectAuth.user) {
        const u = redirectAuth.user;
        const mappedUser: AuthUser = {
          id: u.uid,
          username: u.displayName || u.email?.split("@")[0] || "user",
          email: u.email || "",
          full_name: u.displayName || "",
          created_at: new Date().toISOString()
        };
        setUser(mappedUser);
        localStorage.setItem("farmiq_current_user", JSON.stringify(mappedUser));
        localStorage.setItem("farmiq_logged_in", "true");
        return;
      }

      const token = authService.getToken();
      if (token) {
        try {
          const remoteUser = await authService.getCurrentUser(token);
          if (remoteUser) {
            const mappedUser: AuthUser = {
              id: String(remoteUser.id),
              username: remoteUser.username,
              email: remoteUser.email,
              full_name: remoteUser.full_name || remoteUser.username,
              phone: remoteUser.phone,
              location: remoteUser.location,
              farm_size: remoteUser.farm_size,
              created_at: remoteUser.created_at,
            };
            setUser(mappedUser);
            localStorage.setItem('farmiq_current_user', JSON.stringify(mappedUser));
            localStorage.setItem('farmiq_logged_in', 'true');
            return;
          }
        } catch (error) {
          console.warn("Backend token validation failed, checking offline session:", error);
        }
      }

      // Offline / Local fallback
      if (localAuthService.isLoggedIn()) {
        const localData = localAuthService.getCurrentUser();
        if (localData) {
          setUser(localData);
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Attempt real Backend JWT login first
      try {
        const tokenRes = await authService.login({ username, password });
        if (tokenRes && tokenRes.access_token) {
          const profile = await authService.getCurrentUser(tokenRes.access_token);
          const mappedUser: AuthUser = {
            id: String(profile.id),
            username: profile.username,
            email: profile.email,
            full_name: profile.full_name || profile.username,
            phone: profile.phone,
            location: profile.location,
            farm_size: profile.farm_size,
            created_at: profile.created_at,
          };
          setUser(mappedUser);
          localStorage.setItem('farmiq_current_user', JSON.stringify(mappedUser));
          localStorage.setItem('farmiq_logged_in', 'true');
          return true;
        }
      } catch (backendError) {
        console.warn("Backend login failed or unavailable, trying local fallback:", backendError);
      }

      // Fallback to local authentication
      const localResult = await localAuthService.login(username, password);
      if (localResult.success && localResult.user) {
        setUser(localResult.user);
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

  const loginWithGoogle = async (providedEmail?: string, providedName?: string): Promise<{ success: boolean; needsPrompt?: boolean }> => {
    try {
      setIsLoading(true);
      const res = await signInWithGoogle(providedEmail, providedName);

      if (res.needsPrompt) {
        return { success: false, needsPrompt: true };
      }

      if (res.user) {
        const firebaseUser = res.user;
        const userData: AuthUser = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "user",
          email: firebaseUser.email || "",
          full_name: firebaseUser.displayName || "",
          created_at: new Date().toISOString()
        };

        setUser(userData);
        localStorage.setItem('farmiq_current_user', JSON.stringify(userData));
        localStorage.setItem('farmiq_logged_in', 'true');

        // Also register in localAuthService so offline users list and lookups have this account
        try {
          const allUsers = localAuthService.getAllUsers();
          if (!allUsers.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            await localAuthService.register(
              userData.username,
              userData.email,
              'google_oauth_pass',
              userData.full_name
            );
          }
        } catch (e) {
          console.debug("Local user auto-register notice:", e);
        }

        // Real-Time Notification Onboarding Dispatch for Google Authenticated Users
        if (userData.email) {
          const apiRoot = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
          fetch(`${apiRoot}/api/notifications/onboarding/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_name: userData.full_name || userData.username,
              email: userData.email
            })
          }).catch(err => console.debug('Onboarding notification dispatch notice:', err));
        }

        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Google Login failed:", error);
      return { success: false };
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

      // Attempt real Backend registration
      try {
        await authService.register({
          username,
          email,
          password,
          full_name,
          phone,
          location,
          farm_size
        });
        // Auto-login after registration
        return await login(username, password);
      } catch (backendError) {
        console.warn("Backend registration failed or unavailable, trying local fallback:", backendError);
      }

      // Fallback to local registration
      const localResult = await localAuthService.register(
        username,
        email,
        password,
        full_name,
        phone,
        location,
        farm_size
      );

      if (localResult.success) {
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
    authService.removeToken();
    localAuthService.logout();
    localStorage.removeItem('farmiq_current_user');
    localStorage.removeItem('farmiq_logged_in');
    localStorage.removeItem('farmiq_token');
    window.location.href = "/login";
  };

  const updateUser = async (updates: Partial<AuthUser>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      if (token) {
        try {
          await authService.updateUser(token, {
            full_name: updates.full_name,
            phone: updates.phone,
            location: updates.location,
            farm_size: updates.farm_size
          });
        } catch (e) {
          console.warn("Backend update profile failed:", e);
        }
      }

      const currentUser = user || localAuthService.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        setUser(updatedUser);
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
    loginWithGoogle,
    register,
    logout,
    updateUser,
    isLoading
  }), [user, isLoading, register, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}



