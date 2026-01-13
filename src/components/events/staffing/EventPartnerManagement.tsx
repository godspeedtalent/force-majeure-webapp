import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Handshake,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import { FmOrganizationSearchDropdown } from '@/components/common/search/FmOrganizationSearchDropdown';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Label } from '@/components/common/shadcn/label';
import { useEventPartners } from './hooks/useEventPartners';
import { cn } from '@/shared';

interface EventPartnerManagementProps {
  eventId: string;
  /** Whether to show partners on the event page (controlled externally) */
  showPartners: boolean;
  /** Callback when show partners toggle changes */
  onShowPartnersChange: (value: boolean) => void;
}

export const EventPartnerManagement = ({
  eventId,
  showPartners,
  onShowPartnersChange,
}: EventPartnerManagementProps) => {
  const { t } = useTranslation('common');

  const {
    partners,
    isLoading,
    addPartner,
    removePartner,
    togglePartnerVisibility,
    isAdding,
  } = useEventPartners(eventId);

  // Add partner form state
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const handleAddPartner = () => {
    if (selectedOrgId) {
      addPartner(
        { organizationId: selectedOrgId },
        {
          onSuccess: () => {
            setSelectedOrgId('');
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-32'>
        <p className='text-muted-foreground'>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Display Settings Section */}
      <FmFormSection
        title={t('partners.displaySettings')}
        description={t('partners.displaySettingsDescription')}
        icon={Eye}
      >
        <div className='flex items-center gap-3 p-4 rounded-none border border-border bg-card'>
          <Handshake className='h-5 w-5 text-fm-gold' />
          <div className='flex-1'>
            <Label htmlFor='show-partners' className='cursor-pointer font-medium'>
              {t('partners.showOnEventPage')}
            </Label>
            <p className='text-xs text-muted-foreground mt-1'>
              {t('partners.showOnEventPageDescription')}
            </p>
          </div>
          <FmCommonToggle
            id='show-partners'
            label={t('partners.showOnEventPage')}
            checked={showPartners}
            onCheckedChange={onShowPartnersChange}
            hideLabel
          />
        </div>
      </FmFormSection>

      {/* Add Partner Section */}
      <FmFormSection
        title={t('partners.addPartner')}
        description={t('partners.addPartnerDescription')}
        icon={Plus}
      >
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4'>
            <FmOrganizationSearchDropdown
              value={selectedOrgId}
              onChange={value => setSelectedOrgId(value)}
              placeholder={t('partners.searchOrg')}
            />
            <FmCommonButton
              variant='gold'
              icon={Plus}
              onClick={handleAddPartner}
              disabled={!selectedOrgId}
              loading={isAdding}
            >
              {t('partners.addToEvent')}
            </FmCommonButton>
          </div>
        </div>
      </FmFormSection>

      {/* Partners List */}
      <FmFormSection
        title={t('partners.title')}
        description={t('partners.listDescription')}
        icon={Handshake}
      >
        {partners.length === 0 ? (
          <div className='text-center py-12 border border-dashed border-white/20'>
            <Handshake className='h-12 w-12 mx-auto text-muted-foreground/50 mb-4' />
            <p className='text-muted-foreground'>{t('partners.noPartners')}</p>
            <p className='text-sm text-muted-foreground/70 mt-1'>
              {t('partners.noPartnersHint')}
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            {partners.map((partner, index) => {
              const org = partner.organization;
              const isHidden = partner.is_hidden;

              return (
                <div
                  key={partner.id}
                  className={cn(
                    'flex items-center justify-between p-4 border transition-colors',
                    index % 2 === 0 ? 'bg-background/40' : 'bg-background/60',
                    isHidden && 'opacity-60'
                  )}
                >
                  {/* Partner Info */}
                  <div className='flex items-center gap-4'>
                    {/* Drag Handle (future: implement drag-to-reorder) */}
                    <div className='text-muted-foreground/30 cursor-grab'>
                      <GripVertical className='h-5 w-5' />
                    </div>

                    {/* Avatar */}
                    {org?.profile_picture ? (
                      <img
                        src={org.profile_picture}
                        alt={org.name}
                        className='w-10 h-10 rounded-full object-cover'
                      />
                    ) : (
                      <div className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center'>
                        <Building2 className='h-5 w-5 text-white/50' />
                      </div>
                    )}

                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium'>{org?.name || t('partners.unknown')}</p>
                        {isHidden && (
                          <span className='text-xs text-muted-foreground bg-white/10 px-2 py-0.5'>
                            {t('partners.hiddenBadge')}
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {t('partners.addedOn', {
                          date: new Date(partner.created_at).toLocaleDateString(),
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-3'>
                    <FmPortalTooltip
                      content={isHidden ? t('partners.showPartner') : t('partners.hidePartner')}
                    >
                      <FmCommonIconButton
                        variant='secondary'
                        icon={isHidden ? EyeOff : Eye}
                        onClick={() =>
                          togglePartnerVisibility({
                            partnerId: partner.id,
                            isHidden: !isHidden,
                          })
                        }
                        aria-label={isHidden ? t('partners.showPartner') : t('partners.hidePartner')}
                      />
                    </FmPortalTooltip>
                    <FmPortalTooltip content={t('partners.remove')}>
                      <FmCommonIconButton
                        variant='destructive'
                        icon={Trash2}
                        onClick={() => setRemoveConfirm(partner.id)}
                        aria-label={t('partners.remove')}
                      />
                    </FmPortalTooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FmFormSection>

      {/* Remove Confirmation */}
      <FmCommonConfirmDialog
        open={!!removeConfirm}
        onOpenChange={open => !open && setRemoveConfirm(null)}
        title={t('partners.removeTitle')}
        description={t('partners.removeConfirm')}
        confirmText={t('partners.remove')}
        onConfirm={() => {
          if (removeConfirm) {
            removePartner(removeConfirm);
            setRemoveConfirm(null);
          }
        }}
        variant='destructive'
      />
    </div>
  );
};
