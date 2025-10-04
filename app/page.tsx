/* eslint-disable @next/next/no-img-element */
"use client";

import { Assistant } from "./assistant";
import { useAuth } from "@/contexts/auth-context";
import BrandAnalysis from "@/components/brandAnalysis/brandAnalysis";
import { CopilotConsole } from "@/components/assistant-ui/copilot-console";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're done loading and definitely not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (user?.project?.brandAnalysis == null) {
    return <BrandAnalysis />;
  }

  // User is authenticated - show the assistant with user info
  return (
    <div className="h-screen bg-gray-50 px-24 py-4 overflow-hidden">
      <div className="h-[90%] flex gap-4">
        {/* Main Chat Container - Left Side */}
        <div className="flex-1 min-w-0">
          <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-full p-6">
              <Assistant />
            </div>
          </div>
        </div>

        {/* Copilot Console - Right Side */}
        <div className="w-92 flex-shrink-0">
          <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <CopilotConsole className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
