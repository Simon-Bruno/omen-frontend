"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLinkIcon } from "lucide-react";

interface LoginFormProps {
  onError: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth0Login = async () => {
    setIsLoading(true);
    
    try {
      // Redirect to Auth0 login
      window.location.href = '/auth/login';
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            You need to be registered first. If you haven't created an account yet, 
            please register to get started.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleAuth0Login}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Sign in with Auth0
            </>
          )}
        </Button>

        <div className="text-center text-sm text-gray-500">
          <p>Don't have an account?</p>
          <p>Please register first to create your account and connect your Shopify store.</p>
        </div>
      </CardContent>
    </Card>
  );
};
