import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  adminLogin: (email: string, password: string) => Promise<User>;
  register: (userData: { name: string; email: string; phone: string; password: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAdmin(authService.isAdminUser());
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const loggedInUser = await authService.login({ email, password });
    setUser(loggedInUser);
    setIsAdmin(false);
    setIsAuthenticated(true);
    return loggedInUser;
  };

  const adminLogin = async (email: string, password: string): Promise<User> => {
    const loggedInAdmin = await authService.adminLogin({ email, password });
    setUser(loggedInAdmin);
    setIsAdmin(true);
    setIsAuthenticated(true);
    return loggedInAdmin;
  };

  const register = async (userData: { name: string; email: string; phone: string; password: string }): Promise<User> => {
    const registeredUser = await authService.register(userData);
    setUser(registeredUser);
    setIsAdmin(false);
    setIsAuthenticated(true);
    return registeredUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAdmin(false);
    setIsAuthenticated(false);
  };

  if (loading) {
    // You could return a loading spinner here if needed
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isAuthenticated,
        login,
        adminLogin,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;