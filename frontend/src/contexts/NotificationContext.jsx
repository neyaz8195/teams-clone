import React, { createContext, useState, useEffect, useContext } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';

// Create context
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [missedCalls, setMissedCalls] = useState(0);
    const { socket } = useSocket();
    const { user } = useAuth();

    // Update unread count when notifications change
    useEffect(() => {
        const count = notifications.filter(n => !n.read).length;
        setUnreadCount(count);

        // Count missed calls
        const callsCount = notifications.filter(n => !n.read && n.type === 'call').length;
        setMissedCalls(callsCount);
    }, [notifications]);

    // Listen for socket events
    useEffect(() => {
        if (!socket) return;

        // Handle new message notifications
        const handleNewMessage = (data) => {
            const { from, message, timestamp, messageId } = data;

            // Don't add notification if chat is currently open with this user
            // This would be handled in the chat page component

            const newNotification = {
                id: `msg_${messageId}`,
                type: 'message',
                sender: from,
                content: message,
                timestamp,
                read: false
            };

            setNotifications(prev => [newNotification, ...prev]);

            // Show browser notification
            showBrowserNotification('New Message', message);
        };

        // Handle call notifications
        const handleCallOffer = (data) => {
            const { from, offer } = data;

            const newNotification = {
                id: `call_${Date.now()}`,
                type: 'call',
                sender: from,
                content: 'Incoming video call',
                timestamp: new Date().toISOString(),
                read: false,
                offer
            };

            setNotifications(prev => [newNotification, ...prev]);

            // Show browser notification
            showBrowserNotification('Incoming Call', 'Someone is calling you');
        };

        socket.on('message:receive', handleNewMessage);
        socket.on('call:offer', handleCallOffer);

        return () => {
            socket.off('message:receive', handleNewMessage);
            socket.off('call:offer', handleCallOffer);
        };
    }, [socket, user]);

    // Show browser notification
    const showBrowserNotification = (title, body) => {
        // Check if browser notifications are supported
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return;
        }

        // Check if permission is granted
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        }
        // Otherwise, request permission
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            });
        }
    };

    // Mark notification as read
    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        );
    };

    // Mark all notifications as read
    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        );
    };

    // Clear a notification
    const clearNotification = (notificationId) => {
        setNotifications(prev =>
            prev.filter(notification => notification.id !== notificationId)
        );
    };

    // Clear all notifications
    const clearAllNotifications = () => {
        setNotifications([]);
    }; return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                missedCalls,
                markAsRead,
                markAllAsRead,
                clearNotification,
                clearAllNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;