// features.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Listing, UserRole, PropertyType, RoomType, FurnishingLevel } from './types'; // Added enums
import { useListings, useAuth } from './store';
import { Button, PageContainer, Alert } from './ui';
import { LoginForm } from './components/LoginForm';
import apiService from './API/api';

// ... (icon components remain the same)

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

// ... (ListingCard component remains the same)

interface ListingCardProps {
  listing: Listing;
  onSave?: (listingId: string) => void;
  onContact?: (listingId: string) => void;
  featured?: boolean;
  showActions?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  onSave, 
  onContact,
  featured = false,
  showActions = true
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || !currentUser) {
      alert('Please login to save favorites');
      return;
    }

    setIsSaving(true);
    try {
      if (isFavorite) {
        await apiService.removeFavorite(listing.id, currentUser.id);
        setIsFavorite(false);
      } else {
        await apiService.addFavorite(listing.id, currentUser.id);
        setIsFavorite(true);
      }
      onSave?.(listing.id);
    } catch (error) {
      console.error('Failed to update favorite:', error);
      alert('Failed to update favorite. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContact = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please login to contact landlords');
      return;
    }

    if (onContact) {
      onContact(listing.id);
    } else {
      apiService.sendContactRequest(listing.id, 'I am interested in this property', {
        name: currentUser?.name || 'Anonymous',
        email: currentUser?.email
      });
    }
  };

  // Listen for favorite events
  useEffect(() => {
    const handleFavoriteAdded = (data: any) => {
      if (data.listingId === listing.id && data.userId === currentUser?.id) {
        setIsFavorite(true);
      }
    };

    const handleFavoriteRemoved = (data: any) => {
      if (data.listingId === listing.id && data.userId === currentUser?.id) {
        setIsFavorite(false);
      }
    };

    apiService.on('favorite.added', handleFavoriteAdded);
    apiService.on('favorite.removed', handleFavoriteRemoved);

    return () => {
      apiService.off('favorite.added', handleFavoriteAdded);
      apiService.off('favorite.removed', handleFavoriteRemoved);
    };
  }, [listing.id, currentUser?.id]);

  const imageUrl = listing.photos?.[0] || 'https://picsum.photos/600/400';
  const fallbackImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';

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
          {showActions && (
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
          )}

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
            {listing.address?.neighborhood ? `${listing.address.neighborhood}, ` : ''}{listing.address?.city}
          </p>

          <div className="flex justify-between items-center text-xs text-gray-600 mb-4">
            <span className="bg-gray-100 px-2 py-1 rounded">{listing.roomType}</span>
            <span className="bg-gray-100 px-2 py-1 rounded">{listing.furnishingLevel}</span>
            <span className="bg-gray-100 px-2 py-1 rounded">
              Avail. {new Date(listing.dateAvailable).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {showActions && (
            <Button 
              onClick={handleContact}
              variant="primary" 
              size="sm" 
              className="w-full hover:shadow-md transition-all"
            >
              Contact Owner
            </Button>
          )}
        </div>
      </Link>
    </div>
  );
};

// ... (ListingsPageContent component remains the same)

interface ListingsPageContentProps {
  limit?: number;
  showFilters?: boolean;
}

const ListingsPageContent: React.FC<ListingsPageContentProps> = ({ limit, showFilters = true }) => {
  const { listings, isLoading } = useListings();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);

  const filteredListings = listings
    .filter(l => l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(l => l.monthlyRent >= priceRange[0] && l.monthlyRent <= priceRange[1])
    .slice(0, limit);

  if (isLoading) return <div className="text-center py-8">Loading listings...</div>;
  if (!listings.length) return <PageContainer><p className="text-center text-gray-600">No listings available at the moment.</p></PageContainer>;
  
  return (
    <>
      {showFilters && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input 
                type="text"
                placeholder="e.g., 'downtown', 'San Francisco'"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range: ${priceRange[0]} - ${priceRange[1]}</label>
              <div className="flex space-x-2">
                <input 
                  type="range" 
                  min="0" max="5000" step="100"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange(prev => [Number(e.target.value), prev[1]])}
                  className="w-1/2"
                />
                <input 
                  type="range" 
                  min="0" max="5000" step="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange(prev => [prev[0], Number(e.target.value)])}
                  className="w-1/2"
                />
              </div>
            </div>
            <Button onClick={() => alert("Filters applied!")} className="w-full md:w-auto">Apply Filters</Button>
          </div>
        </div>
      )}
      {filteredListings.length === 0 && <p className="text-center text-gray-500 py-8">No listings match your current filters.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredListings.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </>
  );
};

