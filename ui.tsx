import React, { ReactNode, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { APP_NAME, Listing, UserRole } from './types';
import { useAuth } from './store';
import apiService, { WebhookEvent } from './API/api.ts';

// =============================================
// ICON COMPONENTS
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
// CORE COMPONENTS - Define these FIRST to avoid reference errors
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
  const baseStyles = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out border";
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variantStyles = {
    primary: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 disabled:bg-purple-400 border-transparent",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-100 border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400 border-transparent",
    outline: "bg-transparent text-purple-600 border-purple-600 hover:bg-purple-50 focus:ring-purple-500 disabled:opacity-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400 disabled:opacity-50 border-transparent"
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

// =============================================
// LAYOUT COMPONENTS
// =============================================

// Login Modal Component
const LoginModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onLogin: () => void; 
  onRegister: () => void;
  currentUser?: any;
}> = ({ isOpen, onClose, onLogin, onRegister, currentUser }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentUser && !currentUser.isActive ? 'Account Inactive' : `Welcome to ${APP_NAME}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {currentUser && !currentUser.isActive ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Account Inactive</h3>
              <p className="text-gray-600 mb-6">
                Your account is currently inactive. You can either login with a different account or create a new one.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCircleIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Join {APP_NAME}</h3>
              <p className="text-gray-600 mb-6">
                Login to your existing account or create a new one to get started.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onLogin}
              variant="primary"
              className="w-full justify-center"
            >
              <UserCircleIcon className="w-5 h-5 mr-2" />
              Login to Existing Account
            </Button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <Button
              onClick={onRegister}
              variant="outline"
              className="w-full justify-center border-green-600 text-green-600 hover:bg-green-50"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Create New Account
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { currentUser, currentRole, switchRole, logout, login } = useAuth();
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [apiTestDetails, setApiTestDetails] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(event.target.value as UserRole);
  };

  const handleReadyAction = () => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    if (!currentUser.isVerified) {
      alert('Please verify your email address before proceeding.');
      navigate('/verify-email');
      return;
    }

    if (!currentUser.isActive) {
      setShowLoginModal(true);
      return;
    }

    // Role-based routing
    switch (currentRole) {
      case UserRole.TENANT:
        navigate('/listings');
        break;
      case UserRole.LANDLORD:
        navigate('/listings/new');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleLogin = () => {
    setShowLoginModal(false);
    login(currentRole);
  };

  const handleRegister = () => {
    setShowLoginModal(false);
    navigate('/register');
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
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

  // Get button state based on user status
  const getButtonConfig = () => {
    if (!currentUser) {
      return {
        variant: 'primary' as const,
        label: 'Login',
        disabled: false,
        title: 'Login to access features',
        onClick: () => setShowLoginModal(true),
        className: ''
      };
    }

    if (!currentUser.isVerified) {
      return {
        variant: 'secondary' as const,
        label: 'Verify Email',
        disabled: false,
        title: 'Please verify your email address',
        onClick: () => navigate('/verify-email'),
        className: 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500'
      };
    }

    if (!currentUser.isActive) {
      return {
        variant: 'danger' as const,
        label: 'Account Inactive',
        disabled: false,
        title: 'Your account is inactive. Click to login or create new account.',
        onClick: () => setShowLoginModal(true),
        className: ''
      };
    }

    // User is ready and authorized
    return {
      variant: 'primary' as const,
      label: `Ready as ${currentRole}`,
      disabled: false,
      title: `Access ${currentRole} features`,
      onClick: handleReadyAction,
      className: 'bg-green-600 hover:bg-green-700 border-green-600 ready-glow'
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
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

          {/* Center navigation */}
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
                to="/listings/new" 
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

          {/* Right section */}
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
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={buttonConfig.onClick}
                  variant={buttonConfig.variant}
                  size="sm"
                  disabled={buttonConfig.disabled}
                  title={buttonConfig.title}
                  className={`hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${buttonConfig.className}`}
                >
                  {buttonConfig.label}
                </Button>
                <Button 
                  onClick={logout} 
                  variant="secondary" 
                  size="sm"
                  className="hover:shadow-sm transition-all"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                onClick={buttonConfig.onClick}
                variant={buttonConfig.variant}
                size="sm"
                disabled={buttonConfig.disabled}
                title={buttonConfig.title}
                className={`hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${buttonConfig.className}`}
              >
                {buttonConfig.label}
              </Button>
            )}
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={showLoginModal}
        onClose={handleCloseModal}
        onLogin={handleLogin}
        onRegister={handleRegister}
        currentUser={currentUser}
      />
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

          {featured && (
            <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              Featured
            </div>
          )}

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
// =============================================
// FORM COMPONENTS
// =============================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${className} ${
          error ? 'border-red-500' : ''
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', children, onClose }) => {
  const variantStyles = {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div className={`p-4 rounded-md border ${variantStyles[variant]} mb-4`}>
      <div className="flex justify-between items-center">
        <div>{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${className} ${
          error ? 'border-red-500' : ''
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, className, options, ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${className} ${
          error ? 'border-red-500' : ''
        }`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
// Rest of the components remain the same as in your original code...
// [ListingGrid, Input, Textarea, Select, LoadingSpinner, Alert, WebhookManager, HeroSection, EmptyState]
// These would follow the same pattern with proper TypeScript typing

export const ListingGrid: React.FC<{ featured?: boolean }> = ({ featured = false }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Type guards
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

  const filteredListings = React.useMemo(() => {
    return featured ? listings.slice(0, 3) : listings;
  }, [listings, featured]);

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
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">Error loading listings</div>
        <p className="text-gray-600">{error}</p>
      </div>
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
        />
      ))}
    </div>
  );
};

// ... Include the rest of your components (Input, Textarea, Select, etc.) here
// They can remain largely the same as in your original code

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