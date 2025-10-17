import connectDB, { disconnectDB, mongoose } from './config/db.js';
import controllers from './controllers/index.js';
import models from './models/index.js';
import dbUtils from './utils/dbUtils.js';

// Main database module that exports all database-related functionality

// Export database configuration
export { connectDB, disconnectDB, mongoose };

// Export models
export { models };

// Export controllers
export { controllers };

// Export utilities
export { dbUtils };

// Optionally, export everything as default for convenience
export default {
  connectDB,
  disconnectDB,
  mongoose,
  models,
  controllers,
  dbUtils
};