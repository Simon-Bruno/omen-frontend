"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface RegistrationFormProps {
  onSuccess: (data: { user: any; oauthUrl: string; state: string; shop: string }) => void;
  onError: (error: string) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    email: "",
    shop: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.shop) {
      newErrors.shop = "Shop domain is required";
    } else {
      // Normalize shop domain
      let normalizedShop = formData.shop.trim();
      if (!normalizedShop.includes(".")) {
        normalizedShop = `${normalizedShop}.myshopify.com`;
      }
      if (!normalizedShop.endsWith(".myshopify.com")) {
        newErrors.shop = "Please enter a valid Shopify store domain (e.g., mystore or mystore.myshopify.com)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Normalize shop domain
      let normalizedShop = formData.shop.trim();
      if (!normalizedShop.includes(".")) {
        normalizedShop = `${normalizedShop}.myshopify.com`;
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          shop: normalizedShop,
          password: formData.password || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store registration data temporarily
        sessionStorage.setItem('pending_registration', JSON.stringify({
          email: formData.email,
          shop: normalizedShop,
          ...data
        }));
        onSuccess(data);
      } else {
        onError(data.message || "Registration failed");
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
        <CardDescription>
          Create your account and connect your Shopify store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="shop" className="text-sm font-medium">
              Shopify Store
            </label>
            <Input
              id="shop"
              type="text"
              placeholder="mystore or mystore.myshopify.com"
              value={formData.shop}
              onChange={(e) => handleInputChange("shop", e.target.value)}
              className={errors.shop ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {errors.shop && (
              <p className="text-sm text-red-500">{errors.shop}</p>
            )}
            <p className="text-xs text-gray-500">
              Enter your store name (e.g., "mystore") or full domain
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password <span className="text-gray-400">(optional)</span>
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Leave empty for auto-generated password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              If left empty, we'll generate a secure password for you
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account & Connect Store"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
