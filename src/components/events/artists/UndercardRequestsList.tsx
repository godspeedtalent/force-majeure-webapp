/**
 * UndercardRequestsList Component
 *
 * Displays artist undercard requests for an event.
 * Shows pending requests from artists who signed up via the "Looking for Artists" link.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Music,
  MapPin,
  ExternalLink,
  Check,
  X,
  Clock,
  User,
} from 'lucide-react';
import { FaSpotify, FaSoundcloud, FaInstagram } from 'react-icons/fa6';
import { supabase } from '@/shared';
import { FormSection } from '@/components/common/forms/FormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { cn } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';

interface UndercardRequest {
  id: string;
  event_id: string;
  artist_registration_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_notes: string | null;
  created_at: string;
  artist_registration: {
    id: string;
    artist_name: string;
    bio: string;
    city: string;
    profile_image_url: string | null;
    instagram_handle: string | null;
    soundcloud_url: string | null;
    spotify_url: string | null;
    genres: string[];
    tracks: {
      name: string;
      url: string;
      cover_art: string | null;
      platform: string;
      recording_type: string;
    }[];
  };
}

interface UndercardRequestsListProps {
  eventId: string;
  className?: string;
}

export function UndercardRequestsList({
  eventId,
  className,
}: UndercardRequestsListProps) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch undercard requests for this event
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['undercard-requests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('undercard_requests' as any)
        .select(`
          id,
          event_id,
          artist_registration_id,
          status,
          reviewer_notes,
          created_at,
          artist_registration:artist_registrations (
            id,
            artist_name,
            bio,
            city,
            profile_image_url,
            instagram_handle,
            soundcloud_url,
            spotify_url,
            genres,
            tracks
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch undercard requests', { error, eventId });
        throw error;
      }

      return data as unknown as UndercardRequest[];
    },
  });

  // Mutation to update request status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: 'approved' | 'rejected';
    }) => {
      const { error } = await supabase
        .from('undercard_requests' as any)
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['undercard-requests', eventId] });
      toast.success(
        variables.status === 'approved'
          ? t('undercardRequests.requestApproved')
          : t('undercardRequests.requestRejected')
      );
    },
    onError: (error) => {
      logger.error('Failed to update undercard request', { error });
      toast.error(t('undercardRequests.updateFailed'));
    },
  });

  if (isLoading) {
    return (
      <FormSection title={t('undercardRequests.sectionTitle')}>
        <div className='flex items-center justify-center py-8'>
          <FmCommonLoadingSpinner size='md' />
          <span className='ml-3 text-muted-foreground'>{t('undercardRequests.loading')}</span>
        </div>
      </FormSection>
    );
  }

  if (error) {
    return (
      <FormSection title={t('undercardRequests.sectionTitle')}>
        <div className='text-center py-8 text-red-400'>
          {t('undercardRequests.loadFailed')}
        </div>
      </FormSection>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const reviewedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Pending Requests */}
      <FormSection
        title={t('undercardRequests.pendingTitle', { count: pendingRequests.length })}
      >
        <div className='space-y-3'>
          {pendingRequests.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground border-2 border-dashed border-white/10 rounded-lg'>
              <Music className='h-12 w-12 mx-auto mb-2 opacity-30' />
              <p>{t('undercardRequests.noPending')}</p>
              <p className='text-xs mt-1 opacity-70'>
                {t('undercardRequests.noPendingDescription')}
              </p>
            </div>
          ) : (
            pendingRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                isExpanded={expandedId === request.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === request.id ? null : request.id)
                }
                onApprove={() =>
                  updateStatusMutation.mutate({
                    requestId: request.id,
                    status: 'approved',
                  })
                }
                onReject={() =>
                  updateStatusMutation.mutate({
                    requestId: request.id,
                    status: 'rejected',
                  })
                }
                isUpdating={updateStatusMutation.isPending}
              />
            ))
          )}
        </div>
      </FormSection>

      {/* Reviewed Requests */}
      {reviewedRequests.length > 0 && (
        <FormSection title={t('undercardRequests.reviewedTitle', { count: reviewedRequests.length })}>
          <div className='space-y-3'>
            {reviewedRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                isExpanded={expandedId === request.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === request.id ? null : request.id)
                }
                isReviewed
              />
            ))}
          </div>
        </FormSection>
      )}
    </div>
  );
}

