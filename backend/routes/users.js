const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { asyncHandler, errorResponses } = require('../utils/errorHandler');

// Get all users
router.get('/', asyncHandler(async (req, res) => {
    const { sub: currentUserId } = req.auth.payload;

    // Fetch users directly from MongoDB
    const users = await User.find({ auth0Id: { $ne: currentUserId } })
        .select('auth0Id email name picture status lastActive')
        .sort({ lastActive: -1 });

    res.status(200).json(users);
}));

// Get user by ID
router.get('/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Fetch user directly from MongoDB
    const user = await User.findOne({ auth0Id: userId })
        .select('auth0Id email name picture status lastActive');

    if (!user) {
        throw errorResponses.notFound('User not found');
    }

    res.status(200).json(user);
}));

// Update user status
router.put('/status', asyncHandler(async (req, res) => {
    const { sub: userId } = req.auth.payload;
    const { status } = req.body;

    const user = await User.findOneAndUpdate(
        { auth0Id: userId },
        {
            $set: {
                status,
                lastActive: new Date()
            }
        },
        { new: true }
    );

    if (!user) {
        throw errorResponses.notFound('User not found');
    }

    res.status(200).json(user);
}));

// Add contact
router.post('/contacts', asyncHandler(async (req, res) => {
    const { sub: userId } = req.auth.payload;
    const { contactId } = req.body;

    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
        throw errorResponses.notFound('User not found');
    }

    try {
        await user.addContact(contactId);
        res.status(200).json({ message: 'Contact added successfully' });
    } catch (error) {
        if (error.message === 'Contact user not found') {
            throw errorResponses.notFound('Contact user not found');
        }
        throw error;
    }
}));

// Get user contacts
router.get('/contacts', asyncHandler(async (req, res) => {
    const { sub: userId } = req.auth.payload;

    const user = await User.findOne({ auth0Id: userId })
        .select('contacts')
        .populate('contacts.userId', 'auth0Id email name picture status lastActive');

    if (!user) {
        throw errorResponses.notFound('User not found');
    }

    res.status(200).json(user.contacts);
}));

module.exports = router;
