import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';

import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import {
  FmOrganizationDetailsModal,
  type FmOrganizationDetailsModalProps,
} from '@/components/organization/FmOrganizationDetailsModal';
import { useEventPartners } from '@/shared/api/queries/organizationQueries';
import { cn } from '@/shared';

interface EventPartnersProps {
  eventId: string;
  canManage?: boolean;
  onManageOrganization?: (organizationId: string) => void;
  className?: string;
}

export const EventPartners = ({
  eventId,
  canManage = false,
  onManageOrganization,
  className,
}: EventPartnersProps) => {
  const { t } = useTranslation('pages');
  const { data: partners = [] } = useEventPartners(eventId);

  const [selectedOrganization, setSelectedOrganization] =
    useState<FmOrganizationDetailsModalProps['organization']>(null);
  const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false);

  const handleOrganizationClick = useCallback(
    (org: { id: string; name: string; profile_picture?: string | null }) => {
      setSelectedOrganization({
        id: org.id,
        name: org.name,
        profile_picture: org.profile_picture,
      });
      setIsOrganizationModalOpen(true);
    },
    []
  );

  const handleOrganizationModalChange = useCallback((open: boolean) => {
    setIsOrganizationModalOpen(open);
    if (!open) {
      setSelectedOrganization(null);
    }
  }, []);

  const handleManageOrganization = useCallback(
    (organizationId: string) => {
      setIsOrganizationModalOpen(false);
      onManageOrganization?.(organizationId);
    },
    [onManageOrganization]
  );

  // Don't render if no partners
  if (partners.length === 0) {
    return null;
  }

  return (
    <>
      <FmCommonCollapsibleSection
        title={t('eventDetails.partners')}
        defaultExpanded={true}
        className={cn('lg:col-span-2', className)}
      >
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
          {partners.map(partner => (
            <button
              key={partner.id}
              type='button'
              onClick={() => handleOrganizationClick(partner.organization)}
              className={cn(
                'flex flex-col items-center gap-2 p-3',
                'border border-white/10 bg-white/5',
                'hover:bg-white/10 hover:border-fm-gold/30',
                'transition-all duration-200 cursor-pointer',
                'group'
              )}
            >
              {/* Profile picture */}
              <div className='w-12 h-12 flex-shrink-0 overflow-hidden border border-white/15 bg-white/5 group-hover:border-fm-gold/30 transition-colors'>
                {partner.organization.profile_picture ? (
                  <img
                    src={partner.organization.profile_picture}
                    alt={partner.organization.name}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Building2 className='h-6 w-6 text-white/30' />
                  </div>
                )}
              </div>

              {/* Organization name */}
              <span className='text-xs text-white/80 text-center line-clamp-2 group-hover:text-fm-gold transition-colors'>
                {partner.organization.name}
              </span>
            </button>
          ))}
        </div>
      </FmCommonCollapsibleSection>

      <FmOrganizationDetailsModal
        organization={selectedOrganization}
        open={isOrganizationModalOpen}
        onOpenChange={handleOrganizationModalChange}
        canManage={canManage}
        onManage={handleManageOrganization}
      />
    </>
  );
};
