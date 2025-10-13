"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import LogoText from "./branding/LogoText";
import Logo from "./branding/Logo";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/auth-context";
import { signOut } from "@/lib/better-auth";
import { Settings, Trash2, Loader2, LogOut, ChevronDown, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Header() {
    const { user, project, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const [isResetting, setIsResetting] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Manage login-page class on body element
    useEffect(() => {
        if (pathname === "/login") {
            document.body.classList.add("login-page");
        } else {
            document.body.classList.remove("login-page");
        }
        
        // Cleanup on unmount
        return () => {
            document.body.classList.remove("login-page");
        };
    }, [pathname]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleResetProject = async () => {
        if (!project?.id) {
            console.error('No project ID available');
            return;
        }

        if (!confirm('This will permanently delete your brand analysis and all screenshots. Are you sure?')) {
            return;
        }

        try {
            setIsResetting(true);
            const response = await fetch(`/api/projects/${project.id}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for authentication
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reset project');
            }

            const data = await response.json();
            console.log('Project reset successfully:', data);
            
            // Show success message and refresh the browser
            alert('Project reset successfully! The page will now refresh.');
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset project:', error);
            alert(`Failed to reset project: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsResetting(false);
            setShowDropdown(false);
        }
    };

    const handleLogout = async () => {
        try {
            console.log('🚀 Starting logout process...');
            await signOut();
            console.log('✅ Better Auth signOut completed');
            // Redirect to home page after logout
            window.location.href = '/';
        } catch (error) {
            console.error('❌ Logout failed:', error);
            // Fallback: redirect anyway
            window.location.href = '/';
        }
    };

    // Hide header on login page
    if (pathname === "/login") {
        return null;
    }

    return (
        <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="w-full">
                <div className="flex items-center justify-between h-16 pl-6 pr-8 sm:pr-12 lg:pr-16 gap-3">

                    {/* Left side - Logo */}
                    <div className="flex items-center gap-3">
                        <Logo width={32} height={32} />
                        <LogoText />
                    </div>


                    {/* Right side - Navigation and Settings */}
                    {isAuthenticated && project && project.brandAnalysis && (
                        <div className="flex items-center gap-3">
                            {/* Analytics Link */}
                            <Link href="/analytics">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    Experiments
                                </Button>
                            </Link>

                            {/* Settings Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    Settings
                                    <ChevronDown className="h-4 w-4" />
                                </Button>

                                {/* Dropdown Menu */}
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                                        <div className="py-1">
                                            <button
                                                onClick={handleResetProject}
                                                disabled={isResetting}
                                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isResetting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                                {isResetting ? 'Resetting...' : 'Reset Project'}
                                            </button>
                                            
                                            <div className="border-t border-gray-100"></div>
                                            
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Simple logout button when authenticated but no project/brand analysis */}
                    {isAuthenticated && (!project || !project.brandAnalysis) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="flex items-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
} 