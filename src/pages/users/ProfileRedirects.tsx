import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/services/AuthContext';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';

/**
 * Redirects /profile to /users/:currentUserId
 * This ensures a single source of truth for user profiles
 */
export const ProfileRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <FmCommonLoadingSpinner size='lg' />
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/auth' replace />;
  }

  return <Navigate to={`/users/${user.id}`} replace />;
};

/**
 * Redirects /profile/edit to /users/:currentUserId/edit
 * This ensures a single source of truth for profile editing
 */
export const ProfileEditRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <FmCommonLoadingSpinner size='lg' />
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/auth' replace />;
  }

  return <Navigate to={`/users/${user.id}/edit`} replace />;
};
