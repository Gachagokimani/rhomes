import React, { ReactNode, useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { APP_NAME, Listing, UserRole } from './types';
import { useAuth } from './store';
import apiService, { WebhookEvent } from './API/api.ts';

// =============================================
// ICON COMPONENTS (unchanged)
// =============================================

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const HeartIcon: React.FC<{ className?: string; filled?: boolean }> = ({ className, filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" 
       fill={filled ? "currentColor" : "none"} 
       viewBox="0 0 24 24" 
       strokeWidth={1.5} 
       stroke="currentColor" 
       className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" 
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

// =============================================
// LAYOUT COMPONENTS (unchanged)
// =============================================

export const Navbar: React.FC = () => {
  const { currentUser, currentRole, switchRole, logout, login } = useAuth();
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [apiTestDetails, setApiTestDetails] = useState<string>('');

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(event.target.value as UserRole);
  };

  const testApiConnection = async () => {
    setApiStatus('testing');
    setApiTestDetails('Testing API connectivity...');
    
    try {
      const results = await apiService.testAllConnections();
      
      if (results.error) {
        setApiStatus('error');
        setApiTestDetails(`API Error: ${results.error}`);
      } else {
        setApiStatus('success');
        
        // Build detailed status message
        const details = [];
        if (results.health) details.push('Health: ✅');
        if (results.users) details.push('Users: ✅');
        if (results.health?.redis === 'Connected') details.push('Redis: ✅');
        if (results.health?.database === 'Connected') details.push('DB: ✅');
        
        setApiTestDetails(details.join(' | ') || 'All endpoints responding');
      }
    } catch (error: any) {
      setApiStatus('error');
      setApiTestDetails(`Connection failed: ${error.message}`);
    }
    
    setTimeout(() => {
      setApiStatus('idle');
      setApiTestDetails('');
    }, 5000);
  };

  // Listen for login events
  useEffect(() => {
    if (webhookEnabled) {
      const handleLogin = (data: any) => {
        console.log('User logged in via webhook:', data);
      };

      apiService.on('user.logged_in', handleLogin);
      return () => apiService.off('user.logged_in', handleLogin);
    }
  }, [webhookEnabled]);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold text-purple-600">{APP_NAME}</Link>
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <button 
                  onClick={testApiConnection}
                  disabled={apiStatus === 'testing'}
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1"
                >
                  {apiStatus === 'testing' ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                      <span>Testing...</span>
                    </>
                  ) : apiStatus === 'success' ? (
                    <span className="text-green-600">✅ API OK</span>
                  ) : apiStatus === 'error' ? (
                    <span className="text-red-600">❌ API Error</span>
                  ) : (
                    <span>Test API</span>
                  )}
                </button>
                
                {/* Tooltip with detailed status */}
                {apiTestDetails && (
                  <div className="absolute bottom-full mb-2 left-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
                    {apiTestDetails}
                    <div className="absolute top-full left-2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
              
              <label className="flex items-center text-xs text-gray-600">
                <input 
                  type="checkbox" 
                  checked={webhookEnabled}
                  onChange={(e) => setWebhookEnabled(e.target.checked)}
                  className="mr-1"
                />
                Webhooks
              </label>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <NavLink 
              to="/" 
              className={({isActive}) => 
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'text-purple-600 bg-purple-100 border-b-2 border-purple-600' 
                    : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                }`
              }
            >
              <HomeIcon className="w-5 h-5 mr-1" /> 
              Home
            </NavLink>
            
            <NavLink 
              to="/listings" 
              className={({isActive}) => 
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'text-purple-600 bg-purple-100 border-b-2 border-purple-600' 
                    : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                }`
              }
            >
              <SearchIcon className="w-5 h-5 mr-1" /> 
              Find a Room
            </NavLink>
            
            {currentRole === UserRole.LANDLORD && currentUser && (
              <NavLink 
                to="/create-listing" 
                className={({isActive}) => 
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-purple-600 bg-purple-100 border-b-2 border-purple-600' 
                      : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                  }`
                }
              >
                <PlusCircleIcon className="w-5 h-5 mr-1" /> 
                List a Room
              </NavLink>
            )}
            
            {currentUser && (
              <NavLink 
                to="/profile" 
                className={({isActive}) => 
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-purple-600 bg-purple-100 border-b-2 border-purple-600' 
                      : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                  }`
                }
              >
                <UserCircleIcon className="w-5 h-5 mr-1" /> 
                Profile
              </NavLink>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <select 
                value={currentRole} 
                onChange={handleRoleChange}
                className="pl-3 pr-8 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                <option value={UserRole.TENANT}>I'm a Tenant</option>
                <option value={UserRole.LANDLORD}>I'm a Landlord</option>
              </select>
              <ChevronDownIcon className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            
            {currentUser ? (
              <Button 
                onClick={logout} 
                variant="secondary" 
                size="sm"
                className="hover:shadow-sm transition-all"
              >
                Logout
              </Button>
            ) : (
              <Button 
                onClick={() => login(currentRole)} 
                variant="primary" 
                size="sm"
                className="hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export const Footer: React.FC = () => (
  <footer className="bg-gray-800 text-white py-8 mt-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-lg font-semibold">&copy; {new Date().getFullYear()} {APP_NAME}</p>
        <p className="text-sm text-gray-400 mt-2">Your premier destination for room rentals.</p>
        <div className="mt-4 flex justify-center space-x-6 text-xs text-gray-400">
          <span>🏠 Find Your Perfect Room</span>
          <span>🔐 Secure & Verified</span>
          <span>⚡ Instant Contact</span>
        </div>
      </div>
    </div>
  </footer>
);

export const PageContainer: React.FC<{ children: ReactNode, title?: string, description?: string }> = ({ 
  children, 
  title, 
  description 
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {(title || description) && (
        <div className="mb-8">
          {title && <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>}
          {description && <p className="text-gray-600 text-lg">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

// =============================================
// DATA COMPONENTS
// =============================================

interface ListingCardProps {
  listing: Listing;
  onSave?: (listingId: string) => void;
  onContact?: (listingId: string) => void;
  featured?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  onSave, 
  onContact,
  featured = false 
}) => {
  const { currentUser } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please login to save favorites');
      return;
    }

    setIsSaving(true);
    try {
      if (isFavorite) {
        await apiService.removeFavorite(listing.id, currentUser.id);
        setIsFavorite(false);
        if (onSave) onSave(listing.id);
      } else {
        await apiService.addFavorite(listing.id, currentUser.id);
        setIsFavorite(true);
        if (onSave) onSave(listing.id);
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContact = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onContact) {
      onContact(listing.id);
    } else {
      apiService.sendContactRequest(listing.id, 'I am interested in this property', {
        name: currentUser?.name || 'Anonymous',
        email: currentUser?.email
      });
    }
  };

  // Listen for favorite events for this specific listing
  useEffect(() => {
    const handleFavoriteAdded = (data: any) => {
      if (data.listingId === listing.id) {
        setIsFavorite(true);
      }
    };

    const handleFavoriteRemoved = (data: any) => {
      if (data.listingId === listing.id) {
        setIsFavorite(false);
      }
    };

    apiService.on('favorite.added', handleFavoriteAdded);
    apiService.on('favorite.removed', handleFavoriteRemoved);

    return () => {
      apiService.off('favorite.added', handleFavoriteAdded);
      apiService.off('favorite.removed', handleFavoriteRemoved);
    };
  }, [listing.id]);

  const imageUrl = listing.photos[0] || 'https://picsum.photos/600/400';
  const fallbackImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80';

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
      featured ? 'ring-2 ring-purple-500' : ''
    }`}>
      <Link to={`/listings/${listing.id}`} className="block">
        <div className="relative">
          <img 
            className="w-full h-56 object-cover"
            src={imageError ? fallbackImage : imageUrl}
            alt={listing.title}
            onError={() => setImageError(true)}
          />
          
          {/* Favorite button */}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
              isFavorite 
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg' 
                : 'bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white shadow-md'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
          >
            <HeartIcon className="w-5 h-5" filled={isFavorite} />
          </button>

          {/* Featured badge */}
          {featured && (
            <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              Featured
            </div>
          )}

          {/* Price badge */}
          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm font-semibold px-3 py-1 rounded-full">
            ${listing.monthlyRent}/mo
          </div>
        </div>
        
        <div className="p-5">
          <h3 className="text-xl font-semibold text-gray-900 truncate mb-1 hover:text-purple-600 transition-colors">
            {listing.title}
          </h3>
          
          <p className="text-sm text-gray-500 flex items-center mb-2">
            <MapPinIcon className="w-4 h-4 mr-1 text-purple-500" />
            {listing.address.neighborhood ? `${listing.address.neighborhood}, ` : ''}{listing.address.city}
          </p>

          <div className="flex justify-between items-center text-xs text-gray-600 mb-4">
            <span className="bg-gray-100 px-2 py-1 rounded">{listing.roomType}</span>
            <span className="bg-gray-100 px-2 py-1 rounded">{listing.furnishingLevel}</span>
            <span className="bg-gray-100 px-2 py-1 rounded">
              Avail. {new Date(listing.dateAvailable).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <Button 
            onClick={handleContact}
            variant="primary" 
            size="sm" 
            className="w-full hover:shadow-md transition-all"
          >
            Contact Owner
          </Button>
        </div>
      </Link>
    </div>
  );
};

export const ListingGrid: React.FC<{ featured?: boolean }> = ({ featured = false }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for listing updates via webhooks
  useEffect(() => {
    const handleListingCreated = (data: unknown) => {
      if (isListing(data)) {
        setListings(prev => [data, ...prev]);
      }
    };

    const handleListingUpdated = (data: unknown) => {
      if (isListingUpdateData(data)) {
        setListings(prev => prev.map(listing => 
          listing.id === data.listingId ? { ...listing, ...data.updates } : listing
        ));
      }
    };

    const handleListingDeleted = (data: unknown) => {
      if (isListingDeleteData(data)) {
        setListings(prev => prev.filter(listing => listing.id !== data.listingId));
      }
    };

    apiService.on('listing.created', handleListingCreated);
    apiService.on('listing.updated', handleListingUpdated);
    apiService.on('listing.deleted', handleListingDeleted);

    return () => {
      apiService.off('listing.created', handleListingCreated);
      apiService.off('listing.updated', handleListingUpdated);
      apiService.off('listing.deleted', handleListingDeleted);
    };
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        // FIXED: Properly type the API response
        const listingsData = await apiService.getListings() as Listing[];
        setListings(listingsData);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to fetch listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [featured]);

  // FIXED: Use useMemo to derive filtered listings
  const filteredListings = React.useMemo(() => {
    return featured ? listings.slice(0, 3) : listings;
  }, [listings, featured]);

  const handleSaveListing = (listingId: string) => {
    console.log(`Listing ${listingId} saved to favorites`);
  };

  const handleContactListing = (listingId: string) => {
    console.log(`Contact requested for listing ${listingId}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
            <div className="h-56 bg-gray-300"></div>
            <div className="p-5">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded mb-4"></div>
              <div className="flex space-x-2 mb-4">
                <div className="h-6 bg-gray-300 rounded flex-1"></div>
                <div className="h-6 bg-gray-300 rounded flex-1"></div>
                <div className="h-6 bg-gray-300 rounded flex-1"></div>
              </div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert 
        message={`Error loading listings: ${error}`} 
        type="error" 
        onClose={() => setError(null)}
      />
    );
  }

  if (filteredListings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No listings found</h3>
        <p className="text-gray-500">Check back later for new room listings in your area.</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${featured ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {filteredListings.map((listing, index) => (
        <ListingCard 
          key={listing.id} 
          listing={listing}
          featured={featured && index === 0}
          onSave={handleSaveListing}
          onContact={handleContactListing}
        />
      ))}
    </div>
  );
};

// Type guards for webhook data
const isListing = (data: unknown): data is Listing => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    'monthlyRent' in data
  );
};

const isListingUpdateData = (data: unknown): data is { listingId: string; updates: Partial<Listing> } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'listingId' in data &&
    'updates' in data
  );
};

const isListingDeleteData = (data: unknown): data is { listingId: string } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'listingId' in data
  );
};

