export class ApiService {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl;
        this._token = token;
    }

    // Getter for token that falls back to localStorage
    get token() {
        // If we have a token in memory, use that
        if (this._token) {
            return this._token;
        }

        // Otherwise try to get it from localStorage
        try {
            const storedToken = localStorage.getItem('access_token');
            if (storedToken) {
                console.log('ApiService: Retrieved token from localStorage');
                this._token = storedToken;
                return storedToken;
            }
        } catch (e) {
            console.error('Error accessing localStorage:', e);
        }

        return null;
    }

    // Setter for token
    setToken(token) {
        console.log('Setting API token:', token ? 'Token present' : 'Token missing');
        this._token = token;
    } getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` })
        };

        if (!this.token) {
            console.warn('ApiService: No token available for request');
        }

        return headers;
    } async get(endpoint) {
        try {
            console.log(`Making GET request to: ${endpoint} with token: ${this.token ? 'Present' : 'Missing'}`);

            const headers = this.getHeaders();
            console.log('Request headers:', headers);

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText} for ${endpoint}`);
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`GET request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`POST request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`PUT request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`DELETE request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async uploadFile(endpoint, file, additionalData) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            if (additionalData) {
                Object.entries(additionalData).forEach(([key, value]) => {
                    formData.append(key, value);
                });
            }

            const headers = {
                ...(this.token && { Authorization: `Bearer ${this.token}` })
            };

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`File upload failed: ${endpoint}`, error);
            throw error;
        }
    }
}

// API service instance
// Create API service with baseUrl but no token initially 
const apiService = new ApiService(import.meta.env.VITE_API_URL || 'http://localhost:5000');

// For debugging
console.log('ApiService initialized with baseUrl:', apiService.baseUrl);

// Auto-set token from localStorage if available
const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
if (accessToken) {
    console.log('Setting token from localStorage');
    apiService.setToken(accessToken);
}

export default apiService;