// ... (HomePage, ListingsPage, ListingDetailPage components remain the same)

export const HomePage: React.FC = () => {
  const { currentRole, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  return (
    <PageContainer>
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <LoginForm onSuccess={handleLoginSuccess} />
            <Button 
              variant="ghost" 
              onClick={() => setShowLogin(false)}
              className="w-full mt-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="text-center py-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl">
        <h1 className="text-5xl font-extrabold text-white sm:text-6xl md:text-7xl">
          Find Your Perfect Room
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-xl text-indigo-100">
          The best place to connect landlords with tenants. Safe, simple, and secure.
        </p>
        <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/listings">
            <Button size="lg" variant="primary" className="w-full sm:w-auto bg-white text-purple-700 hover:bg-gray-100">
              Find a Room
            </Button>
          </Link>
          
          {!isAuthenticated ? (
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-purple-700"
              onClick={() => setShowLogin(true)}
            >
              Login to List Room
            </Button>
          ) : currentRole === UserRole.LANDLORD ? (
            <Link to="/create-listing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-purple-700">
                List Your Room
              </Button>
            </Link>
          ) : (
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-purple-700"
              onClick={() => alert("Switch to Landlord role to list a room.")}
            >
              List Your Room
            </Button>
          )}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Featured Listings</h2>
        <ListingsPageContent limit={3} showFilters={false} />
      </div>
    </PageContainer>
  );
};

export const ListingsPage: React.FC = () => {
  return (
    <PageContainer title="Find Your Next Room">
      <ListingsPageContent />
    </PageContainer>
  );
};

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getListingById } = useListings();
  const [listing, setListing] = useState<Listing | null | undefined>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      setListing(getListingById(id));
    }
  }, [id, getListingById]);

  if (!listing) return <PageContainer title="Not Found"><p>Listing not found.</p></PageContainer>;

  const nextImage = () => setCurrentImageIndex((prevIndex) => (prevIndex + 1) % (listing.photos?.length || 1));
  const prevImage = () => setCurrentImageIndex((prevIndex) => (prevIndex - 1 + (listing.photos?.length || 1)) % (listing.photos?.length || 1));

  const renderDetailItem = (label: string, value?: string | number | null | boolean) => {
    if (value === undefined || value === null) return null;
    return (
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
            </dd>
        </div>
    );
  };

  return (
    <PageContainer title={listing.title}>
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Image Gallery */}
        {listing.photos && listing.photos.length > 0 && (
            <div className="relative h-96">
                <img src={listing.photos[currentImageIndex]} alt={`${listing.title} - view ${currentImageIndex + 1}`} className="w-full h-full object-cover" />
                {listing.photos.length > 1 && (
                    <>
                        <Button onClick={prevImage} variant="secondary" size="sm" className="absolute left-4 top-1/2 transform -translate-y-1/2 !p-2 !rounded-full opacity-75 hover:opacity-100">&lt;</Button>
                        <Button onClick={nextImage} variant="secondary" size="sm" className="absolute right-4 top-1/2 transform -translate-y-1/2 !p-2 !rounded-full opacity-75 hover:opacity-100">&gt;</Button>
                    </>
                )}
            </div>
        )}

        <div className="p-6 md:p-8">
          <div className="md:flex md:justify-between md:items-start">
            <div>
              <p className="text-sm text-purple-600 font-semibold">{listing.propertyType} - {listing.roomType}</p>
              <p className="text-gray-600 mt-1">{listing.address?.neighborhood ? `${listing.address.neighborhood}, ` : ''}{listing.address?.city}</p>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right">
              <p className="text-3xl font-bold text-purple-700">${listing.monthlyRent}<span className="text-base font-normal text-gray-500">/month</span></p>
              <p className="text-sm text-gray-500">Security Deposit: ${listing.securityDeposit}</p>
            </div>
          </div>

          <hr className="my-6" />
          
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed mb-6">{listing.description}</p>

          <h2 className="text-xl font-semibold text-gray-800 mb-3">Room & Property Details</h2>
          <dl className="divide-y divide-gray-200">
            {renderDetailItem("Furnishing", listing.furnishingLevel)}
            {renderDetailItem("Square Footage", listing.squareFootage ? `${listing.squareFootage} sq ft` : undefined)}
            {renderDetailItem("Date Available", new Date(listing.dateAvailable).toLocaleDateString())}
            {renderDetailItem("Minimum Lease", listing.leaseLengthMinMonths ? `${listing.leaseLengthMinMonths} months` : 'Flexible')}
            {listing.leaseLengthMaxMonths && renderDetailItem("Maximum Lease", `${listing.leaseLengthMaxMonths} months`)}
          </dl>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="w-full sm:w-auto flex-1">Contact Landlord</Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto flex-1">Request Viewing</Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

