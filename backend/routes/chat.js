const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const redisCache = require('../utils/redisCache');

// Get the Redis client from the app
const getRedisClient = (req) => req.app.get('redisClient');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get conversation messages
router.get('/:userId', async (req, res) => {
    try {
        const { sub: currentUserId } = req.auth.payload;
        const { userId: otherUserId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        // Import Redis cache utils
        const redisCache = require('../utils/redisCache');

        // Try to get from cache first (only for initial load with no skip)
        if (parseInt(skip) === 0) {
            // Create a unique cache key for this conversation
            const cacheKey = `conversation:${currentUserId}:${otherUserId}`;

            // Try to get cached conversation
            const cachedMessages = await redisCache.getValue(cacheKey, true);

            if (cachedMessages) {
                console.log('Serving chat from Redis cache');
                return res.status(200).json(cachedMessages);
            }
        }

        // Cache miss or pagination request, fetch from database
        const messages = await Message.getConversation(
            currentUserId,
            otherUserId,
            parseInt(limit),
            parseInt(skip)
        );

        // Cache the result for future requests (only for initial load)
        if (parseInt(skip) === 0) {
            // Create a unique cache key for this conversation
            const cacheKey = `conversation:${currentUserId}:${otherUserId}`;

            // Cache for 2 minutes (messages are frequently updated)
            await redisCache.setValue(cacheKey, messages, 120);
        }

        res.status(200).json(messages);
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});

// Send message
router.post('/:userId', async (req, res) => {
    try {
        const { sub: senderId } = req.auth.payload;
        const { userId: recipientId } = req.params;
        const { content, messageId } = req.body;

        // Import Redis cache utils
        const redisCache = require('../utils/redisCache');

        const message = new Message({
            messageId: messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sender: senderId,
            recipient: recipientId,
            content,
            timestamp: new Date()
        });

        await message.save();

        // Invalidate cache since we have a new message
        // Delete both conversation cache entries (one for each user's perspective)
        await redisCache.deleteValue(`conversation:${senderId}:${recipientId}`);
        await redisCache.deleteValue(`conversation:${recipientId}:${senderId}`);

        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark messages as read
router.put('/read', async (req, res) => {
    try {
        const { sub: userId } = req.auth.payload;
        const { messageIds } = req.body;

        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ error: 'Invalid message IDs' });
        }

        const result = await Message.markAsRead(messageIds, userId);

        res.status(200).json({
            success: true,
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Upload file attachment
router.post('/upload/:userId', upload.single('file'), async (req, res) => {
    try {
        const { sub: senderId } = req.auth.payload;
        const { userId: recipientId } = req.params;
        const { file } = req;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Determine file type
        const isImage = file.mimetype.startsWith('image/');

        // Create attachment
        const attachment = {
            type: isImage ? 'image' : 'file',
            url: `/uploads/${file.filename}`,
            name: file.originalname,
            size: file.size,
            mimeType: file.mimetype
        };        // Create message with attachment
        const message = new Message({
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sender: senderId,
            recipient: recipientId,
            content: `${isImage ? 'Image' : 'File'}: ${file.originalname}`,
            timestamp: new Date(),
            attachments: [attachment]
        });

        await message.save();

        // Import Redis cache utils
        const redisCache = require('../utils/redisCache');

        // Invalidate cache since we have a new message with attachment
        // Delete both conversation cache entries (one for each user's perspective)
        await redisCache.deleteValue(`conversation:${senderId}:${recipientId}`);
        await redisCache.deleteValue(`conversation:${recipientId}:${senderId}`);

        res.status(201).json(message);
    } catch (error) {
        console.error('Upload attachment error:', error);
        res.status(500).json({ error: 'Failed to upload attachment' });
    }
});

module.exports = router;
