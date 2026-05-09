'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';
import { usersService } from '../services/users.service';
import { User, LoginRequest, RegisterRequest } from '../types/auth';
import type { ApiError } from '../services/api';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    async function initAuth() {
      let baseUser = null;
      
      try {
        if (!authService.isAuthenticated()) {
          if (isMounted) setUser(null);
          return;
        }

        baseUser = authService.getUser();
        if (!baseUser) {
          if (isMounted) setUser(null);
          return;
        }

        const profile = await usersService.getProfile();

        if (isMounted && !abortController.signal.aborted) {
          setUser(profile);
        }

      } catch (err) {
        if (!isMounted || abortController.signal.aborted) return;
        
        const error = err as ApiError;
        if (error && (error.status === 401 || error.status === 403 || error.status === 404)) {
          authService.logout();
          setUser(null);
        } else {
          console.error("Error initializing auth:", err);
          setUser(baseUser);
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    initAuth();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authService.login(data);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await authService.register(data);
      
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/auth');
  };

  const value: AuthContextType = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && authService.isAuthenticated(),
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('Error using auth context');
  }
  return context;
}
