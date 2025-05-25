const express = require('express');
const router = express.Router();
const User = require('../models/user');
const redisCache = require('../utils/redisCache');
const { asyncHandler, errorResponses } = require('../utils/errorHandler');

// Get all users
router.get('/', asyncHandler(async (req, res) => {
    const { sub: currentUserId } = req.auth.payload;

    // Create cache key based on current user
    const cacheKey = `users:all:${currentUserId}`;

    // Use cacheResult to get from cache or fetch from database
    const users = await redisCache.cacheResult(
        cacheKey,
        async () => {
            return await User.find({ auth0Id: { $ne: currentUserId } })
                .select('auth0Id name email picture status');
        },
        300 // Cache for 5 minutes
    );

    res.status(200).json(users);
}));

// Get user by ID
router.get('/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Create cache key for specific user
    const cacheKey = `users:single:${userId}`;

    // Try to get from cache first, then fetch from database if needed
    const user = await redisCache.cacheResult(
        cacheKey,
        async () => {
            const userDoc = await User.findOne({ auth0Id: userId })
                .select('auth0Id name email picture status');

            if (!userDoc) return null;
            return userDoc;
        },
        300 // Cache for 5 minutes
    );

    if (!user) {
        throw errorResponses.notFound(`User with ID ${userId} not found`);
    }

    res.status(200).json(user);
}));

// Update user status
router.put('/status', asyncHandler(async (req, res) => {
    const { sub: userId } = req.auth.payload;
    const { status } = req.body;

    if (!['online', 'away', 'busy', 'offline'].includes(status)) {
        throw errorResponses.badRequest('Invalid status value. Must be one of: online, away, busy, offline');
    }

    const user = await User.findOneAndUpdate(
        { auth0Id: userId },
        { status, lastActive: new Date() },
        { new: true }
    );

    if (!user) {
        throw errorResponses.notFound('User not found');
    }

    // Invalidate cache entries for this user
    await redisCache.deleteValue(`users:single:${userId}`);

    // Also invalidate the all users cache since this user's status changed
    // We use a wildcard pattern to delete all user list caches
    const client = await redisCache.getClient();
    const keys = await client.keys('users:all:*');
    if (keys.length > 0) {
        await client.del(keys);
    }

    res.status(200).json({ status: user.status });
}));

// Add contact
router.post('/contacts', asyncHandler(async (req, res) => {
    const { sub: userId } = req.auth.payload;
    const { contactId } = req.body;

    if (!contactId) {
        throw errorResponses.badRequest('Contact ID is required');
    }

    // Check if contactId is valid
    const contactUser = await User.findOne({ auth0Id: contactId });
    if (!contactUser) {
        throw errorResponses.notFound(`Contact user with ID ${contactId} not found`);
    }

    // Get current user
    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
        throw errorResponses.notFound('User not found');
    }

    // Add contact to user's contacts
    const added = await user.addContact(contactId);
    if (!added) {
        throw errorResponses.conflict('Contact already exists in your contacts list');
    }

    // Invalidate user cache
    await redisCache.deleteValue(`users:single:${userId}`);

    res.status(200).json({ success: true });
}));

// Get user contacts
router.get('/contacts', asyncHandler(async (req, res) => {
    const { sub: userId } = req.auth.payload;

    // Create cache key for user contacts
    const cacheKey = `users:contacts:${userId}`;

    // Get contacts with caching
    const contacts = await redisCache.cacheResult(
        cacheKey,
        async () => {
            const user = await User.findOne({ auth0Id: userId })
                .populate('contacts.userId', 'auth0Id name picture status');

            if (!user) {
                return null;
            }

            return user.contacts;
        },
        300 // Cache for 5 minutes
    );

    if (contacts === null) {
        throw errorResponses.notFound('User not found');
    }

    res.status(200).json(contacts);
}));

module.exports = router;
