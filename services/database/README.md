# Rhomes Database Module

This module provides a comprehensive MongoDB database integration for the Rhomes application.

## Structure

```
services/database/
├── config/           # Database configuration
│   └── db.js         # MongoDB connection setup
├── models/           # MongoDB models
│   ├── User.js       # User model
│   ├── Listing.js    # Listing model
│   └── index.js      # Models export
├── controllers/      # API controllers
│   ├── userController.js    # User CRUD operations
│   ├── listingController.js # Listing CRUD operations
│   └── index.js             # Controllers export
├── utils/            # Utility functions
│   └── dbUtils.js    # Database helper functions
└── index.js          # Main module export
```

## Usage

### Connecting to MongoDB

```javascript
const { connectDB } = require('./services/database');

// Connect to MongoDB
const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected');
    // Start your server or application
  } catch (error) {
    console.error('MongoDB connection failed:', error);
  }
};

startServer();
```

### Using Models

```javascript
const { models } = require('./services/database');

// Create a new user
const createUser = async (userData) => {
  try {
    const user = await models.User.create(userData);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Find listings by city
const getListingsByCity = async (city) => {
  try {
    const listings = await models.Listing.find({
      'address.city': { $regex: city, $options: 'i' }
    });
    return listings;
  } catch (error) {
    console.error('Error finding listings:', error);
    throw error;
  }
};
```

### Using Controllers

The controllers are designed to be used with Express.js routes:

```javascript
const express = require('express');
const { controllers } = require('./services/database');

const router = express.Router();

// User routes
router.get('/api/users', controllers.userController.getUsers);
router.get('/api/users/:id', controllers.userController.getUser);
router.post('/api/users', controllers.userController.createUser);
router.put('/api/users/:id', controllers.userController.updateUser);
router.delete('/api/users/:id', controllers.userController.deleteUser);

// Listing routes
router.get('/api/listings', controllers.listingController.getListings);
router.get('/api/listings/:id', controllers.listingController.getListing);
router.post('/api/listings', controllers.listingController.createListing);
router.put('/api/listings/:id', controllers.listingController.updateListing);
router.delete('/api/listings/:id', controllers.listingController.deleteListing);

module.exports = router;
```

### Using Utility Functions

```javascript
const { dbUtils } = require('./services/database');

// Check if an ID is a valid MongoDB ObjectId
const isValid = dbUtils.isValidObjectId('60d21b4667d0d8992e610c85');

// Handle API errors
app.use((err, req, res, next) => {
  dbUtils.handleApiError(err, res);
});

// Create pagination metadata
const pagination = dbUtils.createPaginationMetadata(2, 10, 100);
```

## Models

### User Model

The User model represents users in the system with the following fields:

- `name`: User's full name
- `email`: User's email address (unique)
- `password`: User's password (hashed)
- `role`: User's role (TENANT or LANDLORD)
- `profilePictureUrl`: URL to user's profile picture
- `bio`: User's biography or description
- `occupation`: User's occupation (for tenants)
- `desiredLocation`: Preferred location (for tenants)
- `idealMoveInDate`: When the user wants to move in (for tenants)
- `memberSince`: When the user joined
- `isVerified`: Whether the user's identity has been verified

### Listing Model

The Listing model represents property listings with the following fields:

- `landlordId`: Reference to the User who created the listing
- `title`: Listing title
- `description`: Detailed description
- `propertyType`: Type of property (Apartment, House, etc.)
- `address`: Property address (city, neighborhood, etc.)
- `roomType`: Type of room (Single, Double, En-suite)
- `furnishingLevel`: Level of furnishing
- `squareFootage`: Size of the room/property
- `photos`: Array of photo URLs
- `videoUrl`: URL to video tour
- `monthlyRent`: Monthly rent amount
- `securityDeposit`: Security deposit amount
- `billsIncluded`: Which bills are included in the rent
- `leaseLengthMinMonths`: Minimum lease length
- `leaseLengthMaxMonths`: Maximum lease length
- `dateAvailable`: When the property is available
- `houseRules`: Rules for the property
- `aboutHousemates`: Description of current housemates
- `views`: Number of times the listing has been viewed
- `isActive`: Whether the listing is active
