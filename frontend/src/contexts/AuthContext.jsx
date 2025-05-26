import { createContext, useReducer, useEffect, useCallback } from 'react';
import auth0 from 'auth0-js';

// Create authentication context
export const AuthContext = createContext();

// Initial state
const initialState = {
    isAuthenticated: false,
    user: null,
    loading: true,
    token: null,
    error: null
};

// Reducer function
function authReducer(state, action) {
    switch (action.type) {
        case 'LOGIN_START':
            return {
                ...state,
                loading: true,
                error: null
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: action.payload.user,
                token: action.payload.token
            };
        case 'LOGIN_ERROR':
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        case 'LOGOUT':
            return {
                ...initialState,
                loading: false
            };
        default:
            return state;
    }
}

// Auth0 configuration
const auth0Config = {
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientID: import.meta.env.VITE_AUTH0_CLIENT_ID,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    redirectUri: window.location.origin,
    responseType: 'token id_token',
    scope: 'openid profile email'
};

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const auth0Client = new auth0.WebAuth(auth0Config);

    // Process authentication result
    const handleAuthResult = useCallback((authResult, error) => {
        if (authResult && authResult.accessToken && authResult.idToken) {
            // Set tokens expiration
            const expiresAt = JSON.stringify(
                authResult.expiresIn * 1000 + new Date().getTime()
            );

            // Store authentication data
            localStorage.setItem('access_token', authResult.accessToken);
            localStorage.setItem('id_token', authResult.idToken);
            localStorage.setItem('expires_at', expiresAt);

            // Get user info from Auth0
            auth0Client.client.userInfo(authResult.accessToken, (err, userProfile) => {
                if (err) {
                    dispatch({ type: 'LOGIN_ERROR', payload: err.message });
                } else {
                    // First try to get existing user profile
                    fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
                        headers: {
                            'Authorization': `Bearer ${authResult.accessToken}`
                        }
                    })
                        .then(res => {
                            if (res.ok) {
                                return res.json();
                            }
                            if (res.status === 404) {
                                // User doesn't exist, register them
                                return fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${authResult.accessToken}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        email: userProfile.email,
                                        name: userProfile.name,
                                        picture: userProfile.picture
                                    })
                                }).then(res => {
                                    if (!res.ok) {
                                        throw new Error('Registration failed');
                                    }
                                    return res.json();
                                });
                            }
                            throw new Error('Profile check failed');
                        })
                        .then(userData => {
                            // Set authenticated user state
                            dispatch({
                                type: 'LOGIN_SUCCESS',
                                payload: {
                                    user: {
                                        ...userData,
                                        auth0: userProfile
                                    },
                                    token: authResult.accessToken
                                }
                            });

                            // Configure API service with token
                            import('../services/ApiService.js').then(module => {
                                const apiService = module.default;
                                apiService.setToken(authResult.accessToken);
                            }).catch(err => {
                                console.error('Failed to set token in ApiService:', err);
                            });
                        }).catch(err => {
                            console.error('Authentication error:', err);
                            dispatch({ type: 'LOGIN_ERROR', payload: err.message });
                            // Remove tokens if authentication fails
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('id_token');
                            localStorage.removeItem('expires_at');
                        });
                }
            });
        } else if (error) {
            console.error('Auth0 error:', error);
            dispatch({ type: 'LOGIN_ERROR', payload: error });
        }
    }, []);

    // Login
    const login = () => {
        dispatch({ type: 'LOGIN_START' });
        auth0Client.authorize();
    };

    // Logout
    const logout = () => {
        // Clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');

        // Update state
        dispatch({ type: 'LOGOUT' });

        // Redirect to Auth0 logout endpoint
        auth0Client.logout({
            returnTo: window.location.origin
        });
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        const accessToken = localStorage.getItem('access_token');
        const idToken = localStorage.getItem('id_token');
        const expiresAt = JSON.parse(localStorage.getItem('expires_at') || '0');
        return accessToken && idToken && new Date().getTime() < expiresAt;
    };

    useEffect(() => {
        // Check if we have tokens in URL (after Auth0 redirect)
        if (window.location.hash) {
            auth0Client.parseHash((err, authResult) => {
                if (err || !authResult) {
                    dispatch({ type: 'LOGIN_ERROR', payload: err?.message || 'Authentication failed' });
                    return;
                }
                handleAuthResult(authResult);
                // Use history API instead of modifying location directly
                window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
            });
        } else if (isAuthenticated()) {
            // If user is authenticated but state is not set
            const accessToken = localStorage.getItem('access_token');

            // Get user info
            auth0Client.client.userInfo(accessToken, (err, userProfile) => {
                if (err) {
                    dispatch({ type: 'LOGIN_ERROR', payload: err.message });
                } else {
                    // Check session with backend
                    fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    })
                        .then(res => {
                            if (res.ok) {
                                return fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`
                                    }
                                });
                            }
                            throw new Error('Session invalid');
                        })
                        .then(res => res.json())
                        .then(userData => {                            // Import and configure API service with token
                            import('../services/ApiService.js').then(module => {
                                const apiService = module.default;
                                apiService.setToken(accessToken);
                            }).catch(err => {
                                console.error('Failed to set token in ApiService:', err);
                            });

                            dispatch({
                                type: 'LOGIN_SUCCESS',
                                payload: {
                                    user: {
                                        ...userData,
                                        auth0: userProfile
                                    },
                                    token: accessToken
                                }
                            });
                        })
                        .catch(() => {
                            // Session invalid, logout
                            logout();
                        });
                }
            });
        } else {
            // Not authenticated
            dispatch({ type: 'LOGOUT' });
        }
    }, [handleAuthResult]);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
