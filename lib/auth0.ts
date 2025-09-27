// lib/auth0.js

import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Ensure the scope always includes 'openid' which is required by Auth0
function getAuth0Scope(): string {
    const envScope = process.env.AUTH0_SCOPE;
    const defaultScope = 'openid profile email read:shows';
    
    console.log('🔍 AUTH0_SCOPE debugging:', {
        envScope,
        envScopeType: typeof envScope,
        envScopeLength: envScope?.length,
        hasOpenId: envScope?.includes('openid'),
        defaultScope
    });
    
    if (!envScope) {
        console.log('✅ Using default scope:', defaultScope);
        return defaultScope;
    }
    
    // If AUTH0_SCOPE is set but doesn't include 'openid', add it
    if (!envScope.includes('openid')) {
        const newScope = `openid ${envScope}`;
        console.log('✅ Adding openid to scope:', newScope);
        return newScope;
    }
    
    console.log('✅ Using env scope as-is:', envScope);
    return envScope;
}

// Initialize the Auth0 client 
const finalScope = getAuth0Scope();
console.log('🚀 Creating Auth0Client with scope:', finalScope);

export const auth0 = new Auth0Client({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    appBaseUrl: process.env.APP_BASE_URL,
    secret: process.env.AUTH0_SECRET,

    authorizationParameters: {
        scope: finalScope,
        audience: process.env.AUTH0_AUDIENCE,
    }
});