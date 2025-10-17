
import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Listing, PropertyType, RoomType, FurnishingLevel, UserRole } from './types';
import { useListings, useAuth } from './store';
import { Button, Input, Textarea, ListingCard, PageContainer, LoadingSpinner, Alert } from './ui';
import { generateListingDescription } from './services/geminiService';

// HomePage Component
export const HomePage: React.FC = () => {
  const { currentRole } = useAuth();
  return (
    <PageContainer>
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
          {currentRole === UserRole.LANDLORD && (
             <Link to="/create-listing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-purple-700">
                    List Your Room
                </Button>
            </Link>
          )}
           {currentRole === UserRole.TENANT && (
             <Link to="/create-listing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-purple-700"
                onClick={() => alert("Switch to Landlord role to list a room.")}
                >
                    List Your Room
                </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Featured Listings</h2>
        {/* Placeholder for featured listings - could be a small selection from useListings */}
        <ListingsPageContent limit={3} showFilters={false} />
      </div>
    </PageContainer>
  );
};

// ListingsPageContent (shared between HomePage featured and ListingsPage)
const ListingsPageContent: React.FC<{ limit?: number; showFilters?: boolean }> = ({ limit, showFilters = true }) => {
  const { listings, isLoading } = useListings();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  // Add more filter states: roomTypeFilter, furnishedFilter, etc.

  const filteredListings = listings
    .filter(l => l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.address.city.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(l => l.monthlyRent >= priceRange[0] && l.monthlyRent <= priceRange[1])
    .slice(0, limit);

  if (isLoading) return <LoadingSpinner />;
  if (!listings.length) return <PageContainer><p className="text-center text-gray-600">No listings available at the moment.</p></PageContainer>;
  
  return (
    <>
      {showFilters && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input 
              label="Search by keyword or city"
              placeholder="e.g., 'downtown', 'San Francisco'"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range: ${priceRange[0]} - ${priceRange[1]}</label>
              <div className="flex space-x-2">
                <Input 
                  type="range" 
                  min="0" max="5000" step="100"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange(prev => [Number(e.target.value), prev[1]])}
                  className="w-1/2"
                />
                <Input 
                  type="range" 
                  min="0" max="5000" step="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange(prev => [prev[0], Number(e.target.value)])}
                  className="w-1/2"
                />
              </div>
            </div>
            <Button onClick={() => alert("Filters applied (UI only for advanced filters)!")} className="w-full md:w-auto">Apply Filters</Button>
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


// ListingsPage Component
export const ListingsPage: React.FC = () => {
  return (
    <PageContainer title="Find Your Next Room">
      <ListingsPageContent />
    </PageContainer>
  );
};

// ListingDetailPage Component
export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getListingById, isLoading } = useListings();
  const [listing, setListing] = useState<Listing | null | undefined>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      setListing(getListingById(id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, getListingById]); // getListingById is stable from context

  if (isLoading) return <PageContainer><LoadingSpinner /></PageContainer>;
  if (!listing) return <PageContainer title="Not Found"><p>Listing not found.</p></PageContainer>;

  const nextImage = () => setCurrentImageIndex((prevIndex) => (prevIndex + 1) % listing.photos.length);
  const prevImage = () => setCurrentImageIndex((prevIndex) => (prevIndex - 1 + listing.photos.length) % listing.photos.length);

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
              <p className="text-gray-600 mt-1">{listing.address.neighborhood ? `${listing.address.neighborhood}, ` : ''}{listing.address.city}</p>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right">
              <p className="text-3xl font-bold text-purple-700">${listing.monthlyRent}<span className="text-base font-normal text-gray-500">/month</span></p>
              <p className="text-sm text-gray-500">Security Deposit: ${listing.securityDeposit}</p>
            </div>
          </div>

          <hr className="my-6" />
          
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed mb-6">{listing.description}</p>

          {listing.videoUrl && (
            <div className="my-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Video Tour</h2>
                <div className="aspect-w-16 aspect-h-9">
                    <iframe 
                        src={listing.videoUrl.replace("watch?v=", "embed/")} // Basic YouTube embed conversion
                        title="Video tour"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full h-full rounded-lg shadow"
                    ></iframe>
                </div>
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-800 mb-3">Room & Property Details</h2>
          <dl className="divide-y divide-gray-200">
            {renderDetailItem("Furnishing", listing.furnishingLevel)}
            {renderDetailItem("Square Footage", listing.squareFootage ? `${listing.squareFootage} sq ft` : undefined)}
            {renderDetailItem("Date Available", new Date(listing.dateAvailable).toLocaleDateString())}
            {renderDetailItem("Minimum Lease", listing.leaseLengthMinMonths ? `${listing.leaseLengthMinMonths} months` : 'Flexible')}
            {listing.leaseLengthMaxMonths && renderDetailItem("Maximum Lease", `${listing.leaseLengthMaxMonths} months`)}
          </dl>

          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Bills Included</h2>
          <ul className="list-disc list-inside text-gray-700">
            {Object.entries(listing.billsIncluded).map(([bill, included]) => included && <li key={bill} className="capitalize">{bill}</li>)}
          </ul>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">House Rules</h2>
          <dl className="divide-y divide-gray-200">
            {renderDetailItem("Smoking Allowed", listing.houseRules.smokingAllowed)}
            {renderDetailItem("Pets Considered", listing.houseRules.petsConsidered)}
            {renderDetailItem("Overnight Guests", listing.houseRules.overnightGuestsPolicy)}
          </dl>

          {listing.aboutHousemates && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">About the Housemates</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{listing.aboutHousemates}</p>
            </>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="w-full sm:w-auto flex-1">Contact Landlord</Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto flex-1">Request Viewing</Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};


// ListingForm Component (used in CreateListingPage)
const ListingForm: React.FC<{ initialData?: Partial<Listing> }> = ({ initialData }) => {
  const { addListing, isLoading: isSubmitting } = useListings();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [propertyType, setPropertyType] = useState<PropertyType>(initialData?.propertyType || PropertyType.APARTMENT);
  const [city, setCity] = useState(initialData?.address?.city || '');
  const [neighborhood, setNeighborhood] = useState(initialData?.address?.neighborhood || '');
  const [roomType, setRoomType] = useState<RoomType>(initialData?.roomType || RoomType.SINGLE);
  const [furnishing, setFurnishing] = useState<FurnishingLevel>(initialData?.furnishingLevel || FurnishingLevel.UNFURNISHED);
  const [rent, setRent] = useState<number>(initialData?.monthlyRent || 0);
  const [deposit, setDeposit] = useState<number>(initialData?.securityDeposit || 0);
  const [dateAvailable, setDateAvailable] = useState(initialData?.dateAvailable ? new Date(initialData.dateAvailable).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []); // For simplicity, string URLs. Real app would use File objects and upload.
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  // AI Description state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleAddPhoto = () => {
    if (photoUrlInput && photos.length < 5) { // Limit photos
        setPhotos([...photos, photoUrlInput]);
        setPhotoUrlInput('');
    } else if (photos.length >= 5) {
        alert("Maximum of 5 photos allowed.");
    }
  };

  const handleGenerateDescription = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please provide some keywords for the description.");
      return;
    }
    setAiError('');
    setIsGeneratingDesc(true);
    try {
      const generatedDesc = await generateListingDescription(aiPrompt);
      setDescription(generatedDesc);
    } catch (error) {
      console.error("AI Description generation failed:", error);
      setAiError("Failed to generate description.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== UserRole.LANDLORD) {
      alert("You must be logged in as a landlord to create a listing.");
      return;
    }
    const newListingData: Omit<Listing, 'id' | 'landlordId' | 'createdAt'| 'views'> = {
      title, description, propertyType, 
      address: { city, neighborhood },
      roomType, furnishingLevel: furnishing,
      monthlyRent: Number(rent), securityDeposit: Number(deposit), dateAvailable: new Date(dateAvailable),
      photos: photos.length > 0 ? photos : ['https://picsum.photos/seed/default/600/400'], // Default photo
      billsIncluded: { wifi: true, water: true, electricity: false, gas: false }, // Simplified
      houseRules: { smokingAllowed: false, petsConsidered: false, overnightGuestsPolicy: "Negotiable" }, // Simplified
    };
    const createdListing = addListing(newListingData);
    navigate(`/listings/${createdListing.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-xl">
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4">Property & Location</h2>
        <Input label="Catchy Title" value={title} onChange={e => setTitle(e.target.value)} required />
        
        <div className="space-y-2">
            <Textarea label="Detailed Description" value={description} onChange={e => setDescription(e.target.value)} rows={5} required />
            <div className="p-4 border border-purple-200 rounded-md bg-purple-50">
                <label htmlFor="aiPrompt" className="block text-sm font-medium text-purple-700 mb-1">AI Description Helper</label>
                <Input id="aiPrompt" placeholder="e.g., cozy, bright, students, near park" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                <Button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc} variant="outline" size="sm" className="mt-2">
                    {isGeneratingDesc ? 'Generating...' : 'Generate with AI'}
                </Button>
                {aiError && <p className="text-red-500 text-xs mt-1">{aiError}</p>}
            </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="City" value={city} onChange={e => setCity(e.target.value)} required />
            <Input label="Neighborhood (Optional)" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select value={propertyType} onChange={e => setPropertyType(e.target.value as PropertyType)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md">
                {Object.values(PropertyType).map(pt => <option key={pt} value={pt}>{pt}</option>)}
            </select>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4">The Room</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select value={roomType} onChange={e => setRoomType(e.target.value as RoomType)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md">
                    {Object.values(RoomType).map(rt => <option key={rt} value={rt}>{rt}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Furnishing Level</label>
                <select value={furnishing} onChange={e => setFurnishing(e.target.value as FurnishingLevel)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md">
                    {Object.values(FurnishingLevel).map(fl => <option key={fl} value={fl}>{fl}</option>)}
                </select>
            </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4">Visuals</h2>
        <div className="space-y-2">
            <Input 
                label="Add Photo URL (up to 5)" 
                placeholder="https://example.com/image.jpg"
                value={photoUrlInput} 
                onChange={e => setPhotoUrlInput(e.target.value)} 
            />
            <Button type="button" onClick={handleAddPhoto} variant="secondary" size="sm" disabled={photos.length >= 5}>Add Photo</Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {photos.map((photo, index) => (
                <div key={index} className="relative">
                    <img src={photo} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded"/>
                    <Button 
                        type="button" 
                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full !p-1 text-xs leading-none"
                        aria-label="Remove photo"
                    >
                        X
                    </Button>
                </div>
            ))}
        </div>
         {photos.length === 0 && <p className="text-xs text-gray-500">Minimum 1 photo required (default will be used if none).</p>}
      </div>


      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4">Financials & Terms</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Monthly Rent ($)" type="number" value={rent} onChange={e => setRent(Number(e.target.value))} required />
            <Input label="Security Deposit ($)" type="number" value={deposit} onChange={e => setDeposit(Number(e.target.value))} required />
            <Input label="Date Available" type="date" value={dateAvailable} onChange={e => setDateAvailable(e.target.value)} required />
        </div>
        {/* Simplified bills and rules for this example */}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : (initialData ? 'Update Listing' : 'Create Listing')}
      </Button>
    </form>
  );
};


// CreateListingPage Component
export const CreateListingPage: React.FC = () => {
  const { currentUser, currentRole } = useAuth();

  if (!currentUser || currentRole !== UserRole.LANDLORD) {
    return (
      <PageContainer title="Access Denied">
        <Alert type="error" message="You need to be logged in as a Landlord to create a listing. Please switch your role or log in."/>
        <Link to="/"><Button variant="primary" className="mt-4">Go to Homepage</Button></Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Create a New Listing">
      <ListingForm />
    </PageContainer>
  );
};

// ProfilePage Component
export const ProfilePage: React.FC = () => {
  const { currentUser, currentRole, isLandlord } = useAuth();
  const { listings } = useListings();

  if (!currentUser) {
    return <PageContainer title="Profile"><Alert type="info" message="Please log in to view your profile."/></PageContainer>;
  }
  
  const userListings = isLandlord ? listings.filter(l => l.landlordId === currentUser.id) : [];

  return (
    <PageContainer title={`${currentUser.name}'s Profile`}>
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <img 
                src={currentUser.profilePictureUrl || (currentRole === UserRole.LANDLORD ? `https://picsum.photos/seed/landlord${currentUser.id}/150/150` : `https://picsum.photos/seed/tenant${currentUser.id}/150/150`)}
                alt={currentUser.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
            />
            <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-800">{currentUser.name} {currentUser.isVerified && <span className="text-green-500 text-sm align-middle">(Verified ✓)</span>}</h2>
                <p className="text-purple-600 font-medium">{currentRole === UserRole.LANDLORD ? 'Landlord' : 'Tenant'}</p>
                <p className="text-gray-600 mt-1">Member since: {new Date(currentUser.memberSince).toLocaleDateString()}</p>
                {currentUser.bio && <p className="mt-3 text-gray-700 max-w-xl">{currentUser.bio}</p>}
            </div>
        </div>

        <hr className="my-8"/>

        {isLandlord && (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">My Listings ({userListings.length})</h3>
                {userListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userListings.map(listing => <ListingCard key={listing.id} listing={listing}/>)}
                    </div>
                ) : (
                    <p className="text-gray-600">You haven't created any listings yet. <Link to="/create-listing" className="text-purple-600 hover:underline">Create one now!</Link></p>
                )}
            </div>
        )}

        {!isLandlord && (
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">My Rental Profile</h3>
                <dl className="divide-y divide-gray-200">
                    {currentUser.occupation && <ProfileDetailItem label="Occupation/Student Status" value={currentUser.occupation} />}
                    {currentUser.desiredLocation && <ProfileDetailItem label="Desired General Location" value={currentUser.desiredLocation} />}
                    {currentUser.idealMoveInDate && <ProfileDetailItem label="Ideal Move-in Date" value={new Date(currentUser.idealMoveInDate).toLocaleDateString()} />}
                </dl>
                 <p className="mt-4 text-gray-600">This information helps landlords get to know you better.</p>
            </div>
        )}
        <Button variant="outline" className="mt-8">Edit Profile (UI Only)</Button>
      </div>
    </PageContainer>
  );
};

const ProfileDetailItem: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value}</dd>
    </div>
);


