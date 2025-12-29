import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink, Music2, User, Calendar, RefreshCw, Star } from 'lucide-react';
import { SiSoundcloud, SiSpotify } from 'react-icons/si';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmRecordingLink } from '@/components/common/links/FmRecordingLink';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, logger } from '@/shared';
import { DetailPageWrapper } from '@/components/layout/DetailPageWrapper';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';
import { toast } from 'sonner';
import { extractSpotifyTrackId, getSpotifyTrack } from '@/services/spotify/spotifyApiService';
import { getSoundCloudTrackFromUrl } from '@/services/soundcloud/soundcloudApiService';
import { useState } from 'react';
import {
  FmRecordingRatingInput,
  FmRecordingRatingsBreakdown,
} from '@/components/recordings';
import { useRecordingRatingStats } from '@/shared/api/queries/recordingRatingQueries';

const PLACEHOLDER_COVER = '/placeholder.svg';

export default function RecordingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { isAdmin, hasRole, hasAnyRole } = useUserPermissions();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user can view/add ratings
  const canViewRatings = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);

  // Fetch rating stats for the header badge
  const { data: ratingStats } = useRecordingRatingStats(id);

  const { data: recording, isLoading, error } = useQuery({
    queryKey: ['recording', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('artist_recordings')
        .select(`
          *,
          artists!artist_id(id, name, image_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const canEdit = isAdmin() || hasRole('developer');

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/developer/database?table=recordings');
    }
  };

  const handleRefreshDetails = async () => {
    if (!recording?.url) {
      toast.error('No URL found for this recording');
      return;
    }

    setIsRefreshing(true);
    const loadingToast = toast.loading('Fetching recording details...');

    try {
      let updateData: Record<string, any> = {};

      if (recording.url.includes('spotify.com')) {
        const trackId = extractSpotifyTrackId(recording.url);
        if (!trackId) {
          toast.dismiss(loadingToast);
          toast.error('Could not extract Spotify track ID from URL');
          setIsRefreshing(false);
          return;
        }

        const track = await getSpotifyTrack(trackId);
        updateData = {
          name: track.name,
          cover_art: track.album.images[0]?.url || null,
          platform: 'spotify',
        };
      } else if (recording.url.includes('soundcloud.com')) {
        const trackData = await getSoundCloudTrackFromUrl(recording.url);
        if (!trackData) {
          toast.dismiss(loadingToast);
          toast.error('Could not fetch SoundCloud track details');
          setIsRefreshing(false);
          return;
        }

        updateData = {
          name: trackData.name,
          cover_art: trackData.coverArt || null,
          platform: 'soundcloud',
        };
      } else {
        toast.dismiss(loadingToast);
        toast.error('Unknown platform. Only Spotify and SoundCloud URLs are supported.');
        setIsRefreshing(false);
        return;
      }

      const { error } = await (supabase as any)
        .from('artist_recordings')
        .update(updateData)
        .eq('id', recording.id);

      if (error) throw error;

      // Refresh the query
      queryClient.invalidateQueries({ queryKey: ['recording', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });

      toast.dismiss(loadingToast);
      toast.success(`Updated "${updateData.name}" successfully`);
    } catch (error) {
      toast.dismiss(loadingToast);
      logger.error('Error refreshing recording details:', { error: error instanceof Error ? error.message : 'Unknown error' });
      toast.error('Failed to refresh recording details');
    } finally {
      setIsRefreshing(false);
    }
  };

  const PlatformIcon = recording?.platform === 'spotify' ? SiSpotify : SiSoundcloud;
  const platformColor = recording?.platform === 'spotify' ? 'text-[#1DB954]' : 'text-[#FF5500]';

  return (
    <DetailPageWrapper
      data={recording}
      isLoading={isLoading}
      error={error}
      entityName="Recording"
      onBack={handleBack}
      notFoundMessage="Recording not found"
      useLayout={true}
    >
      {(recording) => (
        <div className='min-h-screen'>
          {/* Header */}
          <div className='border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10'>
            <div className='container mx-auto px-4 py-4'>
              <div className='flex items-center justify-between'>
                <FmCommonButton
                  variant='secondary'
                  size='sm'
                  icon={ArrowLeft}
                  onClick={handleBack}
                >
                  {t('buttons.back')}
                </FmCommonButton>
                
                <div className='flex items-center gap-2'>
                  {canEdit && (
                    <FmCommonButton
                      variant='secondary'
                      size='sm'
                      icon={RefreshCw}
                      onClick={handleRefreshDetails}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? 'Refreshing...' : 'Refresh Details'}
                    </FmCommonButton>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='w-full lg:w-[80%] mx-auto px-4 py-8'>
            <div className='bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-[30px]'>
              <div className='flex flex-col gap-6 md:flex-row md:items-start'>
                {/* Left: Cover Art */}
                <div className='w-full md:w-64 flex-shrink-0'>
                  <div className='overflow-hidden rounded-none border border-white/15 bg-white/5 shadow-inner'>
                    <img
                      src={recording.cover_art || PLACEHOLDER_COVER}
                      alt={recording.name}
                      className='aspect-square w-full object-cover'
                    />
                  </div>
                </div>

                {/* Right: Details */}
                <div className='flex-1 flex flex-col gap-4'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <PlatformIcon className={`h-5 w-5 ${platformColor}`} />
                      <span className={`text-xs uppercase tracking-wider ${platformColor}`}>
                        {recording.platform || 'Unknown Platform'}
                      </span>
                    </div>
                    <h1 className='text-3xl md:text-4xl font-canela font-semibold text-white leading-tight'>
                      {recording.name}
                    </h1>
                    <div className='w-full h-[1px] bg-white/30' />
                  </div>

                  {/* Artist Link */}
                  {recording.artists && (
                    <button
                      onClick={() => navigate(`/artists/${recording.artists.id}`)}
                      className='flex items-center gap-3 p-3 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition-colors w-fit'
                    >
                      {recording.artists.image_url ? (
                        <img
                          src={recording.artists.image_url}
                          alt={recording.artists.name}
                          className='w-10 h-10 rounded-full object-cover'
                        />
                      ) : (
                        <div className='w-10 h-10 rounded-full bg-muted flex items-center justify-center'>
                          <User className='h-5 w-5 text-muted-foreground' />
                        </div>
                      )}
                      <div className='text-left'>
                        <p className='text-xs text-muted-foreground'>Artist</p>
                        <p className='font-medium'>{recording.artists.name}</p>
                      </div>
                    </button>
                  )}

                  {/* Type Badge and Rating Badge */}
                  <div className='flex items-center gap-3 flex-wrap'>
                    <div className='flex items-center gap-2'>
                      <Music2 className='h-4 w-4 text-fm-gold' />
                      <span className={`px-3 py-1 text-sm font-medium uppercase ${
                        recording.is_primary_dj_set
                          ? 'bg-fm-navy/20 text-fm-navy border border-fm-navy/30'
                          : 'bg-fm-gold/20 text-fm-gold border border-fm-gold/30'
                      }`}>
                        {recording.is_primary_dj_set ? 'DJ Set' : 'Track'}
                      </span>
                    </div>

                    {/* Rating Badge - Only visible to admins/developers */}
                    {canViewRatings && ratingStats && (
                      <div className='flex items-center gap-1.5 px-3 py-1 bg-fm-gold/20 border border-fm-gold/30'>
                        <Star className='h-4 w-4 fill-fm-gold text-fm-gold' />
                        <span className='text-sm font-medium text-fm-gold'>
                          {ratingStats.average_score.toFixed(1)}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          ({ratingStats.rating_count})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Duration if available */}
                  {recording.duration && (
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <Calendar className='h-4 w-4' />
                      <span className='text-sm'>Duration: {recording.duration}</span>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className='text-xs text-muted-foreground'>
                    Added: {new Date(recording.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Listen Button */}
              {recording.url && (
                <>
                  <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mt-6' />
                  <div className='mt-4'>
                    <FmRecordingLink
                      recordingId={recording.id}
                      url={recording.url}
                      className={`inline-flex items-center gap-2 px-6 py-3 font-medium transition-all duration-300 ${
                        recording.platform === 'spotify'
                          ? 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
                          : 'bg-[#FF5500] hover:bg-[#ff6a1a] text-white'
                      }`}
                    >
                      <PlatformIcon className='h-5 w-5' />
                      Listen on {recording.platform === 'spotify' ? 'Spotify' : 'SoundCloud'}
                      <ExternalLink className='h-4 w-4' />
                    </FmRecordingLink>
                  </div>
                </>
              )}
            </div>

            {/* Rating Section - Admin/Developer Only */}
            {canViewRatings && (
              <div className='mt-8 space-y-6'>
                <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />
                <h2 className='text-lg font-medium uppercase tracking-wide text-muted-foreground'>
                  {t('recordingRatings.internalRatings', 'Internal Ratings')}
                </h2>
                <FmRecordingRatingInput recordingId={recording.id} />
                <FmRecordingRatingsBreakdown recordingId={recording.id} />
              </div>
            )}
          </div>
        </div>
      )}
    </DetailPageWrapper>
  );
}