interface RequestCardProps {
  request: UndercardRequest;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isUpdating?: boolean;
  isReviewed?: boolean;
}

function RequestCard({
  request,
  isExpanded,
  onToggleExpand,
  onApprove,
  onReject,
  isUpdating,
  isReviewed,
}: RequestCardProps) {
  const { t } = useTranslation('common');
  const registration = request.artist_registration;
  const djSets = registration.tracks?.filter(
    track => track.recording_type === 'dj_set'
  ) || [];

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all duration-300',
        request.status === 'pending'
          ? 'border-fm-gold/30 bg-fm-gold/5'
          : request.status === 'approved'
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-red-500/30 bg-red-500/5'
      )}
    >
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className='w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors'
      >
        {/* Avatar */}
        <div className='w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-white/10'>
          {registration.profile_image_url ? (
            <img
              src={registration.profile_image_url}
              alt={registration.artist_name}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <User className='h-6 w-6 text-muted-foreground' />
            </div>
          )}
        </div>

        {/* Info */}
        <div className='flex-1 text-left'>
          <h4 className='font-semibold'>{registration.artist_name}</h4>
          <div className='flex items-center gap-3 text-sm text-muted-foreground'>
            {registration.city && (
              <span className='flex items-center gap-1'>
                <MapPin className='h-3 w-3' />
                {registration.city}
              </span>
            )}
            <span className='flex items-center gap-1'>
              <Clock className='h-3 w-3' />
              {new Date(request.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full',
            request.status === 'pending'
              ? 'bg-fm-gold/20 text-fm-gold'
              : request.status === 'approved'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          )}
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className='px-4 pb-4 space-y-4 border-t border-white/10'>
          {/* Bio */}
          <div className='pt-4'>
            <p className='text-sm text-muted-foreground line-clamp-3'>
              {registration.bio}
            </p>
          </div>

          {/* Social Links */}
          <div className='flex items-center gap-3'>
            {registration.instagram_handle && (
              <a
                href={`https://instagram.com/${registration.instagram_handle}`}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors'
              >
                <FaInstagram className='h-4 w-4' />
                @{registration.instagram_handle}
              </a>
            )}
            {registration.spotify_url && (
              <a
                href={registration.spotify_url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-[#1DB954] hover:opacity-80 transition-opacity'
              >
                <FaSpotify className='h-5 w-5' />
              </a>
            )}
            {registration.soundcloud_url && (
              <a
                href={registration.soundcloud_url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-[#FF5500] hover:opacity-80 transition-opacity'
              >
                <FaSoundcloud className='h-5 w-5' />
              </a>
            )}
          </div>

          {/* DJ Sets */}
          {djSets.length > 0 && (
            <div className='space-y-2'>
              <h5 className='text-xs uppercase text-muted-foreground'>
                {t('undercardRequests.djSets', { count: djSets.length })}
              </h5>
              <div className='space-y-2'>
                {djSets.map((track, idx) => (
                  <a
                    key={idx}
                    href={track.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 transition-colors'
                  >
                    {track.cover_art && (
                      <img
                        src={track.cover_art}
                        alt={track.name}
                        className='w-10 h-10 object-cover'
                      />
                    )}
                    <span className='flex-1 text-sm truncate'>{track.name}</span>
                    <ExternalLink className='h-4 w-4 text-muted-foreground' />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isReviewed && onApprove && onReject && (
            <div className='flex gap-3 pt-2'>
              <FmCommonButton
                onClick={onApprove}
                variant='default'
                icon={Check}
                disabled={isUpdating}
                className='flex-1 bg-green-600 hover:bg-green-700'
              >
                {t('undercardRequests.approve')}
              </FmCommonButton>
              <FmCommonButton
                onClick={onReject}
                variant='secondary'
                icon={X}
                disabled={isUpdating}
                className='flex-1'
              >
                {t('undercardRequests.reject')}
              </FmCommonButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
