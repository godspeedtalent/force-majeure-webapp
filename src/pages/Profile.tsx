import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserLinkedArtist } from '@/shared/hooks/useUserLinkedArtist';
import { useUserEvents } from '@/shared/api/queries/userQueries';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { FmI18nPages } from '@/components/common/i18n';

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [showPastShows, setShowPastShows] = useState(false);
  const { hasLinkedArtist, linkedArtist, isLoading: loadingArtist } = useUserLinkedArtist();

  // Fetch user events using centralized hook
  const { data: userEvents, isLoading: loadingShows } = useUserEvents(user?.id);
  const upcomingShows = userEvents?.upcoming ?? [];
  const pastShows = userEvents?.past ?? [];

  if (loading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <FmI18nPages i18nKey='profile.loading' as='div' className='text-muted-foreground' />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className='max-w-4xl mx-auto px-4 py-12'>
          <FmCommonCard>
            <FmCommonCardContent className='p-12 text-center'>
              <FmI18nPages i18nKey='profile.signInToView' as='p' className='text-muted-foreground mb-6' />
              <FmCommonButton variant='gold' onClick={() => navigate('/auth')}>
                <FmI18nPages i18nKey='auth.signInTab' />
              </FmCommonButton>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </Layout>
    );
  }

  // Format the account creation date with 3-letter month abbreviation
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  // Format linked artist date if available with 3-letter month abbreviation
  const linkedArtistDate = linkedArtist?.created_at
    ? new Date(linkedArtist.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const layoutProps = {
    user,
    profile,
    upcomingShows,
    pastShows,
    loadingShows,
    showPastShows,
    onShowPastShowsChange: setShowPastShows,
    hasLinkedArtist,
    linkedArtistName: linkedArtist?.name,
    linkedArtistDate,
    loadingArtist,
    createdAt,
    isOwnProfile: true, // Profile.tsx always shows the current user's own profile
  };

  return (
    <Layout>
      <ProfileLayout {...layoutProps} />
    </Layout>
  );
};

export default Profile;
