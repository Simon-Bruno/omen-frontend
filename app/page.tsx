/* eslint-disable @next/next/no-img-element */
"use client";

import { Assistant } from "./assistant";
import { AuthFlow } from "@/components/auth/auth-flow";
import { useAuth } from "@/contexts/auth-context";
import BrandAnalysis from "@/components/brandAnalysis/brandAnalysis";
export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();

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
    return <AuthFlow />;
  }

  if (user?.project?.brandAnalysis == null) {
    return <BrandAnalysis />;
  }



  // User is authenticated - show the assistant with user info
  return (
    <div className="min-h-screen bg-gray-50 px-32 py-4">
      <div className="h-[calc(100vh-6rem)] flex gap-8">
        {/* Main Chat Container - Left Side */}
        <div className="flex-1 min-w-0">
          <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-full p-6">
              <Assistant />
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="w-80 flex-shrink-0">
          <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl shadow-lg border border-slate-200/50 overflow-hidden backdrop-blur-sm">
            <div className="p-8 h-full flex flex-col">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-700 mb-3">Experiment Timeline</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-600">In Progress</span>
                </div>
              </div>
              
              {/* Progress Steps with Connecting Lines */}
              <div className="flex-1 relative">
                {/* Connecting Line */}
                <div className="absolute left-[1.2rem]  top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-200 via-blue-200 to-slate-200"></div>
                
                <div className="space-y-8">
                  {/* Step 1 - Completed */}
                  <div className="relative flex items-start space-x-6 py-3">
                    <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center shadow-sm ring-2 ring-emerald-100">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-base font-semibold text-slate-700">Store Ready</p>
                      <p className="text-sm text-slate-500 mt-1">Connection has been made</p>
                    </div>
                  </div>

                  {/* Step 2 - Completed */}
                  <div className="relative flex items-start space-x-6 py-3">
                    <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center shadow-sm ring-2 ring-emerald-100">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-base font-semibold text-slate-700">Brand Analysis</p>
                      <p className="text-sm text-slate-500 mt-1">Brand insights generated</p>
                    </div>
                  </div>

                  {/* Step 3 - Current */}
                  <div className="relative flex items-start space-x-6 py-3">
                    <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm ring-2 ring-blue-100">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-base font-semibold text-slate-700">Setting up experiment</p>
                      <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-blue-300 to-blue-400 h-1.5 rounded-full transition-all duration-1000" style={{width: '65%'}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 - Upcoming */}
                  <div className="relative flex items-start space-x-6 py-3 opacity-50">
                    <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-sm ring-2 ring-slate-100">
                      <div className="w-5 h-5 border-2 border-slate-300 rounded-full"></div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-base font-semibold text-slate-600">Ready to Launch</p>
                      <p className="text-sm text-slate-400 mt-1">Deploy experiments</p>
                    </div>
                  </div>

                  {/* Step 5 - Upcoming */}
                  <div className="relative flex items-start space-x-6 py-3 opacity-50">
                    <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-sm ring-2 ring-slate-100">
                      <div className="w-5 h-5 border-2 border-slate-300 rounded-full"></div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-base font-semibold text-slate-600">Optimizing your store!</p>
                      <p className="text-sm text-slate-400 mt-1">Collecting insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
