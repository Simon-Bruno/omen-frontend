"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0';

interface Shop {
  id: number;
  name: string;
  domain: string;
  email: string;
  planName: string;
  currency: string;
  timezone: string;
  country: string;
}

interface Project {
  id: string;
  shopDomain: string;
}

interface User {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  shop?: Shop;
  project?: Project;
}

interface AuthContextType {
  user: User | null;
  error: Error | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  shop: Shop | null;
  project: Project | null;
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
  const { user: auth0User, error: auth0Error, isLoading: auth0Loading } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Auth context useEffect triggered:', {
      auth0Loading,
      auth0Error: !!auth0Error,
      auth0User: !!auth0User,
      isLoading
    });

    if (auth0Loading) {
      console.log('Auth0 is loading, setting loading to true');
      setIsLoading(true);
      return;
    }

    if (auth0Error) {
      console.log('Auth0 error, setting loading to false');
      setError(auth0Error);
      setIsLoading(false);
      return;
    }

    if (auth0User) {
      console.log('Auth0 user found, fetching user data...');
      // User is authenticated with Auth0, fetch additional data from backend
      fetchUserData();
    } else {
      console.log('No Auth0 user, clearing state');
      // No user, clear state
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth0User, auth0Error, auth0Loading]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching user data from backend...');
      
      // Call our API route which will get the token and call the backend
      const response = await fetch('/api/user/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      console.log('User data API response:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ User data received:', data);

      // Transform the backend response to match our User interface
      const user: User = {
        sub: data.user.auth0Id,
        email: data.user.email,
        name: data.user.name || data.user.email,
        picture: data.user.picture,
        project: data.user.project,
        // Map project to shop if needed
        shop: data.user.project ? {
          id: 1, // You might want to get this from the backend
          name: data.user.project.shopDomain,
          domain: data.user.project.shopDomain,
          email: data.user.email,
          planName: 'Unknown',
          currency: 'USD',
          timezone: 'UTC',
          country: 'US'
        } : undefined
      };
      
      setUser(user);
      setError(null);
      console.log('✅ User data set successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user data');
      setError(error);
      console.error('❌ Failed to fetch user data:', err);
    } finally {
      console.log('🔄 Setting auth loading to false');
      setIsLoading(false);
    }
  };

  // Extract additional data from user object if available
  const shop = user?.shop || null;
  const project = user?.project || null;
  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    error,
    isLoading,
    isAuthenticated,
    shop,
    project,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
