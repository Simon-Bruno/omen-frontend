// lib/auth0.js

import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Hardcode the scope to ensure it always includes 'openid'
const AUTH0_SCOPE = 'openid profile email read:shows';
console.log('🚀 Creating Auth0Client with hardcoded scope:', AUTH0_SCOPE);

export const auth0 = new Auth0Client({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    appBaseUrl: process.env.APP_BASE_URL,
    secret: process.env.AUTH0_SECRET,

    authorizationParameters: {
        scope: AUTH0_SCOPE,
        audience: process.env.AUTH0_AUDIENCE,
    }
});