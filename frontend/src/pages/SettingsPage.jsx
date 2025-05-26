import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Switch,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    FormControl,
    Select,
    MenuItem,
    Alert,
    IconButton,
    useTheme,
} from '@mui/material';
import {
    Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
    const theme = useTheme();
    const { user } = useAuth();
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        notifications: true,
        soundEnabled: true,
        darkMode: false,
        language: 'en',
    });

    const handleSettingChange = (setting) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }));
        // Show success alert
        setShowSuccessAlert(true);
        // Hide alert after 3 seconds
        setTimeout(() => setShowSuccessAlert(false), 3000);
    };

    return (
        <Box sx={{
            height: '100%',
            overflow: 'auto',
            p: 3,
            bgcolor: 'background.default'
        }}>
            {showSuccessAlert && (
                <Alert
                    severity="success"
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => setShowSuccessAlert(false)}
                        >
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                    sx={{ mb: 2 }}
                >
                    Settings updated successfully
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom>Account Information</Typography>
                    <Typography variant="body1">Name: {user?.name}</Typography>
                    <Typography variant="body1">Email: {user?.email}</Typography>
                </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Preferences</Typography>
                <List>
                    <ListItem>
                        <ListItemText
                            primary="Notifications"
                            secondary="Enable push notifications"
                            primaryTypographyProps={{ variant: 'body1' }}
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.notifications}
                                onChange={handleSettingChange('notifications')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>

                    <Divider />

                    <ListItem>
                        <ListItemText
                            primary="Sound"
                            secondary="Enable sound notifications"
                            primaryTypographyProps={{ variant: 'body1' }}
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.soundEnabled}
                                onChange={handleSettingChange('soundEnabled')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>

                    <Divider />

                    <ListItem>
                        <ListItemText
                            primary="Dark Mode"
                            secondary="Enable dark theme"
                            primaryTypographyProps={{ variant: 'body1' }}
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.darkMode}
                                onChange={handleSettingChange('darkMode')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>

                    <Divider />

                    <ListItem>
                        <ListItemText
                            primary="Language"
                            secondary="Select your preferred language"
                            primaryTypographyProps={{ variant: 'body1' }}
                        />
                        <ListItemSecondaryAction>
                            <FormControl sx={{ minWidth: 120 }}>
                                <Select
                                    value={settings.language}
                                    onChange={handleSettingChange('language')}
                                    size="small"
                                >
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="es">Español</MenuItem>
                                    <MenuItem value="fr">Français</MenuItem>
                                    <MenuItem value="de">Deutsch</MenuItem>
                                </Select>
                            </FormControl>
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </Paper>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h5" gutterBottom>About</Typography>
                <Typography variant="body1">Teams Clone Version 1.0.0</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    A real-time communication platform built with React and Node.js
                </Typography>
            </Paper>
        </Box>
    );
}