// =============================================
// LISTING FORM COMPONENT (FIXED: Used enum values)
// =============================================

interface ListingFormProps {
  onSubmit: (listingData: Omit<Listing, 'id' | 'landlordId' | 'createdAt' | 'views'>) => void;
  isLoading: boolean;
}

const ListingForm: React.FC<ListingFormProps> = ({ onSubmit, isLoading }) => {
  // ✅ FIXED: Removed unused navigate variable
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [rent, setRent] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [dateAvailable, setDateAvailable] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newListingData: Omit<Listing, 'id' | 'landlordId' | 'createdAt' | 'views'> = {
      title,
      description,
      propertyType: PropertyType.APARTMENT, // ✅ FIXED: Used enum value
      address: { city, neighborhood },
      roomType: RoomType.SINGLE, // ✅ FIXED: Used enum value
      furnishingLevel: FurnishingLevel.UNFURNISHED, // ✅ FIXED: Used enum value
      monthlyRent: Number(rent),
      securityDeposit: Number(deposit),
      dateAvailable: new Date(dateAvailable),
      photos: ['https://picsum.photos/seed/default/600/400'],
      billsIncluded: { wifi: true, water: true, electricity: false, gas: false },
      houseRules: { smokingAllowed: false, petsConsidered: false, overnightGuestsPolicy: "Negotiable" },
      price: 0,
      location: '',
      images: [],
      amenities: [],
      details: {
        availableFrom: dateAvailable ? new Date(dateAvailable) : new Date(),
        bedrooms: 0,
        bathrooms: 0,
        squareFootage: undefined,
        floorLevel: undefined,
        totalFloors: undefined,
        parkingAvailable: undefined,
        petFriendly: undefined,
        furnished: undefined,
        area: 0,
        minimumLease: 0,
        deposit: 0
      },
      utilities: {
        internet: false,
        electricity: false,
        water: false,
        gas: false,
        councilTax: undefined
      },
      rules: {
        parties: false,
        guests: false,
        pets: false,
        smoking: false,
        overnightGuests: '',
        petsAllowed: false,
        smokingAllowed: false,
        petsConsidered: false,
        overnightGuestsPolicy: ''
      },
      pets: false,
      smoking: false,
      parties: false,
      guests: false,
      contact: {
        name: '',
        email: undefined,
        phone: undefined
      },
      status: '',
      overnightGuests: '',
      petsAllowed: false,
      utilitiesIncluded: {
        electricity: false,
        gas: false,
        councilTax: undefined,
        wifiIncluded: false,
        electricityIncluded: false,
        water: false,
        gasIncluded: false,
        councilTaxIncluded: undefined
      },
      city: ''
    };
    
    onSubmit(newListingData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-xl">
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4">Property & Location</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input 
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input 
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood (Optional)</label>
            <input 
              type="text"
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4">Financials & Terms</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
            <input 
              type="number"
              value={rent}
              onChange={e => setRent(Number(e.target.value))}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit ($)</label>
            <input 
              type="number"
              value={deposit}
              onChange={e => setDeposit(Number(e.target.value))}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Available</label>
            <input 
              type="date"
              value={dateAvailable}
              onChange={e => setDateAvailable(e.target.value)}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isLoading} className="w-full">
        {isLoading ? 'Submitting...' : 'Create Listing'}
      </Button>
    </form>
  );
};
export const RegisterPage: React.FC = () => {
  return (
    <PageContainer title="Register">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create Your Account</h2>
        <LoginForm isRegisterMode={true} />
      </div>
    </PageContainer>
  );
}
// CreateListingPage Component
export const CreateListingPage: React.FC = () => {
  // ✅ FIXED: Removed unused currentUser variable
  const { currentRole, isAuthenticated } = useAuth();
  const { addListing, isLoading } = useListings();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <PageContainer title="Access Denied">
        <Alert type="error" message="You need to be logged in to create a listing."/>
        <Link to="/"><Button variant="primary" className="mt-4">Go to Homepage</Button></Link>
      </PageContainer>
    );
  }

  if (currentRole !== UserRole.LANDLORD) {
    return (
      <PageContainer title="Access Denied">
        <Alert type="error" message="You need to be a Landlord to create listings. Please switch your role."/>
        <Link to="/"><Button variant="primary" className="mt-4">Go to Homepage</Button></Link>
      </PageContainer>
    );
  }

  const handleSubmit = async (listingData: Omit<Listing, 'id' | 'landlordId' | 'createdAt' | 'views'>) => {
    try {
      const createdListing = await addListing(listingData);
      navigate(`/listings/${createdListing.id}`);
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert('Failed to create listing. Please try again.');
    }
  };

  return (
    <PageContainer title="Create a New Listing">
      <ListingForm onSubmit={handleSubmit} isLoading={isLoading} />
    </PageContainer>
  );
};