// =============================================
// FORM COMPONENTS (unchanged)
// =============================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  className, 
  disabled,
  ...props 
}) => {
  const baseStyles = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out";
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variantStyles = {
    primary: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 disabled:bg-purple-400",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400",
    outline: "bg-transparent text-purple-600 border border-purple-600 hover:bg-purple-50 focus:ring-purple-500 disabled:opacity-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400 disabled:opacity-50"
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className} ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, error, helperText, className, ...props }) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors ${
        error 
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
          : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
      } ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, helperText, className, ...props }) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <textarea
      id={id}
      rows={4}
      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors ${
        error 
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
          : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
      } ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, id, error, helperText, options, className, ...props }) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <select
      id={id}
      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 transition-colors ${
        error 
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
          : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
      } ${className}`}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
  </div>
);

// =============================================
// FEEDBACK COMPONENTS (unchanged)
// =============================================

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({ 
  size = 'md', 
  text = 'Loading...' 
}) => {
  const sizeStyles = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className={`animate-spin rounded-full border-t-4 border-b-4 border-purple-600 ${sizeStyles[size]}`}></div>
      {text && <p className="text-gray-600">{text}</p>}
    </div>
  );
};

interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Alert: React.FC<AlertProps> = ({ message, type = 'info', onClose, action }) => {
  const baseClasses = "p-4 mb-4 text-sm rounded-lg relative flex items-center justify-between";
  const typeClasses = {
    success: "bg-green-100 text-green-700 border border-green-200",
    error: "bg-red-100 text-red-700 border border-red-200",
    info: "bg-blue-100 text-blue-700 border border-blue-200",
    warning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  };

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️"
  };

  if (!message) return null;

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      <div className="flex items-center">
        <span className="mr-2">{icons[type]}</span>
        <span>{message}</span>
      </div>
      
      <div className="flex items-center space-x-2">
        {action && (
          <button
            type="button"
            className="font-medium hover:underline"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
        
        {onClose && (
          <button 
            type="button" 
            className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================
// WEBHOOK COMPONENTS (unchanged)
// =============================================

export const WebhookManager: React.FC = () => {
  const [webhookLogs, setWebhookLogs] = useState<{event: WebhookEvent, data: any, timestamp: Date}[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const events: WebhookEvent[] = [
      'user.registered', 'user.logged_in', 'listing.created', 
      'listing.updated', 'listing.deleted', 'otp.requested',
      'otp.verified', 'favorite.added', 'favorite.removed', 'contact.requested'
    ];

    const listeners = events.map(event => {
      const listener = (data: any) => {
        setWebhookLogs(prev => [...prev, { event, data, timestamp: new Date() }].slice(-20));
        console.log(`📢 Webhook: ${event}`, data);
      };
      apiService.on(event, listener);
      return { event, listener };
    });

    return () => {
      listeners.forEach(({ event, listener }) => {
        apiService.off(event, listener);
      });
    };
  }, []);

  const clearLogs = () => setWebhookLogs([]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-purple-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-purple-700 transition-colors">
        <button 
          onClick={() => setIsMinimized(false)}
          className="p-3 flex items-center space-x-2"
        >
          <span className="text-sm font-semibold">Webhooks</span>
          <span className="bg-white text-purple-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {webhookLogs.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden">
      <div className="bg-purple-600 text-white p-3 flex justify-between items-center">
        <h3 className="font-semibold flex items-center space-x-2">
          <span>Webhook Events</span>
          <span className="bg-white text-purple-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {webhookLogs.length}
          </span>
        </h3>
        <div className="flex items-center space-x-1">
          <button 
            onClick={clearLogs}
            className="text-xs bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded transition-colors"
          >
            Clear
          </button>
          <button 
            onClick={() => setIsMinimized(true)}
            className="text-xs bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded transition-colors"
          >
            −
          </button>
        </div>
      </div>
      <div className="p-3 max-h-64 overflow-y-auto">
        {webhookLogs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No webhook events yet</p>
        ) : (
          webhookLogs.map((log, index) => (
            <div key={index} className="mb-2 p-2 bg-gray-50 rounded text-xs border-l-4 border-purple-500">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-purple-600 bg-purple-100 px-1 rounded">{log.event}</span>
                <span className="text-gray-500 text-xs">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="text-gray-600 font-mono text-xs bg-white p-1 rounded border">
                {JSON.stringify(log.data, null, 2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// =============================================
// SPECIALIZED COMPONENTS (unchanged)
// =============================================

export const HeroSection: React.FC<{ onFindRooms: () => void; onListRoom: () => void }> = ({ 
  onFindRooms, 
  onListRoom 
}) => {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Find Your Perfect Room
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-purple-100">
          Discover rooms that feel like home. Verified listings, secure connections.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onFindRooms}
            size="lg"
            className="bg-white text-purple-600 hover:bg-purple-50 transform hover:-translate-y-1 transition-all"
          >
            🏠 Find a Room
          </Button>
          <Button 
            onClick={onListRoom}
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white/10 transform hover:-translate-y-1 transition-all"
          >
            📝 List a Room
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="font-semibold mb-2">Secure & Verified</h3>
            <p className="text-purple-100 text-sm">All listings and users are verified for your safety</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">Instant Contact</h3>
            <p className="text-purple-100 text-sm">Connect with room owners instantly</p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-3xl mb-2">❤️</div>
            <h3 className="font-semibold mb-2">Save Favorites</h3>
            <p className="text-purple-100 text-sm">Keep track of your favorite rooms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-600 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
};