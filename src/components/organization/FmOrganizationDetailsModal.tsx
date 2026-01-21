import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Settings, X, Building2 } from 'lucide-react';

import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { useOrganizationById } from '@/shared/api/queries/organizationQueries';

export interface FmOrganizationDetailsModalProps {
  organization: {
    id?: string;
    name: string;
    profile_picture?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  onManage?: (organizationId: string) => void;
}

export const FmOrganizationDetailsModal = ({
  organization,
  open,
  onOpenChange,
  canManage = false,
  onManage,
}: FmOrganizationDetailsModalProps) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  // Fetch full organization data when modal is open and we have an ID
  const { data: fullOrganization, isLoading } = useOrganizationById(
    open && organization?.id ? organization.id : undefined
  );

  const handleViewDetails = () => {
    if (organization?.id) {
      onOpenChange(false);
      navigate(`/admin/organizations/${organization.id}`);
    }
  };

  const handleManage = () => {
    if (organization?.id) {
      onOpenChange(false);
      if (onManage) {
        onManage(organization.id);
      } else {
        navigate(`/organizations/${organization.id}/manage`);
      }
    }
  };

  // Use full data if available, fallback to passed prop
  const displayData = fullOrganization || organization;
  const profilePicture = displayData?.profile_picture;

  // Check if organization has any social links (only from full data)
  const hasSocialLinks = fullOrganization && (
    fullOrganization.website ||
    fullOrganization.social_email ||
    fullOrganization.instagram_handle ||
    fullOrganization.facebook_url ||
    fullOrganization.youtube_url ||
    fullOrganization.tiktok_handle ||
    fullOrganization.twitter_handle
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg max-h-[90vh] p-0 gap-0 border border-white/20 bg-background/95 backdrop-blur-xl overflow-hidden flex flex-col'>
        <DialogTitle className='sr-only'>
          {organization?.name ?? t('organizationDetails.defaultTitle')}
        </DialogTitle>

        {/* Sticky header bar */}
        <div className='sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-background/95 backdrop-blur-sm'>
          <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela'>
            {t('organizationDetails.partner')}
          </p>
          <div className='flex items-center gap-2'>
            {canManage && organization?.id && (
              <FmPortalTooltip content={t('organizationDetails.manage')} side='bottom'>
                <FmCommonIconButton
                  icon={Settings}
                  onClick={handleManage}
                  variant='secondary'
                  size='sm'
                  aria-label={t('organizationDetails.manage')}
                  className='bg-white/10 text-white hover:bg-white/20 hover:text-fm-gold'
                />
              </FmPortalTooltip>
            )}
            <FmCommonIconButton
              icon={X}
              onClick={() => onOpenChange(false)}
              variant='secondary'
              size='sm'
              aria-label={t('common.close')}
              className='bg-white/10 text-white hover:bg-white/20'
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className='flex-1 overflow-y-auto'>
          {isLoading && organization?.id ? (
            <div className='flex items-center justify-center py-20'>
              <FmCommonLoadingSpinner size='lg' />
            </div>
          ) : displayData ? (
            <div className='p-6'>
              {/* Organization content */}
              <div className='flex gap-6'>
                {/* Profile picture */}
                <div className='w-24 h-24 flex-shrink-0 overflow-hidden border border-white/15 bg-white/5'>
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={displayData.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center bg-white/5'>
                      <Building2 className='h-10 w-10 text-white/30' />
                    </div>
                  )}
                </div>

                {/* Organization info */}
                <div className='flex-1 flex flex-col justify-center'>
                  <h2 className='text-2xl font-canela font-semibold text-white leading-tight mb-2'>
                    {displayData.name}
                  </h2>
                  <p className='text-sm text-white/60'>
                    {t('organizationDetails.eventPartner')}
                  </p>
                </div>
              </div>

              {/* Social Links */}
              {hasSocialLinks && fullOrganization && (
                <>
                  <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-fm-gold/40 to-transparent mt-6' />
                  <div className='mt-4'>
                    <FmSocialLinks
                      email={fullOrganization.social_email}
                      website={fullOrganization.website}
                      instagram={fullOrganization.instagram_handle}
                      facebook={fullOrganization.facebook_url}
                      youtube={fullOrganization.youtube_url}
                      tiktok={fullOrganization.tiktok_handle}
                      twitter={fullOrganization.twitter_handle}
                      size='md'
                      gap='sm'
                    />
                  </div>
                </>
              )}

              {/* Divider */}
              <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mt-6 mb-4' />

              {/* Actions */}
              {organization?.id && (
                <div className='flex justify-end'>
                  <FmCommonButton
                    variant='secondary'
                    size='sm'
                    icon={ArrowRight}
                    iconPosition='right'
                    onClick={handleViewDetails}
                    className='bg-white/10 text-white hover:bg-white/20 hover:text-fm-gold'
                  >
                    {t('organizationDetails.viewProfile')}
                  </FmCommonButton>
                </div>
              )}
            </div>
          ) : (
            <div className='flex items-center justify-center py-20 text-muted-foreground'>
              {t('organizationDetails.defaultDescription')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
