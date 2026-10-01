// Local storage based authentication service for testing
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  location?: string;
  farm_size?: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

class LocalAuthService {
  private usersKey = 'farmiq_users';
  private currentUserKey = 'farmiq_current_user';
  private tokenKey = 'farmiq_token';

  // Generate a simple token
  private generateToken(): string {
    return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private defaultUsers: User[] = [
    {
      id: 'farmer_default_1',
      username: 'farmer',
      email: 'farmer@farmiq.ai',
      password: 'password123',
      full_name: 'Smart Farmer',
      phone: '+91 9876543210',
      location: 'Andhra Pradesh, India',
      farm_size: '5 Acres',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin_default_1',
      username: 'admin',
      email: 'admin@farmiq.ai',
      password: 'password123',
      full_name: 'FarmIQ Admin',
      phone: '+91 9999988888',
      location: 'Hyderabad, India',
      farm_size: '10 Acres',
      created_at: new Date().toISOString()
    }
  ];

  // Get all users from localStorage
  private getUsers(): User[] {
    const users = localStorage.getItem(this.usersKey);
    if (!users) {
      localStorage.setItem(this.usersKey, JSON.stringify(this.defaultUsers));
      return [...this.defaultUsers];
    }
    try {
      const parsed = JSON.parse(users);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return [...this.defaultUsers];
    } catch {
      return [...this.defaultUsers];
    }
  }

  // Save users to localStorage
  private saveUsers(users: User[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  // Register a new user
  async register(
    username: string,
    email: string,
    password: string,
    full_name: string,
    phone: string = '',
    location: string = '',
    farm_size: string = ''
  ): Promise<AuthResponse> {
    try {
      const trimmedUser = (username || '').trim();
      const trimmedEmail = (email || '').trim().toLowerCase();

      if (trimmedUser.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters long' };
      }
      if (/^\d+$/.test(trimmedUser)) {
        return { success: false, message: "Username cannot consist solely of numbers (e.g., '123')" };
      }
      if (!/[a-zA-Z]/.test(trimmedUser)) {
        return { success: false, message: 'Username must contain at least one letter' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return { success: false, message: 'Please provide a valid email address' };
      }
      if (!password || password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long' };
      }

      const users = this.getUsers();
      
      // Check if username already exists
      if (users.find(user => user.username.toLowerCase() === trimmedUser.toLowerCase())) {
        return {
          success: false,
          message: 'Username already exists'
        };
      }

      // Check if email already exists
      if (users.find(user => user.email === email)) {
        return {
          success: false,
          message: 'Email already exists'
        };
      }

      // Create new user
      const newUser: User = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        username,
        email,
        password, // In real app, this should be hashed
        full_name,
        phone,
        location,
        farm_size,
        created_at: new Date().toISOString()
      };

      // Add user to storage
      users.push(newUser);
      this.saveUsers(users);

      return {
        success: true,
        user: newUser,
        message: 'Registration successful'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed: ' + (error as Error).message
      };
    }
  }

  // Login user
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const users = this.getUsers();
      const cleanInput = (username || '').trim().toLowerCase();
      const user = users.find(u => 
        (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) && 
        u.password === password
      );

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Generate token
      const token = this.generateToken();
      
      // Store current user and token
      localStorage.setItem(this.currentUserKey, JSON.stringify(user));
      localStorage.setItem(this.tokenKey, token);

      return {
        success: true,
        user,
        token,
        message: 'Login successful'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed: ' + (error as Error).message
      };
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.currentUserKey);
    return user ? JSON.parse(user) : null;
  }

  // Get current token
  getCurrentToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(this.currentUserKey);
    localStorage.removeItem(this.tokenKey);
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getCurrentUser() && !!this.getCurrentToken();
  }

  // Get all users (for debugging)
  getAllUsers(): User[] {
    return this.getUsers();
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem(this.usersKey);
    localStorage.removeItem(this.currentUserKey);
    localStorage.removeItem(this.tokenKey);
  }
}

export const localAuthService = new LocalAuthService();
