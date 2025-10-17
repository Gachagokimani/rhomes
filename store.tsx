
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserRole, User, Listing, PropertyType, RoomType, FurnishingLevel } from './types';

// Auth Context
interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isLandlord: boolean;
  isTenant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.TENANT);

  const login = useCallback((role: UserRole) => {
    const user: User = {
      id: 'user123',
      name: role === UserRole.LANDLORD ? 'Landlord Name' : 'Tenant Name',
      role: role,
      memberSince: new Date(),
      isVerified: true,
      bio: role === UserRole.TENANT ? 'Looking for a great room!' : 'Experienced and friendly landlord.',
      profilePictureUrl: role === UserRole.LANDLORD ? `https://picsum.photos/seed/landlord${Date.now()}/100/100` : `https://picsum.photos/seed/tenant${Date.now()}/100/100`,
    };
    setCurrentUser(user);
    setCurrentRole(role);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    // Default to tenant role on logout, or could be undefined
    setCurrentRole(UserRole.TENANT); 
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    if (currentUser) {
      setCurrentUser(prev => prev ? ({ ...prev, role }) : null);
    } else {
      // If no user, login with the new role (basic user)
      login(role);
    }
  }, [currentUser, login]);
  
  // Auto-login for demo purposes
  useEffect(() => {
    login(UserRole.TENANT);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const isLandlord = currentRole === UserRole.LANDLORD && !!currentUser;
  const isTenant = currentRole === UserRole.TENANT && !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, currentRole, login, logout, switchRole, isLandlord, isTenant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


// Listings Context (Mock Data)
interface ListingsContextType {
  listings: Listing[];
  getListingById: (id: string) => Listing | undefined;
  addListing: (listingData: Omit<Listing, 'id' | 'landlordId' | 'createdAt' | 'views'>) => Listing;
  isLoading: boolean;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

const initialListings: Listing[] = [
  {
    id: '1', landlordId: 'landlord1', title: 'Spacious Room in Sunny Apartment',
    description: 'A bright and airy double room available in a modern 2-bed apartment. Sharing with one friendly professional. Excellent transport links and local amenities.',
    propertyType: PropertyType.APARTMENT,
    address: { city: 'San Francisco', neighborhood: 'Mission District' },
    roomType: RoomType.DOUBLE, furnishingLevel: FurnishingLevel.FURNISHED,
    squareFootage: 150, photos: [`https://picsum.photos/seed/room1/600/400`, `https://picsum.photos/seed/room1_2/600/400`],
    monthlyRent: 1200, securityDeposit: 1000,
    billsIncluded: { wifi: true, electricity: false, water: true, gas: false, councilTax: true },
    leaseLengthMinMonths: 6, dateAvailable: new Date('2024-08-01'),
    houseRules: { smokingAllowed: false, petsConsidered: false, overnightGuestsPolicy: 'Allowed with notice' },
    aboutHousemates: 'Quiet and respectful professional in late 20s.',
    createdAt: new Date('2024-06-01'), views: 120
  },
  {
    id: '2', landlordId: 'landlord2', title: 'Cozy Single Room near University',
    description: 'Perfect for students! A comfortable single room in a shared house just a 10-minute walk from the main campus. All bills included.',
    propertyType: PropertyType.HOUSE,
    address: { city: 'Boston', neighborhood: 'Cambridge' },
    roomType: RoomType.SINGLE, furnishingLevel: FurnishingLevel.FURNISHED,
    photos: [`https://picsum.photos/seed/room2/600/400`], videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Example video
    monthlyRent: 800, securityDeposit: 800,
    billsIncluded: { wifi: true, electricity: true, water: true, gas: true, councilTax: true },
    leaseLengthMinMonths: 9, dateAvailable: new Date('2024-09-01'),
    houseRules: { smokingAllowed: false, petsConsidered: true, overnightGuestsPolicy: 'Discuss with housemates' },
    createdAt: new Date('2024-06-10'), views: 250
  },
   {
    id: '3', landlordId: 'landlord1', title: 'Modern En-suite Room with City Views',
    description: 'Stunning en-suite room in a new apartment building. Features floor-to-ceiling windows, access to gym and communal spaces.',
    propertyType: PropertyType.APARTMENT,
    address: { city: 'New York', neighborhood: 'Midtown' },
    roomType: RoomType.EN_SUITE, furnishingLevel: FurnishingLevel.PARTIALLY_FURNISHED,
    squareFootage: 200, photos: [`https://picsum.photos/seed/room3/600/400`, `https://picsum.photos/seed/room3_2/600/400`, `https://picsum.photos/seed/room3_3/600/400`],
    monthlyRent: 1800, securityDeposit: 1800,
    billsIncluded: { wifi: true, electricity: false, water: false, gas: false },
    leaseLengthMinMonths: 12, dateAvailable: new Date('2024-07-15'),
    houseRules: { smokingAllowed: false, petsConsidered: false, overnightGuestsPolicy: 'Not allowed' },
    aboutHousemates: 'Young professionals, respectful of space.',
    createdAt: new Date('2024-05-20'), views: 88
  },
];

export const ListingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { currentUser } = useAuth();

  const getListingById = useCallback((id: string): Listing | undefined => {
    return listings.find(listing => listing.id === id);
  }, [listings]);

  const addListing = useCallback((listingData: Omit<Listing, 'id' | 'landlordId' | 'createdAt' | 'views'>): Listing => {
    setIsLoading(true);
    const newListing: Listing = {
      ...listingData,
      id: String(Date.now()), // Simple ID generation
      landlordId: currentUser?.id || 'unknown_landlord',
      createdAt: new Date(),
      views: 0,
    };
    setListings(prevListings => [newListing, ...prevListings]);
    setIsLoading(false);
    return newListing;
  }, [currentUser]);

  return (
    <ListingsContext.Provider value={{ listings, getListingById, addListing, isLoading }}>
      {children}
    </ListingsContext.Provider>
  );
};

export const useListings = (): ListingsContextType => {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingsProvider');
  }
  return context;
};
