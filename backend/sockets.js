module.exports = (io) => {
    // Store active users
    const users = {};
    const onlineUsers = new Set();

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
                onlineUsers.add(userId);

                // Notify other users
                socket.broadcast.emit('user:online', { userId });

                // Send active users list to the newly connected user
                socket.emit('users:active', { activeUsers: Array.from(onlineUsers) });
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
                const recipientSocketId = users[to];
                if (recipientSocketId) {
                    // Send message to recipient
                    io.to(recipientSocketId).emit('message:receive', {
                        from,
                        message,
                        timestamp,
                        messageId: messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    });
                }
            } catch (error) {
                console.error('Error in message:send:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing status
        socket.on('typing:start', (data) => {
            const recipientSocketId = users[data.to];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('typing:start', { from: socket.userId });
            }
        });

        socket.on('typing:stop', (data) => {
            const recipientSocketId = users[data.to];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('typing:stop', { from: socket.userId });
            }
        });        // Handle video call signaling
        socket.on('call:offer', (data) => {
            console.log('Received call offer from:', socket.userId, 'to:', data.to);
            const recipientSocketId = users[data.to];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('call:offer', {
                    from: socket.userId,
                    offer: data.offer
                });
            }
        });

        socket.on('call:answer', (data) => {
            console.log('Received call answer from:', socket.userId, 'to:', data.to);
            const recipientSocketId = users[data.to];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('call:answer', {
                    from: socket.userId,
                    answer: data.answer
                });
            }
        });

        socket.on('call:ice-candidate', (data) => {
            console.log('Received ICE candidate from:', socket.userId, 'to:', data.to);
            const recipientSocketId = users[data.to];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('call:ice-candidate', {
                    from: socket.userId,
                    candidate: data.candidate
                });
            }
        });

        socket.on('call:end', (data) => {
            const recipientSocketId = users[data.to];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('call:ended', {
                    from: socket.userId
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            if (socket.userId) {
                delete users[socket.userId];
                onlineUsers.delete(socket.userId);
                socket.broadcast.emit('user:offline', { userId: socket.userId });
            }
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
