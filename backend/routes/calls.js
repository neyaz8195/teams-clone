const express = require('express');
const router = express.Router();

// Call history will be tracked via socket.io and MongoDB
// This API is mainly for managing call metadata

// Get call history
router.get('/history', async (req, res) => {
    try {
        const { sub: userId } = req.auth.payload;

        // Placeholder for call history implementation
        // This would typically query a calls collection in MongoDB

        // For now, return empty array
        res.status(200).json([]);
    } catch (error) {
        console.error('Get call history error:', error);
        res.status(500).json({ error: 'Failed to fetch call history' });
    }
});

module.exports = router;