// ... (ProfilePage component remains the same)

export const ProfilePage: React.FC = () => {
  const { currentUser, currentRole, isAuthenticated, logout } = useAuth();
  const { listings } = useListings();

  if (!isAuthenticated || !currentUser) {
    return (
      <PageContainer title="Profile">
        <Alert type="info" message="Please log in to view your profile."/>
        <Link to="/">
          <Button variant="primary" className="mt-4">Go to Homepage</Button>
        </Link>
      </PageContainer>
    );
  }
  
  const userListings = currentRole === UserRole.LANDLORD 
    ? listings.filter(l => l.landlordId === currentUser.id) 
    : [];

  return (
    <PageContainer title={`${currentUser.name}'s Profile`}>
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <img 
            src={currentUser.profilePictureUrl || `https://picsum.photos/seed/${currentUser.id}/150/150`}
            alt={currentUser.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
          />
          <div className="text-center md:text-left flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {currentUser.name} 
                  {currentUser.isVerified && <span className="text-green-500 text-sm align-middle ml-2">(Verified ✓)</span>}
                </h2>
                <p className="text-purple-600 font-medium">
                  {currentRole === UserRole.LANDLORD ? 'Landlord' : 'Tenant'}
                </p>
                <p className="text-gray-600 mt-1">
                  Member since: {new Date(currentUser.memberSince).toLocaleDateString()}
                </p>
                {currentUser.bio && (
                  <p className="mt-3 text-gray-700 max-w-xl">{currentUser.bio}</p>
                )}
              </div>
              <Button variant="outline" onClick={logout} className="ml-4">
                Logout
              </Button>
            </div>
          </div>
        </div>

        <hr className="my-8"/>

        {currentRole === UserRole.LANDLORD && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                My Listings ({userListings.length})
              </h3>
              <Link to="/create-listing">
                <Button variant="primary" size="sm">
                  + Create New Listing
                </Button>
              </Link>
            </div>
            {userListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} showActions={false} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                You haven't created any listings yet.{' '}
                <Link to="/create-listing" className="text-purple-600 hover:underline">
                  Create one now!
                </Link>
              </p>
            )}
          </div>
        )}

        {currentRole === UserRole.TENANT && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">My Rental Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentUser.email && (
                <ProfileDetailItem label="Email" value={currentUser.email} />
              )}
            </div>
            <p className="mt-4 text-gray-600">
              This information helps landlords get to know you better.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

const ProfileDetailItem: React.FC<{label: string, value: string}> = ({label, value}) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">{value}</dd>
  </div>
);