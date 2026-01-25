import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserEvents } from '@/shared/api/queries/userQueries';
import { ProfileLayout } from '@/components/profile/ProfileLayout';

interface PublicProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const PublicUserProfile = () => {
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [showPastShows, setShowPastShows] = useState(false);

  // Fetch profile data - use user_id to match the auth user id from the URL
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, created_at')
        .eq('user_id', id)  // Query by user_id, not id - the URL contains auth user id
        .single();

      if (error) throw error;
      return data as PublicProfile;
    },
    enabled: !!id,
  });

  // Fetch user events using centralized hook
  const { data: userEvents, isLoading: loadingShows } = useUserEvents(id);
  const upcomingShows = userEvents?.upcoming ?? [];
  const pastShows = userEvents?.past ?? [];

  // Loading state
  if (profileLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  // Profile not found
  if (profileError || !profileData) {
    return (
      <Layout>
        <div className='max-w-4xl mx-auto px-4 py-12 text-center'>
          <p className='text-muted-foreground mb-6'>{tCommon('empty.noResults')}</p>
          <FmCommonButton variant='default' onClick={() => navigate(-1)}>
            {tCommon('buttons.goBack')}
          </FmCommonButton>
        </div>
      </Layout>
    );
  }

  // Format dates
  const createdAt = profileData.created_at
    ? new Date(profileData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  // Create a user-like object for the layout components
  const userForLayout = {
    id: profileData.id,
    email: '', // Not shown publicly
    created_at: profileData.created_at,
  };

  // Check if current user is viewing their own profile
  // Compare auth user ID with profile's user_id (not the profile's own id)
  const isOwnProfile = currentUser?.id === profileData.user_id;

  const layoutProps = {
    user: userForLayout as any,
    profile: {
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
    },
    upcomingShows,
    pastShows,
    loadingShows,
    showPastShows,
    onShowPastShowsChange: setShowPastShows,
    hasLinkedArtist: false, // TODO: Fetch linked artist if needed
    linkedArtistName: null,
    linkedArtistDate: null,
    loadingArtist: false,
    createdAt,
    isOwnProfile,
  };

  return (
    <Layout>
      <ProfileLayout {...layoutProps} />
    </Layout>
  );
};

export default PublicUserProfile;
