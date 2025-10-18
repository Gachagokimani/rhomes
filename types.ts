export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
}

export interface User {
  phone?: string; 
  ocupation?: string;
  isRegisterMode?: boolean;
  iscurrentUser?: boolean;
  hasCompletedProfile: boolean;
  isActive: boolean | null | undefined;
  id: string;
  name: string;
  email?: string; // Optional as it's private
  role: UserRole;
  profilePictureUrl?: string;
  bio?: string;
  occupation?: string;
  desiredLocation?: string;
  idealMoveInDate?: Date;
  memberSince: Date;
  isVerified?: boolean;
}

export enum PropertyType {
  APARTMENT = 'Apartment',
  HOUSE = 'House',
  TOWNHOUSE = 'Townhouse',
  CONDO = 'Condo',
  STUDIO = 'Studio',
}

export enum RoomType {
  SINGLE = 'Single',
  DOUBLE = 'Double',
  EN_SUITE = 'En-suite',
}

export enum FurnishingLevel {
  FURNISHED = 'Furnished',
  UNFURNISHED = 'Unfurnished',
  PARTIALLY_FURNISHED = 'Partially Furnished',
}

export interface BillInclusion {
  wifi: boolean;
  electricity: boolean;
  water: boolean;
  gas: boolean;
  councilTax?: boolean;
}

export interface HouseRules {
  smokingAllowed: boolean;
  petsConsidered: boolean;
  overnightGuestsPolicy: string; // e.g., "Allowed with notice", "Not allowed"
}
export interface newListingData{
  
}
export interface Listing {
    parties?: boolean;
  guests?: boolean;  
  pets?: boolean;
  smoking?: boolean;
  contact: {
    name: string;
    email?: string; // Optional as it's private
    phone?: string; // Optional contact phone number
  };
  status: string;
  rating?: number; // Average rating from tenants
  reviews?: number; // Number of reviews
  price: number;
  squareFootage?: number;
  overnightGuests: string; // e.g., "Allowed with notice", "Not allowed"
  petsAllowed: boolean;
  createdAt: Date;
  views: number;
  title: string;
  description: string;
  propertyType: PropertyType;
  photos: string[]; // URLs to photos
    details: { 
      availableFrom: Date;
    bedrooms: number;
    bathrooms: number;
    squareFootage?: number;
    floorLevel?: number;
    totalFloors?: number;
    parkingAvailable?: boolean;
    petFriendly?: boolean;
    furnished?: boolean;
    area: number;
    minimumLease: number;
    deposit: number;
  };
  address: {
    city: string;
    neighborhood?: string;
    priceRange?: string;
  };
  utilities: {
    internet: boolean;
    electricity: boolean;
    water: boolean;
    gas: boolean;
    councilTax?: boolean;
  };
  rules: {
    parties: boolean;
    guests: boolean;  
    pets: boolean;
    smoking: boolean;
    overnightGuests: string; // e.g., "Allowed with notice", "Not allowed"
    petsAllowed: boolean;
      smokingAllowed: boolean;
      petsConsidered: boolean;
      overnightGuestsPolicy: string; // e.g., "Allowed with notice", "Not allowed"
    };
  utilitiesIncluded: {
    electricity: boolean;
    gas: boolean;
    councilTax?: boolean;
    wifiIncluded: boolean;
    electricityIncluded: boolean;
    water: boolean;
    gasIncluded: boolean;
    councilTaxIncluded?: boolean;
  };
  roomType: RoomType;
  furnishingLevel: FurnishingLevel;
  monthlyRent: number;
  securityDeposit: number;
  billsIncluded: BillInclusion;
  leaseLengthMinMonths?: number;
  leaseLengthMaxMonths?: number;
  dateAvailable: Date;
  houseRules: HouseRules;
  aboutHousemates?: string;
  id: string;
  landlordId: string;
  location: string;
  amenities: string[]; // e.g., ["WiFi", "Parking", "Washer/Dryer"]
  images: string[]; // URLs to images
city: string;
    neighborhood?: string;
    priceRange?: string;
    // Full address kept private
  };
export const APP_NAME = "Rhomes";

export const DEFAULT_PROFILE_PIC_LANDLORD = "https://picsum.photos/seed/landlord/200";
export const DEFAULT_PROFILE_PIC_TENANT = "https://picsum.photos/seed/tenant/200";
