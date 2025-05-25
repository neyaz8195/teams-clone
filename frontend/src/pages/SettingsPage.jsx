import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    TextField,
    Button,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Divider,
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Switch
} from '@mui/material';
import {
    Save as SaveIcon,
    Person as PersonIcon,
    Notifications as NotificationIcon,
    VolumeUp as VolumeIcon,
    Brightness4 as ThemeIcon,
    Security as SecurityIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import UserService from '../services/UserService';

export default function SettingsPage() {
    const { user } = useAuth();
    const [userService, setUserService] = useState(null);
    const [status, setStatus] = useState('online');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    // Settings state
    const [settings, setSettings] = useState({
        notifications: true,
        soundEffects: true,
        darkMode: false,
        twoFactorAuth: false,
    });

    // Initialize services
    useEffect(() => {
        if (user) {
            import('../services/ApiService').then((module) => {
                const apiService = module.default;
                apiService.setToken(user.token);

                const userSvc = new UserService(apiService);
                setUserService(userSvc);
            });
        }
    }, [user]);

    // Load user data
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setStatus(user.status || 'online');
        }
    }, [user]);
    const handleStatusChange = async (event) => {
        const newStatus = event.target.value;
        setStatus(newStatus);

        if (userService) {
            try {
                await userService.updateStatus(newStatus);
                setNotification({
                    open: true,
                    message: 'Status updated successfully',
                    severity: 'success'
                });
            } catch (err) {
                console.error('Error updating status:', err);
                setNotification({
                    open: true,
                    message: 'Failed to update status',
                    severity: 'error'
                });
            }
        }
    };

    const handleSettingChange = (setting) => (event) => {
        setSettings({
            ...settings,
            [setting]: event.target.checked
        });

        setNotification({
            open: true,
            message: `${setting} setting updated`,
            severity: 'success'
        });
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    return (
        <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Settings
            </Typography>

            {/* Profile Section */}
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Profile
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                        src={user?.picture}
                        alt={user?.name}
                        sx={{ width: 80, height: 80, mr: 2 }}
                    />
                    <Box>
                        <Typography variant="h6">{user?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {user?.email}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled
                        sx={{ mb: 2 }}
                    />
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                    Profile information is managed through your Auth0 account.
                </Alert>
            </Paper>

            {/* Status Section */}
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Status
                </Typography>

                <FormControl component="fieldset">
                    <FormLabel component="legend">Set your status</FormLabel>
                    <RadioGroup
                        row
                        name="status"
                        value={status}
                        onChange={handleStatusChange}
                    >
                        <FormControlLabel value="online" control={<Radio color="success" />} label="Online" />
                        <FormControlLabel value="away" control={<Radio color="warning" />} label="Away" />
                        <FormControlLabel value="busy" control={<Radio color="error" />} label="Busy" />
                        <FormControlLabel value="offline" control={<Radio />} label="Offline" />
                    </RadioGroup>
                </FormControl>
            </Paper>

            {/* App Settings Section */}
            <Paper sx={{ p: 3 }} elevation={2}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Application Settings
                </Typography>

                <List>
                    <ListItem>
                        <ListItemIcon>
                            <NotificationIcon />
                        </ListItemIcon>
                        <ListItemText primary="Desktop Notifications" secondary="Receive notifications when app is in background" />
                        <Switch
                            edge="end"
                            checked={settings.notifications}
                            onChange={handleSettingChange('notifications')}
                        />
                    </ListItem>

                    <Divider variant="inset" component="li" />

                    <ListItem>
                        <ListItemIcon>
                            <VolumeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Sound Effects" secondary="Play sounds for new messages and calls" />
                        <Switch
                            edge="end"
                            checked={settings.soundEffects}
                            onChange={handleSettingChange('soundEffects')}
                        />
                    </ListItem>

                    <Divider variant="inset" component="li" />

                    <ListItem>
                        <ListItemIcon>
                            <ThemeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dark Mode" secondary="Use dark theme throughout the application" />
                        <Switch
                            edge="end"
                            checked={settings.darkMode}
                            onChange={handleSettingChange('darkMode')}
                        />
                    </ListItem>

                    <Divider variant="inset" component="li" />

                    <ListItem>
                        <ListItemIcon>
                            <SecurityIcon />
                        </ListItemIcon>
                        <ListItemText primary="Two-Factor Authentication" secondary="Add an extra layer of security" />
                        <Switch
                            edge="end"
                            checked={settings.twoFactorAuth}
                            onChange={handleSettingChange('twoFactorAuth')}
                        />
                    </ListItem>
                </List>
            </Paper>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}