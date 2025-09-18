"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0';


interface Project {
  id: string;
  shopDomain: string;
  brandAnalysis: JSON;
}

interface User {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  project?: Project;
}

interface AuthContextType {
  user: User | null;
  error: Error | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  project: Project | null;
  refetchUser: () => Promise<void>;
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

  // Refetch user data function
  const refetchUser = useCallback(async () => {
    if (!auth0User) return;

    console.log('🔄 Refetching user data...');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/me');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      console.log('✅ User data refetched successfully:', data);
      setUser(data.user);
    } catch (err) {
      console.error('❌ Error refetching user data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refetch user data'));
    } finally {
      setIsLoading(false);
    }
  }, [auth0User]);

  // Extract additional data from user object if available
  const project = user?.project || null;
  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    error,
    isLoading,
    isAuthenticated,
    project,
    refetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
