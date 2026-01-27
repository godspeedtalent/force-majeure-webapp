import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ForceMajeureRootLayout } from '@/components/layout/ForceMajeureRootLayout';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { useAuth } from '@/features/auth/services/AuthContext';
import { AuthPanel } from '@/features/auth/components/AuthPanel';
import { getReturnUrl } from '@/shared/utils/authNavigation';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get return URL - supports both new (returnTo) and legacy (from.pathname) formats
  const returnUrl = useMemo(
    () => getReturnUrl(location.state),
    [location.state]
  );

  // Redirect authenticated users
  useEffect(() => {
    if (user && !loading) {
      navigate(returnUrl, { replace: true });
    }
  }, [user, loading, navigate, returnUrl]);

  const handleAuthSuccess = () => {
    navigate(returnUrl, { replace: true });
  };

  if (loading) {
    return (
      <ForceMajeureRootLayout>
        <div className='flex items-center justify-center min-h-full'>
          <FmCommonLoadingState centered={false} size='lg' />
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
