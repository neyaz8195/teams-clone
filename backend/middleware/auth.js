const { auth } = require('express-oauth2-jwt-bearer');

// Auth0 middleware - configured to be more flexible with audience validation
const verifyAuth = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    tokenSigningAlg: 'RS256',
    // Add custom audience validation to support tokens with multiple audiences
    checkAudience: (tokenAudience, req, token) => {
        const expectedAudience = process.env.AUTH0_AUDIENCE;
        if (!expectedAudience) {
            console.error("AUTH0_AUDIENCE is not set in environment variables.");
            return false;
        }

        // Function to extract base URL and path
        const parseAudience = (url) => {
            try {
                const urlObj = new URL(url);
                return {
                    baseUrl: urlObj.origin,
                    path: urlObj.pathname.replace(/\/$/, '') // Remove trailing slash
                };
            } catch (e) {
                return null;
            }
        };

        // Parse the expected audience
        const expectedParsed = parseAudience(expectedAudience);        // Helper function to check if audiences match
        const audiencesMatch = (tokenAud) => {
            const tokenParsed = parseAudience(tokenAud);
            if (!tokenParsed || !expectedParsed) return false;

            // Check if base URLs match
            if (tokenParsed.baseUrl !== expectedParsed.baseUrl) return false;

            // Check if the token's path starts with or exactly matches the expected path
            return tokenParsed.path === expectedParsed.path ||
                tokenParsed.path.startsWith(expectedParsed.path + '/');
        };

        // Handle string audience
        if (typeof tokenAudience === 'string') {
            return audiencesMatch(tokenAudience);
        }

        // Handle array of audiences
        if (Array.isArray(tokenAudience)) {
            return tokenAudience.some(audiencesMatch);
        }

        return false;
    }
});

module.exports = {
    verifyAuth
};
