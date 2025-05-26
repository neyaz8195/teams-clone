import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
    AppBar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    useTheme,
} from '@mui/material';
import {
    Chat as ChatIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
    VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import ChatPage from '../pages/ChatPage';
import ContactsPage from '../pages/ContactsPage';
import SettingsPage from '../pages/SettingsPage';
import VideoCallPage from '../pages/VideoCallPage';

const drawerWidth = 240;

export default function MainLayout() {
    const theme = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleProfileClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleProfileClose();
        logout();
    };

    const menuItems = [
        { text: 'Chat', icon: <ChatIcon />, path: '/' },
        { text: 'Contacts', icon: <PeopleIcon />, path: '/contacts' },
        { text: 'Video Call', icon: <VideoCallIcon />, path: '/video-call' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
                component="img"
                src="/teams-clone-logo.svg"
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    display: 'block'
                }}
            />
            <Typography variant="h6" noWrap>
                Teams Clone
            </Typography>
        </Box>
            <Divider />
            <List sx={{ flex: 1 }}>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => {
                            navigate(item.path);
                            setMobileOpen(false);
                        }}
                        selected={location.pathname === item.path}
                        sx={{
                            borderRadius: 1,
                            mx: 1,
                            my: 0.5,
                        }}
                    >
                        <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                <ListItem
                    button
                    onClick={handleProfileClick}
                    sx={{ p: 2 }}
                >
                    <ListItemIcon>
                        <Avatar src={user?.picture} alt={user?.name} />
                    </ListItemIcon>
                    <ListItemText
                        primary={user?.name}
                        secondary={user?.email}
                        primaryTypographyProps={{ noWrap: true }}
                        secondaryTypographyProps={{ noWrap: true }}
                    />
                </ListItem>
            </List>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    display: { sm: 'none' },
                    ml: { sm: `${drawerWidth}px` },
                    boxShadow: 'none',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" color="text.primary">
                        Teams Clone
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: `1px solid ${theme.palette.divider}`,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.background.paper,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 0,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    height: '100vh',
                    overflow: 'hidden',
                    bgcolor: 'background.default',
                }}
            >                <Toolbar sx={{ display: { sm: 'none' } }} />
                <Outlet />
            </Box>
        </Box>
    );
}
