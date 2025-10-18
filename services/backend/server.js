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

// Import User Model
import User from '../database/models/User.js';

// ==================== SIMPLE OTP MANAGER (No Email Dependency) ====================
class SimpleOTPManager {
  constructor() {
    this.otpStorage = new Map();
    this.otpExpiryMinutes = 10;
    console.log('✅ Simple OTP Manager initialized');
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(email, purpose = 'account_verification') {
    try {
      console.log(`📧 [DEBUG] Generating OTP for: ${email}`);
      
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);
      
      // Store OTP in memory
      this.otpStorage.set(email, {
        otp,
        expiresAt,
        purpose,
        createdAt: new Date()
      });

      console.log(`✅ [DEBUG] OTP ${otp} generated for ${email}. It will expire at ${expiresAt}`);
      console.log(`📝 [DEBUG] Current OTP storage:`, Array.from(this.otpStorage.entries()));

      // In development, we'll return the OTP in the response
      return {
        success: true,
        message: 'OTP sent successfully',
        debug_otp: otp, // Only in development
        resendAllowed: true,
        cooldown: 120000
      };
    } catch (error) {
      console.error('❌ Error in sendOTP:', error);
      throw error;
    }
  }

  async verifyOTP(email, otp, purpose = 'account_verification') {
    try {
      console.log(`🔍 [DEBUG] Verifying OTP for: ${email}, OTP: ${otp}`);
      
      const storedData = this.otpStorage.get(email);
      
      if (!storedData) {
        console.log('❌ No OTP found for email:', email);
        return {
          success: false,
          verified: false,
          message: 'No OTP found or OTP expired'
        };
      }

      if (new Date() > storedData.expiresAt) {
        this.otpStorage.delete(email);
        console.log('❌ OTP expired for:', email);
        return {
          success: false,
          verified: false,
          message: 'OTP has expired'
        };
      }

      if (storedData.otp !== otp) {
        console.log('❌ Invalid OTP for:', email);
        return {
          success: false,
          verified: false,
          message: 'Invalid OTP'
        };
      }

      // OTP is valid
      this.otpStorage.delete(email);
      console.log('✅ OTP verified successfully for:', email);
      
      return {
        success: true,
        verified: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('❌ Error in verifyOTP:', error);
      throw error;
    }
  }

  async resendOTP(email, purpose = 'account_verification') {
    return this.sendOTP(email, purpose);
  }
}

// Create OTP manager instance
const otpManager = new SimpleOTPManager();

// Redis connection function (optional for now)
const connectToRedis = async () => {
  try {
    console.log('🔌 Skipping Redis for now - using memory storage');
    return true;
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

// Health check endpoint
app.get('/api/health', asyncHandler(async (req, res) => {
  const healthCheck = {
    status: 'OK',
    service: 'Backend API',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    database: 'Unknown'
  };

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
      listings: '/api/listings/*',
      otp: '/api/send-otp, /api/verify-otp, /api/register, /api/resend-otp'
    }
  });
});

// ==================== OTP ROUTES ====================

// Send OTP
app.post('/api/send-otp', asyncHandler(async (req, res) => {
  console.log('📧 OTP Request received:', req.body);
  
  try {
    const { email, purpose = 'account_verification' } = req.body;
    
    if (!email) {
      console.log('❌ Missing email in request');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('🔍 Checking for existing user:', email);
    
    // Check if user already exists (for registration purpose)
    if (purpose === 'account_verification') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('❌ User already exists:', email);
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    console.log('🔄 Calling OTP Manager for:', email);
    const result = await otpManager.sendOTP(email, purpose);
    console.log('✅ OTP sent successfully:', result);
    
    res.json(result);
  } catch (error) {
    console.error('💥 Error in /api/send-otp:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP',
      debug: 'Check server logs for details'
    });
  }
}));

// Verify OTP
app.post('/api/verify-otp', asyncHandler(async (req, res) => {
  console.log('🔍 OTP Verification request:', req.body);
  
  try {
    const { email, otp, purpose = 'account_verification' } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const result = await otpManager.verifyOTP(email, otp, purpose);
    res.json(result);
  } catch (error) {
    console.error('💥 Error in /api/verify-otp:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
}));

// Complete registration
app.post('/api/register', asyncHandler(async (req, res) => {
  console.log('👤 Registration request:', { ...req.body, password: '***' });
  
  try {
    const { name, email, role, password, bio, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      role: role || 'tenant',
      password,
      bio: bio || '',
      phone,
      verified: true
    });

    await user.save();
    console.log('✅ User registered successfully:', email);

    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('💥 Error during registration:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
}));

// Resend OTP
app.post('/api/resend-otp', asyncHandler(async (req, res) => {
  try {
    const { email, purpose = 'account_verification' } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await otpManager.resendOTP(email, purpose);
    res.json(result);
  } catch (error) {
    console.error('💥 Error in /api/resend-otp:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend OTP'
    });
  }
}));

// ==================== EXISTING ROUTES ====================

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
      console.log('⚠️  Using in-memory OTP storage');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎉 RHomes Backend running on port ${PORT}`);
      console.log(`📍 Health: http://localhost:${PORT}/api/health`);
      console.log(`📍 API: http://localhost:${PORT}`);
      console.log(`📍 OTP Endpoints (DEBUG MODE):`);
      console.log(`   - POST /api/send-otp (returns OTP in response for testing)`);
      console.log(`   - POST /api/verify-otp`);
      console.log(`   - POST /api/register`);
      console.log(`   - POST /api/resend-otp`);
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;