import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that protects routes requiring admin authentication
 * Redirects to admin login page if user is not authenticated as an admin
 */
const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAdmin = authService.isAdminUser();
  
  // Effect to check authentication status when component mounts or location changes
  useEffect(() => {
    // You could add additional verification here if needed
    // For example, verifying the token with the backend
  }, [location]);

  if (!isAdmin) {
    // Redirect to admin login page if not authenticated as admin
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated as admin
  return <>{children}</>;
};

export default ProtectedAdminRoute;