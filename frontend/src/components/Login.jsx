import { Box, Button, Typography, Paper, Container, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function Login() {
    const { login, loading, isAuthenticated, error } = useAuth();

    // If already authenticated, redirect to home
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // If loading auth state, show loading indicator
    if (loading) {
        return (
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                    }}
                >
                    <CircularProgress />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Authenticating...
                    </Typography>
                </Box>
            </Container>
        );
    }

    const handleLogin = () => {
        login();
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Box
                            component="img"
                            src="/teams-clone-logo.svg"
                            alt="Teams Clone Logo"
                            sx={{
                                width: 72,
                                height: 72,
                                mb: 2,
                                borderRadius: 2,
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Typography component="h1" variant="h4">
                            Teams Clone
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: '100%',
                            mt: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={handleLogin}
                            disabled={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? 'Loading...' : 'Sign In with Auth0'}
                        </Button>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                            sx={{ mt: 2 }}
                        >
                            Sign in to access all features including messaging and video calls
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
