
export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
}

export interface User {
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

export interface Listing {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  address: { // Simplified, only city/general area shown publicly
    city: string;
    neighborhood?: string;
    // Full address kept private
  };
  roomType: RoomType;
  furnishingLevel: FurnishingLevel;
  squareFootage?: number;
  photos: string[]; // URLs to images
  videoUrl?: string; // YouTube/Vimeo link
  monthlyRent: number;
  securityDeposit: number;
  billsIncluded: BillInclusion;
  leaseLengthMinMonths?: number;
  leaseLengthMaxMonths?: number;
  dateAvailable: Date;
  houseRules: HouseRules;
  aboutHousemates?: string;
  createdAt: Date;
  views?: number; // For stats
}

export const APP_NAME = "Rhomes";

export const DEFAULT_PROFILE_PIC_LANDLORD = "https://picsum.photos/seed/landlord/200";
export const DEFAULT_PROFILE_PIC_TENANT = "https://picsum.photos/seed/tenant/200";
