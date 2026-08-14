import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Blocks access to nested routes unless the user is authenticated.
 * Redirects to /login (preserving the intended destination) otherwise.
 */
const PrivateRoute: React.FC = () => {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <LoadingSpinner fullPage label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
