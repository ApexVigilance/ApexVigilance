import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from './store';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      if (user?.role === 'admin') {
        navigate('/', { replace: true });
      } else if (user?.role === 'agent') {
        navigate('/agent', { replace: true });
      } else if (user?.role === 'client') {
        navigate('/client', { replace: true });
      }
    }
  }, [isAuthenticated, user, requiredRole, navigate, location]);

  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
};
