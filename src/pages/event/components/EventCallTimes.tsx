import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Music, ArrowRight, User, Disc, CheckCircle } from 'lucide-react';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonStackLayout } from '@/components/common/layout';
import { FmArtistRow, type FmArtistRowProps } from '@/components/artist/FmArtistRow';
import { Button } from '@/components/common/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmRecordingSearchDropdown } from '@/components/common/search/FmRecordingSearchDropdown';
import { useModalState, supabase, logger } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserArtist } from '@/components/profile/hooks/useUserArtist';

interface CallTimeArtist {
  id?: string;
  name: string;
  genre?: string;
  image?: string | null;
  callTime: string;
  roleLabel?: string;
}

interface EventCallTimesProps {
  callTimeLineup: CallTimeArtist[];
  onArtistSelect: (artist: FmArtistRowProps['artist']) => void;
  lookingForUndercard?: boolean;
  eventId?: string;
  className?: string;
  /** When true, hides set times (past events don't need to display schedules) */
  isPastEvent?: boolean;
}

/**
 * EventCallTimes - Displays the call times / lineup schedule
 *
 * Extracted from EventDetailsContent.tsx for better component organization.
 * Headliner is displayed first (at top) with emphasized styling.
 * Optionally displays a "Looking for Artists" prompt when enabled.
 */
