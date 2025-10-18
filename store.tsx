// store.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserRole, User, Listing } from './types';

// Initial mock listings data
const initialListings: Listing[] = [
  {
    id: '1',
    title: 'Cozy Apartment in the City',
    description: 'A cozy apartment located in the heart of the city.',
    price: 1200,
    location: 'New York, NY',
    images: ['https://picsum.photos/seed/1/800/600'],
    amenities: ['WiFi', 'Air Conditioning', 'Heating'],
    landlordId: 'landlord123',
    createdAt: new Date(),
    views: 0,
    details: {
      bedrooms: 1,
      bathrooms: 1,
      area: 500,
      availableFrom: new Date('2024-01-01'),
      minimumLease: 12,
      deposit: 1200,
    },
    utilities: {
      water: true,
      electricity: true,
      gas: true,
      internet: true,
    },
    rules: {
      pets: true,
      smoking: false,
      parties: false,
      guests: true,
    },
    contact: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
    },
    status: 'available',
    rating: 4.5,
    reviews: 10,
  },
  {
    id: '2',
    title: 'Modern Studio near Downtown',
    description: 'A modern studio apartment with great views.',
    price: 1500,
    location: 'San Francisco, CA',
    images: ['https://picsum.photos/seed/2/800/600'],
    amenities: ['WiFi', 'Air Conditioning', 'Heating', 'Gym'],
    landlordId: 'landlord456',
    createdAt: new Date(),
    views: 0,
    details: {
      bedrooms: 0,
      bathrooms: 1,
      area: 400,
      availableFrom: new Date('2024-02-01'),
      minimumLease: 6,
      deposit: 1500,
    },
    utilities: {
      water: true,
      electricity: true,
      gas: true,
      internet: true,
    },
    rules: {
      pets: false,
      smoking: false,
      parties: false,
      guests: true,
    },
    contact: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+0987654321',
    },
    status: 'available',
    rating: 4.8,
    reviews: 5,
  },
];

// Auth Context - UPDATED: Frontend-only authentication
interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isLandlord: boolean;
  isTenant: boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  bio?: string;
}

// Mock user database in localStorage
const MOCK_USERS_KEY = 'rhomes_mock_users';

const getMockUsers = (): User[] => {
  try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveMockUsers = (users: User[]) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.TENANT);
  const [loading, setLoading] = useState<boolean>(false);

  // Check for existing session on app start
  useEffect(() => {
    const checkExistingAuth = async () => {
      const userData = localStorage.getItem('user_data');
      
      if (userData) {
        try {
          setLoading(true);
          const user = JSON.parse(userData);
          setCurrentUser(user);
          setCurrentRole(user.role);
          console.log('✅ Restored user session:', user.email);
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('user_data');
        } finally {
          setLoading(false);
        }
      }
    };

    checkExistingAuth();
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Check if user already exists
      const existingUsers = getMockUsers();
      const userExists = existingUsers.some(user => user.email === userData.email);
      
      if (userExists) {
        alert('User with this email already exists. Please login instead.');
        return false;
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        memberSince: new Date(),
        isVerified: true, // Auto-verify in demo mode
        isActive: true,
        bio: userData.bio || '',
        phone: userData.phone,
        profilePictureUrl: `https://picsum.photos/seed/${userData.email}/100/100`,
      };

      // Save to mock database
      existingUsers.push(newUser);
      saveMockUsers(existingUsers);

      // Auto-login after registration
      setCurrentUser(newUser);
      setCurrentRole(userData.role);
      localStorage.setItem('user_data', JSON.stringify(newUser));
      
      console.log('✅ User registered and logged in:', newUser.email);
      return true;
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // In demo mode, we'll create a user if they don't exist
      const existingUsers = getMockUsers();
      let user = existingUsers.find(u => u.email === email);

      if (!user) {
        // Auto-create user for demo purposes
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: email,
          name: email.split('@')[0],
          role: UserRole.TENANT, // Default to tenant
          memberSince: new Date(),
          isVerified: true,
          isActive: true,
          bio: 'Demo user account',
          phone: '+1234567890',
          profilePictureUrl: `https://picsum.photos/seed/${email}/100/100`,
        };

        existingUsers.push(newUser);
        saveMockUsers(existingUsers);
        user = newUser;
        
        console.log('🔧 Auto-created demo user:', email);
      }

      // In real app, you'd verify password here
      // For demo, we accept any password
      
      setCurrentUser(user);
      setCurrentRole(user.role);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      console.log('✅ User logged in:', user.email);
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentRole(UserRole.TENANT);
    localStorage.removeItem('user_data');
    console.log('👋 User logged out');
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      setCurrentUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  }, [currentUser]);

  const isLandlord = currentRole === UserRole.LANDLORD && !!currentUser;
  const isTenant = currentRole === UserRole.TENANT && !!currentUser;
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      currentRole, 
      login, 
      register,
      logout, 
      switchRole, 
      isLandlord, 
      isTenant, 
      isAuthenticated,
      loading
    }}>
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

// Listings Context with API Integration
interface ListingsContextType {
  listings: Listing[];
  getListingById: (id: string) => Listing | undefined;
  addListing: (listingData: Omit<Listing, 'id' | 'landlordId' | 'createdAt' | 'views'>) => Promise<Listing>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  fetchListings: () => Promise<void>;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export const ListingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Fetch listings from API with fallback to initialListings
  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // For now, use initial listings
      setListings(initialListings);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch listings:', err);
      // On error, use initialListings as fallback
      setListings(initialListings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const getListingById = useCallback((id: string): Listing | undefined => {
    return listings.find(listing => listing.id === id);
  }, [listings]);

  const addListing = useCallback(async (listingData: Omit<Listing, 'id' | 'landlordId' | 'createdAt' | 'views'>): Promise<Listing> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!currentUser) {
        throw new Error('You must be logged in to create a listing');
      }

      // Create mock listing
      const newListing: Listing = {
        ...listingData,
        id: `listing-${Date.now()}`,
        landlordId: currentUser.id,
        createdAt: new Date(),
        views: 0
      };
      
      setListings(prev => [newListing, ...prev]);
      return newListing;
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to create listing:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      setListings(prev => prev.map(listing => 
        listing.id === id ? { ...listing, ...updates } : listing
      ));
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to update listing:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteListing = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      setListings(prev => prev.filter(listing => listing.id !== id));
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to delete listing:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <ListingsContext.Provider value={{ 
      listings, 
      getListingById, 
      addListing, 
      updateListing,
      deleteListing,
      isLoading, 
      error,
      fetchListings
    }}>
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