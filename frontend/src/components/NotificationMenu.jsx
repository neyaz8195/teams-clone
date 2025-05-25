import React, { useState } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider,
    ListItemIcon,
    ListItemText,
    Button
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Chat as ChatIcon,
    VideoCall as VideoCallIcon,
    CheckCircle as CheckCircleIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';

const NotificationMenu = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClickNotification = (notification) => {
        markAsRead(notification.id);

        if (notification.type === 'message') {
            navigate('/chat');
            // Additional logic to open chat with specific user would be implemented here
        } else if (notification.type === 'call') {
            navigate('/calls');
            // Additional logic to accept call would be implemented here
        }

        handleClose();
    };

    const handleClearNotification = (event, notificationId) => {
        event.stopPropagation();
        clearNotification(notificationId);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleOpen}
                aria-controls={open ? 'notification-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                id="notification-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'notification-button',
                }}
                PaperProps={{
                    style: {
                        maxHeight: 400,
                        width: 360,
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Notifications</Typography>
                    <Box>
                        {unreadCount > 0 && (
                            <Button size="small" onClick={markAllAsRead} startIcon={<CheckCircleIcon />}>
                                Mark all read
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button size="small" onClick={clearAllNotifications} startIcon={<DeleteIcon />}>
                                Clear all
                            </Button>
                        )}
                    </Box>
                </Box>
                <Divider />

                {notifications.length === 0 ? (
                    <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                            No notifications
                        </Typography>
                    </MenuItem>
                ) : (
                    notifications.map((notification) => (
                        <MenuItem
                            key={notification.id}
                            onClick={() => handleClickNotification(notification)}
                            sx={{
                                backgroundColor: notification.read ? 'inherit' : 'rgba(0, 0, 0, 0.04)',
                                py: 1
                            }}
                        >
                            <ListItemIcon>
                                {notification.type === 'message' ? <ChatIcon color="primary" /> : <VideoCallIcon color="secondary" />}
                            </ListItemIcon>
                            <ListItemText
                                primary={notification.type === 'message' ? 'New message' : 'Incoming call'}
                                secondary={
                                    <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="body2" component="span" noWrap>
                                            {notification.content}
                                        </Typography>
                                        <Typography variant="caption" component="span" color="text.secondary">
                                            {formatTime(notification.timestamp)}
                                        </Typography>
                                    </Box>
                                }
                            />
                            <IconButton
                                size="small"
                                onClick={(e) => handleClearNotification(e, notification.id)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </MenuItem>
                    ))
                )}
            </Menu>
        </>
    );
};

export default NotificationMenu;