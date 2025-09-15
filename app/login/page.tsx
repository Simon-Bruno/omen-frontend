"use client";

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  
  const success = searchParams.get('success');
  const shop = searchParams.get('shop');
  const error = searchParams.get('error');

  // If user is already logged in, redirect to dashboard
  if (user && !isLoading) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to Omen</CardTitle>
            <CardDescription>
              {success ? 'Registration successful! Please log in to continue.' : 'Sign in to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Registration successful! Your Shopify store "{shop}" has been connected.
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Registration failed. Please try again.
                </span>
              </div>
            )}

            {/* Auth0 Login Button */}
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = '/auth/login'}
                className="w-full"
                size="lg"
              >
                Sign in with Auth0
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-500">
                  Register here
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

