// lib/auth0.js

import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Ensure the scope always includes 'openid' which is required by Auth0
function getAuth0Scope(): string {
    const envScope = process.env.AUTH0_SCOPE;
    const defaultScope = 'openid profile email read:shows';
    
    if (!envScope) {
        return defaultScope;
    }
    
    // If AUTH0_SCOPE is set but doesn't include 'openid', add it
    if (!envScope.includes('openid')) {
        return `openid ${envScope}`;
    }
    
    return envScope;
}

// Initialize the Auth0 client 
export const auth0 = new Auth0Client({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    appBaseUrl: process.env.APP_BASE_URL,
    secret: process.env.AUTH0_SECRET,

    authorizationParameters: {
        scope: getAuth0Scope(),
        audience: process.env.AUTH0_AUDIENCE,
    }
});