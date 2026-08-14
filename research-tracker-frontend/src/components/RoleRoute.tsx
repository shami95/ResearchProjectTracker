import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface Props {
  allowedRoles: UserRole[];
}

/**
 * Further restricts a route (nested inside PrivateRoute) to specific roles,
 * e.g. the Admin panel. Redirects to the dashboard if the role doesn't match.
 */
const RoleRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
