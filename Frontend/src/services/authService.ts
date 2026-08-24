const API_ROOT = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE_URL = `${API_ROOT}/api`;

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  location?: string;
  farm_size?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  location?: string;
  farm_size?: string;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('access_token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('access_token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('farmiq_current_user');
    localStorage.removeItem('farmiq_logged_in');
  }

  async register(userData: UserCreate): Promise<UserResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
  }

  async login(credentials: UserLogin): Promise<Token> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    const tokenData: Token = await response.json();
    if (tokenData?.access_token) {
      this.setToken(tokenData.access_token);
    }
    return tokenData;
  }

  async getCurrentUser(token?: string): Promise<UserResponse> {
    const activeToken = token || this.getToken();
    if (!activeToken) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user information');
    }

    return response.json();
  }

  async updateUser(token: string, userData: Partial<UserResponse>): Promise<UserResponse> {
    const activeToken = token || this.getToken();
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Update failed');
    }

    return response.json();
  }
}

export const authService = new AuthService();


