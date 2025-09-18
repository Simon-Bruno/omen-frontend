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
    <div className="flex h-screen w-full overflow-hidden">
      {/* Assistant - 80% width */}
      <div className="w-4/5 h-full">
        <Assistant />
      </div>

      {/* User Info Sidebar - 20% width */}
      <div className="w-1/5 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h2>

            {/* User Avatar and Basic Info */}
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={user?.picture || '/default-avatar.png'}
                alt="User avatar"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Project/Shop Info */}
            {user?.project && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Project</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Shop:</span> {user.project.shopDomain}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {user.project.id}
                </p>
              </div>
            )}

            {/* Auth0 Info */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Auth Info</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Auth0 ID:</span> {user?.sub}
              </p>
              {/* 
                The following field is commented out because 'email_verified' does not exist on type 'User'.
                If you want to display email verification status, ensure the 'User' type includes 'email_verified'.
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email Verified:</span> {user?.email_verified ? 'Yes' : 'No'}
                </p>
              */}
            </div>

            {/* Logout Button */}
            <div className="pt-4">
              <a
                href="/auth/logout"
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors inline-block text-center"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