export const EventCallTimes = ({
  callTimeLineup,
  onArtistSelect,
  lookingForUndercard = false,
  eventId,
  className = 'lg:col-span-2',
  isPastEvent = false,
}: EventCallTimesProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const applyModal = useModalState();
  const { user } = useAuth();
  const { linkedArtist } = useUserArtist();

  // State for the undercard request form
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);

  // Check if user has already submitted a request for this event
  const { data: existingRequest } = useQuery({
    queryKey: ['undercard-request', eventId, linkedArtist?.id],
    queryFn: async () => {
      if (!eventId || !linkedArtist?.id) return null;

      const { data, error } = await supabase
        .from('undercard_requests')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('artist_id', linkedArtist.id)
        .maybeSingle();

      if (error) {
        logger.error('Failed to check existing undercard request', {
          source: 'EventCallTimes',
          error: error.message,
          eventId,
          artistId: linkedArtist.id,
        });
        return null;
      }

      return data;
    },
    enabled: !!eventId && !!linkedArtist?.id,
  });

  // Fetch primary DJ set for autopopulation
  const { data: primaryDjSet } = useQuery({
    queryKey: ['artist-primary-dj-set', linkedArtist?.id],
    queryFn: async () => {
      if (!linkedArtist?.id) return null;

      const { data } = await supabase
        .from('artist_recordings')
        .select('id')
        .eq('artist_id', linkedArtist.id)
        .eq('is_primary_dj_set', true)
        .maybeSingle();

      return data?.id || null;
    },
    enabled: !!linkedArtist?.id,
  });

  // Autopopulate recording selection with primary DJ set
  useEffect(() => {
    if (primaryDjSet && !selectedRecordingId) {
      setSelectedRecordingId(primaryDjSet);
    }
  }, [primaryDjSet, selectedRecordingId]);

  // Mutation to submit undercard request
  const submitRequestMutation = useMutation({
    mutationFn: async () => {
      if (!eventId || !linkedArtist?.id) {
        throw new Error('Missing event or artist information');
      }

      const { error } = await supabase
        .from('undercard_requests')
        .insert({
          event_id: eventId,
          artist_id: linkedArtist.id,
          suggested_recording_id: selectedRecordingId,
          status: 'pending',
        } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tToast('undercardRequest.submitted'));
      queryClient.invalidateQueries({ queryKey: ['undercard-request', eventId, linkedArtist?.id] });
      applyModal.close();
    },
    onError: (error) => {
      logger.error('Failed to submit undercard request', {
        source: 'EventCallTimes',
        error: error instanceof Error ? error.message : String(error),
        eventId,
        artistId: linkedArtist?.id,
      });
      toast.error(tToast('undercardRequest.failed'));
    },
  });

  if (callTimeLineup.length === 0 && !lookingForUndercard) {
    return null;
  }

  // For past events, strip the callTime so set times aren't displayed
  const displayLineup = isPastEvent
    ? callTimeLineup.map(artist => ({ ...artist, callTime: '' }))
    : callTimeLineup;

  const handleSignUp = () => {
    applyModal.close();
    // Pass event_id so the registration can create an undercard request
    const url = eventId
      ? `/artists/register?event_id=${eventId}`
      : '/artists/register';
    navigate(url);
  };

  const handleSubmitRequest = () => {
    submitRequestMutation.mutate();
  };

  // Check if any artist has a call time set
  const hasCallTimes = callTimeLineup.some(artist => artist.callTime && artist.callTime.trim() !== '');

  // Use "Artists" for past events or when no call times, "Call Times" when schedule exists
  const sectionTitle = isPastEvent || !hasCallTimes
    ? t('undercardApplication.artists')
    : t('undercardApplication.callTimes');

  // Check if user has a linked artist
  const hasLinkedArtist = !!linkedArtist;
  const hasExistingRequest = !!existingRequest;

  return (
    <>
      <FmCommonCollapsibleSection
        title={sectionTitle}
        defaultExpanded={true}
        className={className}
      >
        <FmCommonStackLayout spacing='md'>
          {displayLineup.map((artist, index) => {
            const isHeadliner = artist.roleLabel === 'Headliner';
            return (
              <FmArtistRow
                key={`${artist.name}-${index}`}
                artist={artist}
                onSelect={onArtistSelect}
                variant={isHeadliner ? 'featured' : 'default'}
              />
            );
          })}

          {/* Looking for Artists Button */}
          {lookingForUndercard && (
            <div className='flex justify-center mt-4'>
              <Button
                variant='outline'
                onClick={applyModal.open}
                className='w-full py-1.5 px-4 border border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10 text-xs transition-all duration-300'
              >
                {t('undercardApplication.acceptingApplications')}
              </Button>
            </div>
          )}
        </FmCommonStackLayout>
      </FmCommonCollapsibleSection>

      {/* Looking for Artists Modal */}
      <Dialog open={applyModal.isOpen} onOpenChange={applyModal.setOpen}>
        <DialogContent className='max-w-md bg-background/95 backdrop-blur border border-border/60 p-0 overflow-hidden'>
          <DialogHeader className='px-6 pt-6 pb-4'>
            <DialogTitle className='font-canela text-xl flex items-center gap-2'>
              <Music className='h-5 w-5 text-fm-gold' />
              {t('undercardApplication.modalTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className='px-6 pb-6 space-y-4'>
            <p className='text-muted-foreground leading-relaxed'>
              {t('undercardApplication.modalDescription')}
            </p>

            {/* Show quick request option for users with linked artist */}
            {user && hasLinkedArtist && !hasExistingRequest && (
              <div className='p-4 bg-white/5 border border-white/20 space-y-4'>
                {/* Artist info header */}
                <div className='flex items-center gap-3'>
                  {linkedArtist.image_url ? (
                    <img
                      src={linkedArtist.image_url}
                      alt={linkedArtist.name}
                      className='w-10 h-10 object-cover'
                    />
                  ) : (
                    <div className='w-10 h-10 bg-white/10 flex items-center justify-center'>
                      <User className='h-5 w-5 text-white/50' />
                    </div>
                  )}
                  <div>
                    <p className='font-semibold text-white'>{linkedArtist.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {t('undercardApplication.requestingAs')}
                    </p>
                  </div>
                </div>

                {/* DJ Set suggestion dropdown */}
                <div className='space-y-2'>
                  <label className='text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                    <Disc className='h-3 w-3 text-fm-gold' />
                    {t('undercardApplication.suggestDjSet')}
                    <span className='text-muted-foreground/60'>
                      ({t('undercardApplication.optional')})
                    </span>
                  </label>
                  <FmRecordingSearchDropdown
                    artistId={linkedArtist.id}
                    value={selectedRecordingId}
                    onChange={(value) => setSelectedRecordingId(value)}
                    placeholder={t('undercardApplication.searchDjSets')}
                    djSetsOnly={true}
                  />
                  <p className='text-xs text-muted-foreground/70'>
                    {t('undercardApplication.djSetHint')}
                  </p>
                </div>

                {/* Submit button */}
                <Button
                  variant='outline'
                  onClick={handleSubmitRequest}
                  disabled={submitRequestMutation.isPending}
                  className='w-full border-fm-gold bg-fm-gold/10 text-fm-gold hover:bg-fm-gold/20'
                >
                  {submitRequestMutation.isPending
                    ? t('undercardApplication.submitting')
                    : t('undercardApplication.requestSlot')}
                </Button>
              </div>
            )}

            {/* Show success state if already requested */}
            {user && hasLinkedArtist && hasExistingRequest && (
              <div className='p-4 bg-green-500/10 border border-green-500/20 flex items-center gap-3'>
                <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0' />
                <div>
                  <p className='font-semibold text-green-400'>
                    {t('undercardApplication.alreadyRequested')}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {existingRequest.status === 'pending'
                      ? t('undercardApplication.requestPending')
                      : existingRequest.status === 'approved'
                        ? t('undercardApplication.requestApproved')
                        : t('undercardApplication.requestRejected')}
                  </p>
                </div>
              </div>
            )}

            {/* Show sign up option for users without artist profile */}
            {(!user || !hasLinkedArtist) && (
              <div className='p-4 bg-fm-gold/10 border border-fm-gold/20 rounded-none'>
                <h4 className='font-semibold text-fm-gold mb-2'>{t('undercardApplication.howToApply')}</h4>
                <ol className='text-sm text-muted-foreground space-y-2 list-decimal list-inside'>
                  <li>{t('undercardApplication.step1')}</li>
                  <li>{t('undercardApplication.step2')}</li>
                  <li>{t('undercardApplication.step3')}</li>
                </ol>
              </div>
            )}

            {/* Sign up button - only show for users without artist profile */}
            {(!user || !hasLinkedArtist) && (
              <>
                <Button
                  variant='outline'
                  onClick={handleSignUp}
                  className='w-full border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10'
                >
                  {t('undercardApplication.signUpAsArtist')}
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>

                <p className='text-xs text-center text-muted-foreground/70'>
                  {t('undercardApplication.alreadyHaveProfile')}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
