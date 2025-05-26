import { useState, useCallback } from 'react';
import { Box, Button, Typography, Alert, Paper } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/ApiService';

export default function TokenTester() {
    const { user } = useAuth();
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const testToken = useCallback(async () => {
        setLoading(true);
        setError(null);
        setTestResult(null);

        try {
            // Get stored token
            const storedToken = localStorage.getItem('access_token');
            console.log('Stored token available:', !!storedToken);

            if (!storedToken) {
                throw new Error('No token found in localStorage');
            }

            // 1. Test directly with fetch
            const fetchResult = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/session`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            });

            if (!fetchResult.ok) {
                throw new Error(`Session check failed: ${fetchResult.status}`);
            }

            // 2. Test via ApiService
            apiService.setToken(storedToken);
            console.log('ApiService token set to:', apiService.token ? 'Present' : 'Missing');

            setTestResult({
                tokenAvailable: !!storedToken,
                userHasToken: !!(user && user.token),
                fetchSessionStatus: fetchResult.status,
                apiServiceTokenSet: !!apiService.token
            });
        } catch (err) {
            console.error('Token test failed:', err);
            setError(err.message || 'Token test failed');
        } finally {
            setLoading(false);
        }
    }, [user]);

    return (
        <Paper sx={{ p: 3, mt: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
                Auth Token Diagnostic
            </Typography>

            <Button
                variant="contained"
                onClick={testToken}
                disabled={loading}
                sx={{ mb: 2 }}
            >
                {loading ? 'Testing...' : 'Test Auth Token'}
            </Button>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {testResult && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1">Test Results:</Typography>
                    <ul>
                        <li>Token in localStorage: {testResult.tokenAvailable ? 'Yes' : 'No'}</li>
                        <li>Token in user object: {testResult.userHasToken ? 'Yes' : 'No'}</li>
                        <li>API session endpoint status: {testResult.fetchSessionStatus}</li>
                        <li>ApiService token set: {testResult.apiServiceTokenSet ? 'Yes' : 'No'}</li>
                    </ul>
                </Box>
            )}
        </Paper>
    );
}
