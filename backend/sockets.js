const redisCache = require('./utils/redisCache');

module.exports = (io, redisClient) => {
    // Store active users
    const users = {};

    // Handle connections
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // User authentication and setup
        socket.on('user:register', async (userData) => {
            const userId = userData.userId;

            try {
                // Store user socket mapping
                users[userId] = socket.id;
                socket.userId = userId;

                // Store in Redis for scaling (multiple servers)
                await redisClient.set(`user:${userId}`, socket.id);                // Update user status in cache
                await redisCache.cacheUserStatus(userId, true);

                // Get online users from Redis
                const onlineUsers = await redisCache.getOnlineUsers();

                // Notify other users
                socket.broadcast.emit('user:online', { userId });

                // Send active users list to the newly connected user
                socket.emit('users:active', { activeUsers: onlineUsers });
            } catch (error) {
                console.error('Error in user:register:', error);
                socket.emit('error', { message: 'Failed to register user presence' });
            }
        });

        // Handle private messages
        socket.on('message:send', async (data) => {
            const { to, message, timestamp, messageId } = data;
            const from = socket.userId;

            try {
                // Get recipient socket id
                const recipientSocketId = users[to] || await redisClient.get(`user:${to}`); if (recipientSocketId) {
                    // Send message to recipient
                    io.to(recipientSocketId).emit('message:receive', {
                        from,
                        message,
                        timestamp,
                        messageId: messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });

                    // Send delivery receipt to sender
                    socket.emit('message:delivered', { messageId, to });
                }
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle message read receipts
        socket.on('message:read', async ({ messageId, from }) => {
            try {
                const senderSocketId = users[from] || await redisClient.get(`user:${from}`);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message:read', { messageId, by: socket.userId });
                }
            } catch (error) {
                console.error('Error handling read receipt:', error);
            }
        });

        // WebRTC signaling
        socket.on('call:offer', async (data) => {
            const { to, offer } = data;
            const from = socket.userId;

            try {
                const recipientSocketId = users[to] || await redisClient.get(`user:${to}`);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('call:offer', { from, offer });
                }
            } catch (error) {
                console.error('Error handling call offer:', error);
                socket.emit('error', { message: 'Failed to initiate call' });
            }
        });

        socket.on('call:answer', async (data) => {
            const { to, answer } = data;
            const from = socket.userId;

            try {
                const recipientSocketId = users[to] || await redisClient.get(`user:${to}`);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('call:answer', { from, answer });
                }
            } catch (error) {
                console.error('Error handling call answer:', error);
                socket.emit('error', { message: 'Failed to send call answer' });
            }
        });

        socket.on('call:ice-candidate', async (data) => {
            const { to, candidate } = data;
            const from = socket.userId;

            try {
                const recipientSocketId = users[to] || await redisClient.get(`user:${to}`);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('call:ice-candidate', { from, candidate });
                }
            } catch (error) {
                console.error('Error handling ICE candidate:', error);
            }
        });

        socket.on('call:end', async (data) => {
            const { to } = data;
            const from = socket.userId;

            try {
                const recipientSocketId = users[to] || await redisClient.get(`user:${to}`);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('call:end', { from });
                }
            } catch (error) {
                console.error('Error ending call:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.id}`);

            if (socket.userId) {
                try {
                    // Clean up user references
                    delete users[socket.userId];
                    await redisClient.del(`user:${socket.userId}`);

                    // Update user status in cache
                    await redisCache.cacheUserStatus(socket.userId, false);

                    // Notify other users
                    socket.broadcast.emit('user:offline', { userId: socket.userId });
                } catch (error) {
                    console.error('Error handling disconnect:', error);
                }
            }
        });
    });
};
