import logger from '../../backend/logger.js';
import User from '../models/User.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    logger.error(`Error getting users: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin or Owner
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error(`Error getting user: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Public
export const createUser = async (req, res) => {
  try {
    // Check if user with email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }
    
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages });
    }
    
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Owner or Admin
export const updateUser = async (req, res) => {
  try {
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages });
    }
    
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin or Owner
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get user's listings
// @route   GET /api/users/:id/listings
// @access  Public
export const getUserListings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('listings');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({ success: true, count: user.listings.length, data: user.listings });
  } catch (error) {
    logger.error(`Error getting user listings: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserListings
};