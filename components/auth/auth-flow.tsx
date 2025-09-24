"use client";

import { useState, useEffect } from "react";
import { RegistrationForm } from "./registration-form";
import { LoginForm } from "./login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ExternalLinkIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

type AuthStep = 'register' | 'login' | 'oauth';

export const AuthFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('register');
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const { user, error: auth0Error } = useAuth();

  // Handle Auth0 errors
  useEffect(() => {
    if (auth0Error) {
      setError(auth0Error.message || 'Authentication error occurred');
    }
  }, [auth0Error]);

  const handleRegistrationSuccess = (data: any) => {
    setSuccessData(data);
    setCurrentStep('oauth');
    // Redirect to Shopify OAuth
    window.location.href = data.oauthUrl;
  };

  const handleRegistrationError = (error: string) => {
    setError(error);
  };

  const handleLoginError = (error: string) => {
    setError(error);
  };

  const handleRetryOAuth = () => {
    if (successData?.oauthUrl) {
      window.location.href = successData.oauthUrl;
    }
  };

  const handleSwitchToLogin = () => {
    setCurrentStep('login');
    setError(null);
  };

  const handleSwitchToRegister = () => {
    setCurrentStep('register');
    setError(null);
  };

  if (currentStep === 'oauth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Connecting to Shopify</CardTitle>
            <CardDescription>
              Omen eCommerce UX Co-Pilot - Please complete the authorization in the new window
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A new window should have opened for Shopify authorization. 
                If it didn't open, please check your popup blocker settings.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleRetryOAuth}
              variant="outline"
              className="w-full"
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Retry Authorization
            </Button>

            <Button
              onClick={handleSwitchToRegister}
              variant="ghost"
              className="w-full"
            >
              Back to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === 'register' ? (
          <>
            <RegistrationForm
              onSuccess={handleRegistrationSuccess}
              onError={handleRegistrationError}
            />
            <div className="text-center">
              <Button
                onClick={handleSwitchToLogin}
                variant="ghost"
                className="text-sm"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </>
        ) : (
          <>
            <LoginForm
              onError={handleLoginError}
            />
            <div className="text-center">
              <Button
                onClick={handleSwitchToRegister}
                variant="ghost"
                className="text-sm"
              >
                Need an account? Register here
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
