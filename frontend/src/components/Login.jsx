import { Box, Button, Typography, Paper, Container } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const { login, loading } = useAuth();

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
