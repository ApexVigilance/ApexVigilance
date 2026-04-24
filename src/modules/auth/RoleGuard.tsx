import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from './store';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

const getRoleHome = (role: UserRole): string => {
  if (role === 'admin' || role === 'staff') return '/';
  if (role === 'agent') return '/agent';
  if (role === 'client') return '/client';
  return '/login';
};

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isAllowed = !requiredRole || (user?.role
    ? (Array.isArray(requiredRole) ? requiredRole.includes(user.role) : user.role === requiredRole)
    : false
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }

    if (!isAllowed && user?.role) {
      navigate(getRoleHome(user.role), { replace: true });
    }
  }, [isAuthenticated, user, isAllowed, navigate, location]);

  if (!isAuthenticated || !isAllowed) {
    return null;
  }

  return <>{children}</>;
};
