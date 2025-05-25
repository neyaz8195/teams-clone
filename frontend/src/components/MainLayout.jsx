import { useState, useEffect } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Badge } from '@mui/material';
import { Menu as MenuIcon, Chat as ChatIcon, VideoCall as VideoCallIcon, People as PeopleIcon, Logout as LogoutIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationMenu from './NotificationMenu';
import { useNotifications } from '../hooks/useNotifications';

const drawerWidth = 240;

// Badge components for navigation items
const ChatBadge = ({ icon }) => {
    const { unreadCount } = useNotifications();
    return (
        <Badge badgeContent={unreadCount} color="error" overlap="circular">
            {icon}
        </Badge>
    );
};

const CallsBadge = ({ icon }) => {
    const { missedCalls = 0 } = useNotifications();
    return (
        <Badge badgeContent={missedCalls} color="error" overlap="circular">
            {icon}
        </Badge>
    );
};

export default function MainLayout({ children }) {
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('chat');

    // Set active page based on current route
    useEffect(() => {
        const path = location.pathname.split('/')[1] || 'chat';
        setActivePage(path);
    }, [location]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navigateTo = (page) => {
        navigate(`/${page}`);
        setMobileOpen(false);
    };

    // Main navigation items
    const navItems = [
        { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
        { id: 'calls', label: 'Calls', icon: <VideoCallIcon /> },
        { id: 'contacts', label: 'Contacts', icon: <PeopleIcon /> },
        { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
    ];

    const drawer = (
        <Box>
            <Toolbar sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                <Typography variant="h6" component="div">
                    Teams Clone
                </Typography>
            </Toolbar>
            <Divider />
            {user && (
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2 }}>
                    <Avatar alt={user.name} src={user.picture} sx={{ mr: 2 }} />
                    <Box>
                        <Typography variant="subtitle1" noWrap>
                            {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {user.email}
                        </Typography>
                    </Box>
                </Box>
            )}
            <Divider />
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.id} disablePadding>
                        <ListItemButton
                            selected={activePage === item.id}
                            onClick={() => navigateTo(item.id)}
                        >                            <ListItemIcon>
                                {item.id === 'chat' ? (
                                    <ChatBadge icon={item.icon} />
                                ) : item.id === 'calls' ? (
                                    <CallsBadge icon={item.icon} />
                                ) : item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={logout}>
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
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
                    </IconButton>                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {navItems.find(item => item.id === activePage)?.label || 'Teams Clone'}
                    </Typography>
                    <NotificationMenu />
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
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Toolbar />
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
