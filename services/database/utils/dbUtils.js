import mongoose from 'mongoose';
import logger from '../../backend/logger.js';

/**
 * Check if a MongoDB ObjectId is valid
 * @param {string} id - The ID to check
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Format error messages from Mongoose validation errors
 * @param {Error} error - The error object
 * @returns {string[]} - Array of error messages
 */
export const formatValidationErrors = (error) => {
  if (error.name !== 'ValidationError') {
    return ['An error occurred'];
  }
  return Object.values(error.errors).map(err => err.message);
};

/**
 * Handle API errors with consistent formatting
 * @param {Error} error - The error object
 * @param {Response} res - Express response object
 * @returns {Response} - Formatted error response
 */
export const handleApiError = (error, res) => {
  logger.error(`API Error: ${error.message}`);

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = formatValidationErrors(error);
    return res.status(400).json({ success: false, error: messages });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }

  // Handle duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    });
  }

  // Default server error
  return res.status(500).json({ success: false, error: 'Server Error' });
};

/**
 * Create pagination metadata for API responses
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} - Pagination metadata
 */
export const createPaginationMetadata = (page, limit, total) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const pagination = {};

  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }

  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  pagination.total = total;
  pagination.pages = Math.ceil(total / limit);
  pagination.current = page;

  return pagination;
};

/**
 * Build a MongoDB query from request query parameters
 * @param {Object} reqQuery - Request query object
 * @param {string[]} removeFields - Fields to exclude from filtering
 * @returns {Object} - Formatted query object
 */
export const buildMongoQuery = (reqQuery, removeFields = ['select', 'sort', 'page', 'limit']) => {
  // Copy req.query
  const queryParams = { ...reqQuery };

  // Remove fields that are not for filtering
  removeFields.forEach(param => delete queryParams[param]);

  // Create query string with MongoDB operators
  let queryStr = JSON.stringify(queryParams);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  return JSON.parse(queryStr);
};

// Default export for ESM compatibility
export default {
  isValidObjectId,
  formatValidationErrors,
  handleApiError,
  createPaginationMetadata,
  buildMongoQuery
};