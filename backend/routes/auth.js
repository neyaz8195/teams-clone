const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Import verifyAuth from our custom middleware
const { verifyAuth } = require('../middleware/auth');

// Use verifyAuth (which includes custom audience check) as jwtCheck
const jwtCheck = verifyAuth;

// Register or update user route
router.post('/register', jwtCheck, async (req, res) => {
    try {
        console.log('Auth payload:', req.auth.payload); // Debug log
        const auth0Id = req.auth.payload.sub;

        // Try to get user info from Auth0 if not in token
        const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
            headers: { 'Authorization': req.headers.authorization }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info from Auth0');
        }

        const userInfo = await response.json();
        console.log('User info from Auth0:', userInfo);

        const email = userInfo.email || req.auth.payload.email;
        const name = userInfo.name || req.auth.payload.name || userInfo.nickname || email?.split('@')[0];
        const picture = userInfo.picture || req.auth.payload.picture;

        if (!email || !name) {
            console.error('Missing required user data:', { email, name });
            return res.status(400).json({ error: 'Missing required user data' });
        }

        // Check if user exists
        let user = await User.findByAuth0Id(auth0Id);

        if (user) {
            // Update existing user
            user.name = name || user.name;
            user.email = email || user.email;
            user.picture = picture || user.picture;
            await user.save();
        } else {
            // Create new user
            user = new User({
                auth0Id,
                email,
                name,
                picture
            });
            await user.save();
        }

        res.status(200).json({
            userId: auth0Id,
            name: user.name,
            email: user.email,
            picture: user.picture
        });
    } catch (error) {
        console.error('Auth register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Get user profile
router.get('/profile', jwtCheck, async (req, res) => {
    try {
        const { sub: auth0Id } = req.auth.payload;
        const user = await User.findByAuth0Id(auth0Id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            userId: user.auth0Id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            status: user.status
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Check session status
router.get('/session', jwtCheck, (req, res) => {
    res.status(200).json({ isValid: true });
});

module.exports = router;
