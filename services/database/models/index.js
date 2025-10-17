import Listing from './Listing.js';
import User from './User.js';

// NOTE: Mongoose uses schema middleware for hooks, not static model methods.
// All pre-save/update logic should be defined in the respective schema files (User.js, Listing.js).

// Named exports
export { User, Listing };

// Default export for ESM compatibility
export default {
  User,
  Listing
};