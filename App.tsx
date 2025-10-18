import React from 'react';
import { HashRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, ListingsProvider, useAuth } from './store';
import { Navbar, Footer } from './ui';
import { HomePage, ListingsPage, ListingDetailPage, CreateListingPage, ProfilePage, } from './features';
import { UserRole } from './types';
import { VerifyEmailPage } from './components/VerifyEmailPage';
import { RegisterPage } from './components/RegisterPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) => {
  const { currentUser, currentRole } = useAuth();

  if (requireAuth && !currentUser) {
    return <Navigate to="/" replace />;
  }

  if (requireAuth && allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
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
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          
          {/* Protected routes */}
          <Route 
            path="/listings/new" 
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
          
          {/* Catch-all route */}
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