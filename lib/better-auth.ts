import { createAuthClient } from "better-auth/react";

// Use the frontend URL since we're proxying requests to the backend
const baseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
console.log('Better Auth client baseURL:', baseURL);
console.log('Better Auth will proxy requests through frontend to backend');

export const authClient = createAuthClient({
    baseURL: baseURL,
    fetchOptions: {
        onError: (ctx) => {
            console.error('Better Auth error:', {
                error: ctx.error,
                status: ctx.response?.status,
                statusText: ctx.response?.statusText,
                baseURL: baseURL
            });
        },
        onSuccess: (ctx) => {
            console.log('Better Auth success:', {
                status: ctx.response?.status,
                baseURL: baseURL
            });
        },
        onRequest: (ctx) => {
            console.log('Better Auth request:', {
                headers: ctx.headers,
                baseURL: baseURL
            });
        }
    }
});

// Export the hooks and client methods for easy access
export const { useSession, signIn, signUp, signOut, getSession } = authClient;
