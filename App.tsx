
import React from 'react';
// If your new server configuration uses BrowserRouter instead of HashRouter, update the import:
import { HashRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, ListingsProvider, useAuth } from './store';
import { Navbar, Footer } from './ui';
import { HomePage, ListingsPage, ListingDetailPage, CreateListingPage, ProfilePage } from './features';
import { UserRole } from './types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, currentRole } = useAuth();

  if (!currentUser) {
    // Redirect to login or home if not logged in
    // For this demo, redirecting to home and showing a message there.
    // Or, could have a dedicated login page.
    return <Navigate to="/" replace />; 
  }

  if (!allowedRoles.includes(currentRole)) {
    // Redirect if role not allowed
    // Could redirect to an "Access Denied" page or show a message
    return <Navigate to="/" replace />; 
  }

  return <>{children}</>;
};


const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route 
            path="/create-listing" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.LANDLORD]}>
                <CreateListingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.TENANT, UserRole.LANDLORD]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          {/* Catch-all for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ListingsProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </ListingsProvider>
    </AuthProvider>
  );
};

export default App;
