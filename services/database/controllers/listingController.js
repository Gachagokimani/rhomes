import logger from '../../backend/logger.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
// @desc    Get all listings
// @route   GET /api/listings
// @access  Public
// Improved getListing to avoid logging handled exceptions
export const getListings = async (req, res) => {
  try {
    // Build query
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Remove fields from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Listing.find(JSON.parse(queryStr)).populate({
      path: 'landlordId',
      select: 'name profilePictureUrl isVerified'
    });

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Listing.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const listings = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: listings.length,
      pagination,
      data: listings
    });
  } catch (error) {
    logger.error(`Error getting listings: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
export const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate({
      path: 'landlordId',
      select: 'name profilePictureUrl isVerified'
    });
    
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    
    // Increment view count
    await listing.incrementViews();
    
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    logger.error(`Error getting listing: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new listing
// @route   POST /api/listings
// @access  Private/Landlord
export const createListing = async (req, res) => {
  try {
    // Add user to req.body
    req.body.landlordId = req.user.id;
    
    // Check if user is a landlord
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'LANDLORD') {
      return res.status(403).json({
        success: false,
        error: 'Only landlords can create listings'
      });
    }
    
    const listing = await Listing.create(req.body);
    
    res.status(201).json({
      success: true,
      data: listing
    });
  } catch (error) {
    logger.error(`Error creating listing: ${error.message}`);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages });
    }
    
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private/Landlord
export const updateListing = async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    
    // Make sure user is listing owner
    if (listing.landlordId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'User not authorized to update this listing'
      });
    }
    
    listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    logger.error(`Error updating listing: ${error.message}`);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages });
    }
    
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private/Landlord
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    
    // Make sure user is listing owner
    if (listing.landlordId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'User not authorized to delete this listing'
      });
    }
    
    await listing.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    logger.error(`Error deleting listing: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get listings by city
// @route   GET /api/listings/city/:city
// @access  Public
export const getListingsByCity = async (req, res) => {
  try {
    const city = req.params.city;
    
    const listings = await Listing.find({
      'address.city': { $regex: city, $options: 'i' }
    }).populate({
      path: 'landlordId',
      select: 'name profilePictureUrl isVerified'
    });
    
    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    logger.error(`Error getting listings by city: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get listings by price range
// @route   GET /api/listings/price/:min/:max
// @access  Public
export const getListingsByPriceRange = async (req, res) => {
  try {
    const min = parseInt(req.params.min);
    const max = parseInt(req.params.max);
    
    if (isNaN(min) || isNaN(max)) {
      return res.status(400).json({
        success: false,
        error: 'Min and max prices must be numbers'
      });
    }
    
    const listings = await Listing.find({
      monthlyRent: { $gte: min, $lte: max }
    }).populate({
      path: 'landlordId',
      select: 'name profilePictureUrl isVerified'
    });
    
    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    logger.error(`Error getting listings by price range: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const isListing = (obj) => obj && obj._id && obj.address && obj.monthlyRent;


export default {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getListingsByCity,
  getListingsByPriceRange,
  isListing
};