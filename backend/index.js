const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const helmet = require('helmet');

// Enable mongoose debug mode
mongoose.set('debug', true);

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const callRoutes = require('./routes/calls');

// Middleware
const { verifyAuth } = require('./middleware/auth');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/teams-clone', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", "blob:", "data:", "http://localhost:5000"],
                mediaSrc: ["'self'", "blob:", "data:", "http://localhost:5000"],
            },
        },
    })
);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO initialization
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyAuth, userRoutes);
app.use('/api/chat', verifyAuth, chatRoutes);
app.use('/api/calls', verifyAuth, callRoutes);

// Error handling middleware (should be after all routes)
const { errorMiddleware } = require('./utils/errorHandler');
app.use(errorMiddleware);

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }

        // Create a proper Express-like request mock
        const mockReq = {
            headers: {
                authorization: `Bearer ${token}`,
                'content-type': 'application/json'
            },
            method: 'GET',
            url: socket.handshake.url || '/',
            is: function (type) {
                return type === 'application/json';
            },
            get: function (header) {
                return this.headers[header.toLowerCase()];
            }
        };

        // Create a proper Express-like response mock
        const mockRes = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) { },
            set: function () { return this; },
            end: function () { },
            locals: {}
        };

        // Use Promise to handle the async verification
        await new Promise((resolve, reject) => {
            verifyAuth(mockReq, mockRes, (err) => {
                if (err) {
                    console.error('Socket auth error:', err);
                    reject(err);
                } else {
                    socket.auth = mockReq.auth;
                    resolve();
                }
            });
        });

        next();
    } catch (error) {
        console.error('Socket auth error:', error);
        next(new Error("Authentication error"));
    }
});

// Socket.IO event handlers
(async () => {
    // Initialize socket handlers
    require('./sockets')(io);
})();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
