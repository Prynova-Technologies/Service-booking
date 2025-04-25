
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

import { getApiUrl } from '../utils/apiConfig';

class AuthService {
  private readonly USER_KEY = 'user';
  private readonly ADMIN_KEY = 'admin_user';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly API_BASE_PATH = '/api';
  private currentUser: User | null = null;
  private isAdmin: boolean = false;

  constructor() {
    // Load user from localStorage on initialization
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(this.USER_KEY);
    const adminJson = localStorage.getItem(this.ADMIN_KEY);
    
    if (userJson) {
      try {
        this.currentUser = JSON.parse(userJson);
        this.isAdmin = false;
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
      }
    } else if (adminJson) {
      try {
        this.currentUser = JSON.parse(adminJson);
        this.isAdmin = true;
      } catch (error) {
        console.error('Failed to parse admin from localStorage:', error);
        localStorage.removeItem(this.ADMIN_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
      }
    }
  }

  private saveUserToStorage(user: User, isAdmin: boolean = false): void {
    const storageKey = isAdmin ? this.ADMIN_KEY : this.USER_KEY;
    localStorage.setItem(storageKey, JSON.stringify(user));
  }
  
  private saveTokenToStorage(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(getApiUrl(`${this.API_BASE_PATH}/auth/login`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();

      // Save user to state and localStorage
      this.currentUser = data.user;
      this.isAdmin = false;
      this.saveUserToStorage(data.user);
      this.saveTokenToStorage(data.token);

      // Connect to socket service when user logs in
      import('./socketService').then(module => {
        const socketService = module.default;
        socketService.connect();
      });

      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  async adminLogin(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(getApiUrl(`${this.API_BASE_PATH}/auth/admin/login`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Admin login failed');
      }
      
      const data = await response.json();

      // Save admin user to state and localStorage
      this.currentUser = data.user;
      this.isAdmin = true;
      this.saveUserToStorage(data.user, true);
      this.saveTokenToStorage(data.token);

      return data.user;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      const response = await fetch(getApiUrl(`${this.API_BASE_PATH}/auth/register`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const userData = await response.json();

      // Save user to state and localStorage
      this.currentUser = userData.user;
      this.isAdmin = false;
      this.saveUserToStorage(userData.user);
      this.saveTokenToStorage(userData.token);

      // Connect to socket service when user logs in
      import('./socketService').then(module => {
        const socketService = module.default;
        socketService.connect();
      });

      return userData.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout(): void {
    // Clear user from state and localStorage
    this.currentUser = null;
    this.isAdmin = false;
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ADMIN_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    
    // Dispatch a storage event to notify other tabs/components
    window.dispatchEvent(new Event('storage'));
    
    // Disconnect from socket when user logs out
    import('./socketService').then(module => {
      const socketService = module.default;
      socketService.disconnect();
    });
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }
  
  isAdminUser(): boolean {
    return this.isAdmin && !!this.currentUser;
  }
  
  getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}

const authService = new AuthService();
export default authService;