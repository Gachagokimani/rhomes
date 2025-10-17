import mongoose from 'mongoose';
import logger from '../../backend/logger.js';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rhomes';

// Handle unhandled promise rejections globally for DB
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION in DB module', {
    reason,
    promise
  });
  process.exit(1);
});

// Connect to MongoDB with retry/backoff
const connectDB = async ({ retries = 10, delay = 3000 } = {}) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      await mongoose.connect(MONGODB_URI);
      logger.info(`MongoDB Connected: ${mongoose.connection.name}`);
      return;
    } catch (error) {
      attempt += 1;
      logger.warn(`MongoDB connection attempt ${attempt} failed: ${error.message}`);
      if (attempt >= retries) {
        logger.error(`Failed to connect to MongoDB after ${attempt} attempts`);
        throw error; // let caller decide how to handle final failure
      }
      // wait before retrying
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
  }
};

export default connectDB;
export { disconnectDB, mongoose };