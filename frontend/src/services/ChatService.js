import apiService from './ApiService';

export class ChatService {
    constructor(socket, apiService) {
        this.socket = socket;
        this.api = apiService;
        this.messageHandlers = new Map();
        this.deliveryHandlers = new Map();
        this.readHandlers = new Map();

        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Incoming messages
        this.socket.on('message:receive', (data) => {
            const { from, message, timestamp, messageId } = data;

            // Call registered handlers for this sender
            const handler = this.messageHandlers.get(from);
            if (handler) {
                handler(message, from, timestamp, messageId);
            }

            // Send read receipt
            this.markAsRead([messageId], from);
        });

        // Message delivery status
        this.socket.on('message:delivered', ({ messageId, to }) => {
            const handler = this.deliveryHandlers.get(to);
            if (handler) {
                handler(messageId, to);
            }
        });

        // Message read status
        this.socket.on('message:read', ({ messageId, by }) => {
            const handler = this.readHandlers.get(by);
            if (handler) {
                handler(messageId, by);
            }
        });
    }

    // Register handlers for messages from a specific user
    registerMessageHandler(userId, callback) {
        this.messageHandlers.set(userId, callback);

        // Clean up function
        return () => {
            this.messageHandlers.delete(userId);
        };
    }

    // Register handlers for delivery receipts
    registerDeliveryHandler(userId, callback) {
        this.deliveryHandlers.set(userId, callback);

        return () => {
            this.deliveryHandlers.delete(userId);
        };
    }

    // Register handlers for read receipts
    registerReadHandler(userId, callback) {
        this.readHandlers.set(userId, callback);

        return () => {
            this.readHandlers.delete(userId);
        };
    }    // Send a message
    async sendMessage(userId, message) {
        const messageData = {
            to: userId,
            message,
            timestamp: new Date().toISOString(),
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        try {
            // First save to MongoDB through the API
            await this.api.post(`/api/chat/${userId}`, {
                content: message,
                messageId: messageData.messageId
            });

            // Then emit through socket for real-time delivery
            this.socket.emit('message:send', messageData);
        } catch (err) {
            console.error('Error saving message:', err);
            throw err; // Re-throw to handle in the UI
        }

        return messageData;
    }

    // Mark messages as read
    markAsRead(messageIds, from) {
        // Notify sender
        this.socket.emit('message:read', { messageIds, from });

        // Update in database
        this.api.put('/api/chat/read', { messageIds })
            .catch(err => console.error('Error marking messages as read:', err));
    }

    // Get conversation history
    async getConversation(userId, limit = 50, skip = 0) {
        try {
            return await this.api.get(`/api/chat/${userId}?limit=${limit}&skip=${skip}`);
        } catch (error) {
            console.error('Error fetching conversation:', error);
            return [];
        }
    }

    // Upload file attachment
    async uploadAttachment(userId, file) {
        try {
            return await this.api.uploadFile(`/api/chat/upload/${userId}`, file);
        } catch (error) {
            console.error('Error uploading attachment:', error);
            throw error;
        }
    }
}

export default ChatService;
