import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | null>(null);
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response: any = await api.get('/auth/me');
        if (response.success && response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response: any = await api.post('/auth/login', { email, password });
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
      }
      throw new Error('Login failed.');
    } catch (error) {
      throw error;
    }
  };
  const register = async (name: string, email: string, password: string): Promise<any> => {
    try {
      const response: any = await api.post('/auth/register', { name, email, password });
      return response;
    } catch (error) {
      throw error;
    }
  };
  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  const logoutAll = async (): Promise<void> => {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
