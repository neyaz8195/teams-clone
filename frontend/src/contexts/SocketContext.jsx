import { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

export function SocketProvider({ children, user, token }) {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (user && token) {
            // Initialize socket connection with auth token
            const newSocket = io(import.meta.env.VITE_API_URL, {
                auth: { token },
                transports: ['websocket']
            });

            // Socket connection events
            newSocket.on('connect', () => {
                console.log('Socket connected');
                setConnected(true);

                // Register user with socket
                newSocket.emit('user:register', { userId: user.userId });
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                setConnected(false);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setConnected(false);
            });

            // Handle user online status
            newSocket.on('users:active', ({ activeUsers }) => {
                setOnlineUsers(activeUsers);
            });

            newSocket.on('user:online', ({ userId }) => {
                setOnlineUsers(prev => [...prev, userId]);
            });

            newSocket.on('user:offline', ({ userId }) => {
                setOnlineUsers(prev => prev.filter(id => id !== userId));
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                if (newSocket) {
                    newSocket.disconnect();
                }
            };
        }
    }, [user, token]);

    // Return socket context
    const socketContextValue = {
        socket,
        connected,
        onlineUsers,
        isUserOnline: (userId) => onlineUsers.includes(userId)
    };

    return (
        <SocketContext.Provider value={socketContextValue}>
            {children}
        </SocketContext.Provider>
    );
}
