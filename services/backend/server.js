// backend/app.js
console.log("🚀 Starting RHomes Backend...");
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import connectDB from '../database/config/db.js';
import authController from '../database/controllers/authController.js';
import listingController from '../database/controllers/listingController.js';
import otpStore from '../database/utils/otpStore.js';
import userController from '../database/controllers/userController.js';
import logger from './logger.js';

// Load environment variables
dotenv.config();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const app = express();
const PORT = process.env.PORT || 3000;

// Redis connection function
const connectToRedis = async () => {
    try {
        console.log('🔌 Initializing Redis connection...');
        
        if (typeof otpStore.initializeRedis === 'function') {
            await otpStore.initializeRedis();
        } else {
            console.log('⚠️  Using direct Redis connection');
            const { createClient } = await import('redis');
            const redisClient = createClient({
                url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
                socket: {
                    connectTimeout: 60000,
                    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
                }
            });

            redisClient.on('error', (err) => {
                console.error('❌ Redis Client Error:', err);
                logger.error('Redis Client Error', { error: err.message });
            });

            redisClient.on('connect', () => console.log('🟡 Redis connecting...'));
            redisClient.on('ready', () => console.log('✅ Redis connected successfully!'));

            await redisClient.connect();
            
            if (otpStore && typeof otpStore.setRedisClient === 'function') {
                otpStore.setRedisClient(redisClient);
                console.log('✅ Redis client stored in otpStore');
            } else {
                app.locals.redisClient = redisClient;
                global.redisClient = redisClient;
            }
        }

        const redisClient = otpStore.getRedisClient ? otpStore.getRedisClient() : app.locals.redisClient;
        
        if (redisClient && redisClient.isOpen) {
            await redisClient.ping();
            console.log('✅ Redis connected and responsive!');
            return true;
        }
        return false;
    } catch (error) {
        console.error('💥 Redis connection failed:', error.message);
        return false;
    }
};

// Middleware
app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());
app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) }
}));

// Helper to wrap async route handlers
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ✅ FIXED: Health check endpoint - GET method with leading slash
app.get('/api/health', asyncHandler(async (req, res) => {
    const healthCheck = {
        status: 'OK',
        service: 'Backend API',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        redis: 'Disconnected',
        database: 'Unknown'
    };

    try {
        const redisClient = otpStore.getRedisClient ? otpStore.getRedisClient() : app.locals.redisClient;
        if (redisClient && redisClient.isOpen) {
            await redisClient.ping();
            healthCheck.redis = 'Connected';
        }
    } catch (error) {
        healthCheck.redis = 'Error: ' + error.message;
    }

    try {
        const mongoose = await import('mongoose');
        healthCheck.database = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    } catch (error) {
        healthCheck.database = 'Error: ' + error.message;
    }

    res.json(healthCheck);
}));

// API Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'RHomes Backend is running! 🎉',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            users: '/api/users/*',
            listings: '/api/listings/*'
        }
    });
});

// User routes
app.route('/api/users')
    .get(asyncHandler(userController.getUsers))
    .post(asyncHandler(userController.createUser));

app.route('/api/users/:id')
    .get(asyncHandler(userController.getUser))
    .put(asyncHandler(userController.updateUser))
    .delete(asyncHandler(userController.deleteUser));

app.get('/api/users/:id/listings', asyncHandler(userController.getUserListings));

// Auth routes
app.post('/api/auth/register', asyncHandler(authController.register));
app.post('/api/auth/request-otp', asyncHandler(authController.requestOtp));
app.post('/api/auth/verify-otp', asyncHandler(authController.verifyOtp));

// Listing routes
app.route('/api/listings')
    .get(asyncHandler(listingController.getListings))
    .post(asyncHandler(listingController.createListing));

app.route('/api/listings/:id')
    .get(asyncHandler(listingController.getListing))
    .put(asyncHandler(listingController.updateListing))
    .delete(asyncHandler(listingController.deleteListing));

app.get('/api/listings/city/:city', asyncHandler(listingController.getListingsByCity));
app.get('/api/listings/price/:min/:max', asyncHandler(listingController.getListingsByPriceRange));

// Error handling
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    logger.error('Server Error', { error: err.message, stack: err.stack });
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: Object.values(err.errors).map(e => e.message)
        });
    }
    
    res.status(500).json({ error: 'Internal server error' });
});

// Server startup
const startServer = async () => {
    try {
        console.log('📊 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ MongoDB connected successfully!');

        console.log('🔌 Connecting to Redis...');
        const redisConnected = await connectToRedis();
        
        if (!redisConnected) {
            console.log('⚠️  Using in-memory fallback for OTP storage');
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🎉 RHomes Backend running on port ${PORT}`);
            console.log(`📍 Health: http://localhost:${PORT}/api/health`);
            console.log(`📍 API: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('💥 Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
export { startServer, app, connectToRedis };