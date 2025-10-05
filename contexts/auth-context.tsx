"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useSession, getSession } from '@/lib/better-auth';

interface Project {
  id: string;
  shopDomain: string;  // Now generic website URL for all stores
  isShopify: boolean;  // New field
  brandAnalysis: JSON;
  // Shopify-only fields (may be null for non-Shopify):
  shopPlan?: string;
  shopCurrency?: string;
  shopCountry?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
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
  const { data: session, error: sessionError, isPending: sessionLoading, refetch } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) {
      setIsLoading(true);
      return;
    }

    if (sessionError) {
      setError(sessionError);
      setIsLoading(false);
      return;
    }

    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || '',
        emailVerified: session.user.emailVerified || false,
        project: (session.user as any).project || null,
      };

      setUser(user);
      setError(null);
      setIsLoading(false);
    } else {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, [session, sessionError, sessionLoading]);

  const refetchUser = useCallback(async () => {
    try {
      const freshSession = await getSession({ query: { disableCookieCache: true } });
      console.log('✅ Fresh session from getSession:', freshSession);

      await refetch();
      console.log('✅ Refetch completed');
    } catch (err) {
      console.error('❌ Error in refetchUser:', err);
      setError(err instanceof Error ? err : new Error('Failed to refetch session'));
    }
  }, [refetch]);

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
