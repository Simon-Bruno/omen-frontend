import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a screenshot path to a full URL
 * @param screenshotPath - The screenshot path from the API response (e.g., "/screenshots/db/cmg3def456ghi789")
 * @returns The full URL for the screenshot
 */
export function getScreenshotUrl(screenshotPath: string | null | undefined): string | null {
  if (!screenshotPath) {
    return null;
  }
  
  // If it's already a full URL (starts with http/https), return as is
  if (screenshotPath.startsWith('http://') || screenshotPath.startsWith('https://')) {
    return screenshotPath;
  }
  
  // If it's a data URL (base64), return as is for backward compatibility
  if (screenshotPath.startsWith('data:')) {
    return screenshotPath;
  }
  
  // For relative paths, prepend the backend URL
  // Screenshots are served by the backend, not the Next.js frontend
  // Use NEXT_PUBLIC_ prefix for client-side access
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
    (typeof window !== 'undefined' ? window.location.origin.replace('platform.', 'api.') : 'http://localhost:3001');
  return `${backendUrl}${screenshotPath}`;
}
