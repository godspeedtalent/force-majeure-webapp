import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';

import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import {
  FmOrganizationDetailsModal,
  type FmOrganizationDetailsModalProps,
} from '@/components/organization/FmOrganizationDetailsModal';
import { useEventPartners } from '@/shared/api/queries/organizationQueries';
import {
  cn,
  getPartnerImageSize,
  getPartnerIconSize,
  getPartnerTextSize,
  getPartnerMaxPerRow,
  PARTNER_IMPORTANCE,
} from '@/shared';

type Partner = ReturnType<typeof useEventPartners>['data'] extends
  | (infer T)[]
  | undefined
  ? T
  : never;

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

  // Group partners by importance level
  const partnersByImportance = useMemo(() => {
    const grouped = new Map<number, Partner[]>();
    partners.forEach(partner => {
      const importance = partner.importance ?? PARTNER_IMPORTANCE.LOW;
      if (!grouped.has(importance)) {
        grouped.set(importance, []);
      }
      grouped.get(importance)!.push(partner);
    });
    // Sort by importance descending (3, 2, 1)
    return Array.from(grouped.entries()).sort(([a], [b]) => b - a);
  }, [partners]);

  // Don't render if no partners
  if (partners.length === 0) {
    return null;
  }

  // Split partners into rows ensuring each row is filled
  const getRows = (items: Partner[], importance: number) => {
    const maxPerRow = getPartnerMaxPerRow(importance);
    const rows: Partner[][] = [];

    // Calculate optimal distribution to fill rows evenly
    const itemCount = items.length;
    if (itemCount <= maxPerRow) {
      // All items fit in one row
      rows.push(items);
    } else {
      // Distribute evenly across rows
      const numRows = Math.ceil(itemCount / maxPerRow);
      const basePerRow = Math.floor(itemCount / numRows);
      const remainder = itemCount % numRows;

      let index = 0;
      for (let row = 0; row < numRows; row++) {
        // Distribute remainder items to earlier rows
        const rowSize = basePerRow + (row < remainder ? 1 : 0);
        rows.push(items.slice(index, index + rowSize));
        index += rowSize;
      }
    }

    return rows;
  };

  return (
    <>
      <FmCommonCollapsibleSection
        title={t('eventDetails.partners')}
        defaultExpanded={true}
        className={cn('lg:col-span-2', className)}
      >
        <div className='flex flex-col gap-3'>
          {partnersByImportance.map(([importance, importancePartners]) => {
            const rows = getRows(importancePartners, importance);

            return (
              <div key={importance} className='flex flex-col gap-3'>
                {rows.map((rowPartners, rowIndex) => (
                  <div
                    key={`${importance}-${rowIndex}`}
                    className='grid gap-3'
                    style={{
                      gridTemplateColumns: `repeat(${rowPartners.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {rowPartners.map(partner => (
                      <button
                        key={partner.id}
                        type='button'
                        onClick={() => handleOrganizationClick(partner.organization)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3',
                          'border border-white/10 bg-white/5',
                          'hover:bg-white/10 hover:border-fm-gold/30',
                          'transition-all duration-200 cursor-pointer',
                          'group',
                          importance > PARTNER_IMPORTANCE.LOW && 'border-fm-gold/20 bg-fm-gold/5'
                        )}
                      >
                        {/* Profile picture */}
                        <div
                          className={cn(
                            'flex-shrink-0 overflow-hidden border border-white/15 bg-white/5 group-hover:border-fm-gold/30 transition-colors flex items-center justify-center',
                            getPartnerImageSize(importance)
                          )}
                        >
                          {partner.organization.profile_picture ? (
                            <img
                              src={partner.organization.profile_picture}
                              alt={partner.organization.name}
                              className='max-w-full max-h-full object-contain'
                            />
                          ) : (
                            <Building2 className={cn('text-white/30', getPartnerIconSize(importance))} />
                          )}
                        </div>

                        {/* Organization name */}
                        <span
                          className={cn(
                            'text-white/80 text-center line-clamp-2 group-hover:text-fm-gold transition-colors',
                            getPartnerTextSize(importance)
                          )}
                        >
                          {partner.organization.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
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
