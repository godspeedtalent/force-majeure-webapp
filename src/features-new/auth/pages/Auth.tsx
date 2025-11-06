import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ForceMajeureRootLayout } from '@/components/layout/ForceMajeureRootLayout';
import { useAuth } from '@/features/auth/services/AuthContext';
import { AuthPanel } from '@/features/auth/components/AuthPanel';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users
  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handleAuthSuccess = () => {
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  if (loading) {
    return (
      <ForceMajeureRootLayout>
        <div className='flex items-center justify-center min-h-full'>
          <Loader2 className='w-8 h-8 animate-spin text-fm-gold' />
        </div>
      </ForceMajeureRootLayout>
    );
  }

  return (
    <ForceMajeureRootLayout>
      <div className='flex items-center justify-center min-h-full px-4 py-12'>
        <AuthPanel onAuthSuccess={handleAuthSuccess} />
      </div>
    </ForceMajeureRootLayout>
  );
};

export default Auth;
