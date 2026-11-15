import React from 'react';
import { Navigate } from 'react-router-dom';
import { Role } from '../data/types';
import { useApp } from '../store/AppContext';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function getHomePathForRole(role: Role): string {
  if (role === 'admin') return '/admin';
  if (role === 'faculty') return '/faculty';
  return '/student';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { session } = useApp();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(session.role)) {
    return <Navigate to={getHomePathForRole(session.role)} replace />;
  }

  return <>{children}</>;
};
