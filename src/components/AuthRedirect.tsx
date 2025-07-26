import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && (location.pathname === '/' || location.pathname === '/auth')) {
      navigate('/dashboard');
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
};