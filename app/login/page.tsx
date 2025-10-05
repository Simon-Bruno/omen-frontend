"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { signIn } from "@/lib/better-auth";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, Store } from "lucide-react";
import InteractiveGradient from "@/components/branding/InteractiveGradient";

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    websiteUrl: "",
    password: "",
    isShopify: true, // Default to Shopify for backward compatibility
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to root after login, so root page can handle dashboard redirect
  // Only redirect if we're done loading and definitely have a user
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {};

    if (!registerData.name) {
      newErrors.name = "Name is required";
    }

    if (!registerData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!registerData.password) {
      newErrors.password = "Password is required";
    } else if (registerData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!registerData.websiteUrl) {
      newErrors.websiteUrl = "Website URL is required";
    } else {
      const url = registerData.websiteUrl.trim();
      
      if (registerData.isShopify) {
        // For Shopify stores, validate .myshopify.com format
        let normalizedUrl = url;
        if (!normalizedUrl.includes(".")) {
          normalizedUrl = `${normalizedUrl}.myshopify.com`;
        }
        if (!normalizedUrl.endsWith(".myshopify.com")) {
          newErrors.websiteUrl = "Please enter a valid Shopify store domain (e.g., mystore or mystore.myshopify.com)";
        }
      } else {
        // For non-Shopify stores, validate general URL format
        try {
          new URL(url.startsWith('http') ? url : `https://${url}`);
        } catch {
          newErrors.websiteUrl = "Please enter a valid website URL (e.g., https://example.com)";
        }
      }
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success("Logged in successfully!");
      // The auth context will automatically handle the redirect via useEffect
    } catch (error: any) {
      let errorMessage = "Failed to log in. Please try again.";

      if (error?.message?.includes("Invalid credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error?.message?.includes("validation")) {
        errorMessage = "Please check your email format and ensure password is provided.";
      } else if (error?.message?.includes("rate limit")) {
        errorMessage = "Too many login attempts. Please wait a moment before trying again.";
      } else if (error?.message?.includes("server")) {
        errorMessage = "Server error. Please try again later.";
      } else if (error?.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      setError(errorMessage);
      if (typeof toast !== "undefined" && toast.error) {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Normalize website URL
      let normalizedUrl = registerData.websiteUrl.trim();
      
      if (registerData.isShopify) {
        // For Shopify stores, normalize to .myshopify.com format
        if (!normalizedUrl.includes(".")) {
          normalizedUrl = `${normalizedUrl}.myshopify.com`;
        }
      } else {
        // For non-Shopify stores, ensure URL has protocol
        if (!normalizedUrl.startsWith('http')) {
          normalizedUrl = `https://${normalizedUrl}`;
        }
      }

      console.log('Registration form submitting:', {
        email: registerData.email,
        name: registerData.name,
        websiteUrl: normalizedUrl,
        isShopify: registerData.isShopify,
        hasPassword: !!registerData.password
      });

      // Use the new registration endpoint that supports both store types
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          name: registerData.name,
          websiteUrl: normalizedUrl,
          isShopify: registerData.isShopify,
        }),
      });

      console.log('Registration response status:', response.status);

      const data = await response.json();
      console.log('Registration response data:', data);

      if (response.ok) {
        // Store session data
        if (data.session) {
          localStorage.setItem('session', JSON.stringify(data.session));
        }

        // Store registration data temporarily
        sessionStorage.setItem('pending_registration', JSON.stringify({
          email: registerData.email,
          websiteUrl: normalizedUrl,
          isShopify: registerData.isShopify,
          ...data
        }));

        console.log('Registration response data:', data);

        // Check if we need to redirect to Shopify OAuth (only for Shopify stores)
        if (data.isShopify && data.oauthUrl) {
          console.log('Redirecting to Shopify OAuth:', data.oauthUrl);
          toast.success("Account created! Redirecting to Shopify...");
          // Redirect to Shopify OAuth
          window.location.href = data.oauthUrl;
          return;
        }

        // For non-Shopify stores or if no OAuth needed, registration is complete
        console.log('Registration successful, session established automatically');
        
        if (data.isShopify) {
          toast.success("Account created successfully!");
        } else {
          toast.success("Account and project created successfully!");
        }
        
        // The auth context will automatically handle the redirect via useEffect
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error: any) {
      let errorMessage = "Failed to create account. Please try again.";

      if (error?.message?.includes("email already exists")) {
        errorMessage = "An account with this email already exists. Please try logging in instead.";
      } else if (error?.message?.includes("website") || error?.message?.includes("shop")) {
        errorMessage = registerData.isShopify 
          ? "Invalid Shopify store. Please check your store domain."
          : "Invalid website URL. Please check your website address.";
      } else if (error?.message?.includes("validation")) {
        errorMessage = "Please check all fields and try again.";
      }

      setError(errorMessage);
      if (typeof toast !== "undefined" && toast.error) {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <InteractiveGradient />
      </div>
      <div className="absolute inset-0 bg-black/20 z-[1]"></div>

      {/* Glass morphism container */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Auth Form */}
        <div className="backdrop-blur-2xl bg-black/20 border border-white/10 rounded-3xl p-6 shadow-2xl">
          {/* Header with Omen logo */}
          <div className="text-center mb-6">
            <h1 className="font-khmer text-title text-white">Omen</h1>
          </div>

          {/* Toggle Buttons */}
          <div className="flex mb-4 bg-black/20 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(true);
                setError("");
                setRegisterErrors({});
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-dmSans text-sm font-medium transition-all duration-200 ${isLoginMode
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white"
                }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(false);
                setError("");
                setRegisterErrors({});
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-dmSans text-sm font-medium transition-all duration-200 ${!isLoginMode
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white"
                }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {isLoginMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="font-dmSans text-sm font-medium text-white"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-dmSans text-base w-full pl-11 pr-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 [&:-webkit-autofill]:bg-black/40 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0_30px_rgb(0,0,0)_inset] [&:-webkit-autofill]:[text-fill-color:rgb(255,255,255)] [-webkit-text-fill-color:rgb(255,255,255)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(255,255,255)]"
                    placeholder="your@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="font-dmSans text-sm font-medium text-white"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-dmSans text-base w-full pl-11 pr-11 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 [&:-webkit-autofill]:bg-black/40 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0_30px_rgb(0,0,0)_inset] [&:-webkit-autofill]:[text-fill-color:rgb(255,255,255)] [-webkit-text-fill-color:rgb(255,255,255)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(255,255,255)]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="font-dmSans text-sm text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="font-dmSans text-base font-bold w-full py-3 px-6 bg-black/40 hover:bg-black/60 border border-white/20 text-white rounded-xl shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Name Field */}
              <div className="space-y-2">
                <label
                  htmlFor="register-name"
                  className="font-dmSans text-sm font-medium text-white"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
                  <input
                    id="register-name"
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                    className="font-dmSans text-base w-full pl-11 pr-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    placeholder="John Doe"
                    required
                  />
                </div>
                {registerErrors.name && (
                  <p className="text-sm text-red-400">{registerErrors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="register-email"
                  className="font-dmSans text-sm font-medium text-white"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
                  <input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className="font-dmSans text-base w-full pl-11 pr-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    placeholder="your@example.com"
                    required
                  />
                </div>
                {registerErrors.email && (
                  <p className="text-sm text-red-400">{registerErrors.email}</p>
                )}
              </div>

              {/* Store Type Toggle */}
              <div className="space-y-2">
                <label className="font-dmSans text-sm font-medium text-white">
                  Store Type
                </label>
                <div className="flex bg-black/20 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setRegisterData(prev => ({ ...prev, isShopify: true }))}
                    className={`flex-1 py-2 px-4 rounded-lg font-dmSans text-sm font-medium transition-all duration-200 ${
                      registerData.isShopify
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Shopify Store
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterData(prev => ({ ...prev, isShopify: false }))}
                    className={`flex-1 py-2 px-4 rounded-lg font-dmSans text-sm font-medium transition-all duration-200 ${
                      !registerData.isShopify
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Other Store
                  </button>
                </div>
              </div>

              {/* Website URL Field */}
              <div className="space-y-2">
                <label
                  htmlFor="register-website"
                  className="font-dmSans text-sm font-medium text-white"
                >
                  {registerData.isShopify ? "Shopify Store" : "Website URL"}
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
                  <input
                    id="register-website"
                    type="text"
                    value={registerData.websiteUrl}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    className="font-dmSans text-base w-full pl-11 pr-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    placeholder={registerData.isShopify ? "mystore or mystore.myshopify.com" : "https://example.com"}
                    required
                  />
                </div>
                {registerErrors.websiteUrl && (
                  <p className="text-sm text-red-400">{registerErrors.websiteUrl}</p>
                )}
                <p className="text-xs text-gray-300 -mt-1">
                  {registerData.isShopify 
                    ? "Enter your store name (e.g., \"mystore\") or full domain"
                    : "Enter your website URL (e.g., \"https://example.com\")"
                  }
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="register-password"
                  className="font-dmSans text-sm font-medium text-white"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
                  <input
                    id="register-password"
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className="font-dmSans text-base w-full pl-11 pr-11 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-blue-400 transition-colors"
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {registerErrors.password && (
                  <p className="text-sm text-red-400">{registerErrors.password}</p>
                )}
                <p className="text-xs text-gray-300 -mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="font-dmSans text-base font-bold w-full py-3 px-6 bg-black/40 hover:bg-black/60 border border-white/20 text-white rounded-xl shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating Account..." : registerData.isShopify ? "Create Account & Connect Store" : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}