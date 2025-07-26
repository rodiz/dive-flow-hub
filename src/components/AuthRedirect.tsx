import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, userProfile } = useAuth();

  useEffect(() => {
    // Only redirect if we have a user, profile is loaded, and we're on landing/auth pages
    if (!loading && user && userProfile && (location.pathname === '/' || location.pathname === '/auth')) {
      // Add a small delay to prevent infinite loops
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, userProfile, loading, location.pathname, navigate]);

  return null;
};