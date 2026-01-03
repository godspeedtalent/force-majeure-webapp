/**
 * ArtistRegistrationModals
 *
 * All modal dialogs for artist registration management:
 * - Details modal
 * - Approve confirmation
 * - Deny confirmation
 * - Delete confirmation
 */

import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons';
import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { ArtistRegistration } from '../hooks/useArtistRegistrations';

// ============================================================================
// Details Modal
// ============================================================================

interface DetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: ArtistRegistration | null;
  onApprove: (registration: ArtistRegistration) => void;
  onDeny: (registration: ArtistRegistration) => void;
}

export function ArtistRegistrationDetailsModal({
  open,
  onOpenChange,
  registration,
  onApprove,
  onDeny,
}: DetailsModalProps) {
  const { t } = useTranslation('common');

  if (!registration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='font-canela text-2xl'>
            {registration.artist_name}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Profile Image and Basic Info */}
          <div className='flex gap-6'>
            {registration.profile_image_url && (
              <img
                src={registration.profile_image_url}
                alt={registration.artist_name}
                className='w-32 h-32 object-cover border border-white/20'
              />
            )}
            <div className='flex-1 space-y-2'>
              <div>
                <span className='text-xs uppercase text-muted-foreground'>{t('labels.email')}</span>
                <p>{registration.email || '—'}</p>
              </div>
              <div>
                <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.city')}</span>
                <p>
                  {registration.city
                    ? `${registration.city.name}, ${registration.city.state}`
                    : '—'}
                </p>
              </div>
              <div>
                <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.status')}</span>
                <p className='capitalize'>{registration.status}</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.bio')}</span>
            <p className='mt-1 text-sm whitespace-pre-wrap'>{registration.bio || '—'}</p>
          </div>

          {/* Genres */}
          {registration.genres && registration.genres.length > 0 && (
            <div>
              <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.genres')}</span>
              <div className='flex flex-wrap gap-2 mt-1'>
                {registration.genres.map((genre, i) => (
                  <span
                    key={i}
                    className='px-2 py-1 text-xs bg-fm-gold/10 text-fm-gold border border-fm-gold/30'
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          <div>
            <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.socials')}</span>
            <div className='mt-2'>
              <FmSocialLinks
                instagram={registration.instagram_handle}
                soundcloud={registration.soundcloud_url}
                spotify={registration.spotify_url}
                tiktok={registration.tiktok_handle}
                size='md'
                gap='md'
              />
            </div>
          </div>

          {/* Performance History */}
          <div className='space-y-4 border-t border-white/10 pt-4'>
            <h3 className='text-sm font-medium uppercase text-muted-foreground'>
              {t('artistRegistrations.performanceHistory')}
            </h3>

            {registration.paid_show_count_group && (
              <div>
                <span className='text-xs uppercase text-muted-foreground'>
                  {t('artistRegistrations.paidShows')}
                </span>
                <p className='mt-1 text-sm'>{registration.paid_show_count_group}</p>
              </div>
            )}

            {registration.talent_differentiator && (
              <div>
                <span className='text-xs uppercase text-muted-foreground'>
                  {t('artistRegistrations.talentDifferentiator')}
                </span>
                <p className='mt-1 text-sm'>{registration.talent_differentiator}</p>
              </div>
            )}

            {registration.crowd_sources && (
              <div>
                <span className='text-xs uppercase text-muted-foreground'>
                  {t('artistRegistrations.crowdSources')}
                </span>
                <p className='mt-1 text-sm'>{registration.crowd_sources}</p>
              </div>
            )}
          </div>

          {/* Press Images */}
          {registration.press_images && registration.press_images.length > 0 && (
            <div className='border-t border-white/10 pt-4'>
              <span className='text-xs uppercase text-muted-foreground'>
                {t('artistRegistrations.pressImages')}
              </span>
              <div className='flex gap-2 mt-2'>
                {registration.press_images.map((url, i) => (
                  <a key={i} href={url} target='_blank' rel='noopener noreferrer'>
                    <img
                      src={url}
                      alt={`Press ${i + 1}`}
                      className='w-20 h-20 object-cover border border-white/20 hover:border-fm-gold/50 transition-colors'
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Review Notes (if reviewed) */}
          {registration.reviewer_notes && (
            <div className='border-t border-white/10 pt-4'>
              <span className='text-xs uppercase text-muted-foreground'>
                {t('artistRegistrations.reviewerNotes')}
              </span>
              <p className='mt-1 text-sm'>{registration.reviewer_notes}</p>
            </div>
          )}

          {/* Action Buttons for Pending */}
          {registration.status === 'pending' && (
            <div className='flex gap-4 border-t border-white/10 pt-4'>
              <FmCommonButton
                onClick={() => {
                  onOpenChange(false);
                  onApprove(registration);
                }}
                className='flex-1'
                icon={Check}
              >
                {t('artistRegistrations.approve')}
              </FmCommonButton>
              <FmCommonButton
                onClick={() => {
                  onOpenChange(false);
                  onDeny(registration);
                }}
                variant='destructive'
                className='flex-1'
                icon={X}
              >
                {t('artistRegistrations.deny')}
              </FmCommonButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Approve Confirmation Modal
// ============================================================================

interface ApproveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: ArtistRegistration | null;
  reviewerNotes: string;
  onReviewerNotesChange: (notes: string) => void;
  onConfirm: () => void;
}

export function ArtistRegistrationApproveModal({
  open,
  onOpenChange,
  registration,
  reviewerNotes,
  onReviewerNotesChange,
  onConfirm,
}: ApproveModalProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          onReviewerNotesChange('');
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('artistRegistrations.confirmApprove')}</DialogTitle>
          <DialogDescription>
            {t('artistRegistrations.confirmApproveDescription', {
              name: registration?.artist_name,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className='mt-4'>
          <label className='text-xs uppercase text-muted-foreground'>
            {t('artistRegistrations.reviewerNotes')} ({t('labels.optional')})
          </label>
          <textarea
            value={reviewerNotes}
            onChange={(e) => onReviewerNotesChange(e.target.value)}
            className='w-full mt-1 p-3 bg-white/5 border border-white/20 text-foreground text-sm resize-none focus:border-fm-gold/50 focus:outline-none'
            rows={3}
            placeholder={t('artistRegistrations.notesPlaceholder')}
          />
        </div>
        <DialogFooter className='mt-4'>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange(false);
              onReviewerNotesChange('');
            }}
          >
            {t('buttons.cancel')}
          </Button>
          <Button onClick={onConfirm}>
            {t('artistRegistrations.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Deny Confirmation Modal
// ============================================================================

interface DenyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: ArtistRegistration | null;
  reviewerNotes: string;
  onReviewerNotesChange: (notes: string) => void;
  onConfirm: () => void;
}

export function ArtistRegistrationDenyModal({
  open,
  onOpenChange,
  registration,
  reviewerNotes,
  onReviewerNotesChange,
  onConfirm,
}: DenyModalProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          onReviewerNotesChange('');
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('artistRegistrations.confirmDeny')}</DialogTitle>
          <DialogDescription>
            {t('artistRegistrations.confirmDenyDescription', {
              name: registration?.artist_name,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className='mt-4'>
          <label className='text-xs uppercase text-muted-foreground'>
            {t('artistRegistrations.reviewerNotes')} ({t('labels.optional')})
          </label>
          <textarea
            value={reviewerNotes}
            onChange={(e) => onReviewerNotesChange(e.target.value)}
            className='w-full mt-1 p-3 bg-white/5 border border-white/20 text-foreground text-sm resize-none focus:border-fm-gold/50 focus:outline-none'
            rows={3}
            placeholder={t('artistRegistrations.denyNotesPlaceholder')}
          />
        </div>
        <DialogFooter className='mt-4'>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange(false);
              onReviewerNotesChange('');
            }}
          >
            {t('buttons.cancel')}
          </Button>
          <Button variant='destructive' onClick={onConfirm}>
            {t('artistRegistrations.deny')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Delete Confirmation Modal
// ============================================================================

interface DeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: ArtistRegistration | null;
  onConfirm: () => void;
}

export function ArtistRegistrationDeleteModal({
  open,
  onOpenChange,
  registration,
  onConfirm,
}: DeleteModalProps) {
  const { t } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('artistRegistrations.confirmDelete')}</DialogTitle>
          <DialogDescription className='space-y-3'>
            <p>
              {t('artistRegistrations.confirmDeleteDescription', {
                name: registration?.artist_name,
              })}
            </p>
            <div className='mt-4 p-3 bg-white/5 border border-white/20 space-y-2'>
              <p className='text-sm font-medium text-foreground'>
                {t('artistRegistrations.deleteVsDenyTitle')}
              </p>
              <ul className='text-sm space-y-1'>
                <li>
                  <span className='text-red-400 font-medium'>{t('artistRegistrations.deny')}:</span>{' '}
                  {t('artistRegistrations.denyExplanation')}
                </li>
                <li>
                  <span className='text-red-400 font-medium'>{t('artistRegistrations.delete')}:</span>{' '}
                  {t('artistRegistrations.deleteExplanation')}
                </li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='mt-4'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            {t('buttons.cancel')}
          </Button>
          <Button variant='destructive' onClick={onConfirm}>
            {t('artistRegistrations.deletePermanently')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
