import mongoose from 'mongoose';

const Schema = mongoose.Schema;

// Define the Address schema (embedded in Listing)
const AddressSchema = new Schema({
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  neighborhood: {
    type: String,
    trim: true
  },
  // Full address details (private)
  street: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    default: 'Kenya',
    trim: true
  }
});

// Define the BillInclusion schema (embedded in Listing)
const BillInclusionSchema = new Schema({
  wifi: { type: Boolean, default: false },
  electricity: { type: Boolean, default: false },
  water: { type: Boolean, default: false },
  gas: { type: Boolean, default: false },
  councilTax: { type: Boolean, default: false }
});

// Define the HouseRules schema (embedded in Listing)
const HouseRulesSchema = new Schema({
  smokingAllowed: { type: Boolean, default: false },
  petsConsidered: { type: Boolean, default: false },
  overnightGuestsPolicy: {
    type: String,
    default: 'Negotiable',
    trim: true
  }
});

// Define the Listing schema
const ListingSchema = new Schema({
  landlordId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Landlord ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  propertyType: {
    type: String,
    enum: ['Apartment', 'House', 'Townhouse', 'Condo', 'Studio'],
    required: [true, 'Property type is required']
  },
  address: {
    type: AddressSchema,
    required: [true, 'Address is required']
  },
  roomType: {
    type: String,
    enum: ['Single', 'Double', 'En-suite'],
    required: [true, 'Room type is required']
  },
  furnishingLevel: {
    type: String,
    enum: ['Furnished', 'Unfurnished', 'Partially Furnished'],
    required: [true, 'Furnishing level is required']
  },
  squareFootage: {
    type: Number,
    min: [0, 'Square footage cannot be negative']
  },
  photos: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one photo is required'
    }
  },
  videoUrl: {
    type: String,
    trim: true
  },
  monthlyRent: {
    type: Number,
    required: [true, 'Monthly rent is required'],
    min: [0, 'Monthly rent cannot be negative']
  },
  securityDeposit: {
    type: Number,
    required: [true, 'Security deposit is required'],
    min: [0, 'Security deposit cannot be negative']
  },
  billsIncluded: {
    type: BillInclusionSchema,
    default: () => ({})
  },
  leaseLengthMinMonths: {
    type: Number,
    min: [0, 'Minimum lease length cannot be negative']
  },
  leaseLengthMaxMonths: {
    type: Number,
    min: [0, 'Maximum lease length cannot be negative']
  },
  dateAvailable: {
    type: Date,
    required: [true, 'Date available is required']
  },
  houseRules: {
    type: HouseRulesSchema,
    default: () => ({})
  },
  aboutHousemates: {
    type: String,
    trim: true
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better search performance
ListingSchema.index({ 'address.city': 1 });
ListingSchema.index({ 'address.neighborhood': 1 });
ListingSchema.index({ monthlyRent: 1 });
ListingSchema.index({ dateAvailable: 1 });
ListingSchema.index({ propertyType: 1 });
ListingSchema.index({ roomType: 1 });
ListingSchema.index({ furnishingLevel: 1 });
ListingSchema.index({ isActive: 1 });

// Method to increment view count
ListingSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

// Pre-save hook for status and updatedAt
ListingSchema.pre('save', function (next) {
  if (!this.status) {
    this.status = 'pending';
  }
  this.updatedAt = new Date();
  next();
});

// Create the Listing model
const Listing = mongoose.model('Listing', ListingSchema);

// Function to create and save a new listing
export async function createListing(listingData) {
  const listing = new Listing(listingData);
  return await listing.save();
}

export default Listing;