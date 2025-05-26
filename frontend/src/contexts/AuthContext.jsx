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

    // Initialize Auth0 client
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

            // Get user info
            auth0Client.client.userInfo(authResult.accessToken, (err, userProfile) => {
                if (err) {
                    dispatch({ type: 'LOGIN_ERROR', payload: err.message });
                } else {
                    // Register user with our backend
                    fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authResult.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(res => res.json())
                        .then(userData => {
                            // Set authenticated user state                            // Import and configure API service with token
                            import('../services/ApiService.js').then(module => {
                                const apiService = module.default;
                                apiService.setToken(authResult.accessToken);
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
                                    token: authResult.accessToken
                                }
                            });
                        })
                        .catch(err => {
                            dispatch({ type: 'LOGIN_ERROR', payload: 'Failed to register user with backend' });
                            console.error('Backend registration error:', err);
                        });
                }
            });
        } else if (error) {
            dispatch({ type: 'LOGIN_ERROR', payload: error });
            console.log('Authentication error:', error);
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
        const expiresAt = JSON.parse(localStorage.getItem('expires_at') || '0');
        return new Date().getTime() < expiresAt;
    };

    useEffect(() => {
        // Check if we have tokens in URL (after Auth0 redirect)
        if (window.location.hash) {
            auth0Client.parseHash((err, authResult) => {
                handleAuthResult(authResult, err);
                window.location.hash = '';
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
