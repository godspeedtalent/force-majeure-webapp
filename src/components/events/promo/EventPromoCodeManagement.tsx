import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tag,
  Plus,
  Link2,
  Trash2,
  Unlink,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Globe,
  Calendar,
  Ticket,
  Layers,
  Ban,
  ShoppingCart,
} from 'lucide-react';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import { PromoCodeFormModal } from './PromoCodeFormModal';
import { useEventPromoCodes } from './hooks/useEventPromoCodes';
import { useEventTicketTiers } from '@/components/events/ticketing/hooks/useEventTicketTiers';
import {
  formatDiscount,
  getPromoCodeStatus,
  type PromoCodeWithScope,
  type CreatePromoCodeInput,
  type UpdatePromoCodeInput,
} from '@/shared/types/promoCode';
import { cn } from '@/shared';
import { NO_GROUP_ID } from '@/components/events/ticketing/ticket-group-manager/constants';

interface EventPromoCodeManagementProps {
  eventId: string;
}

export const EventPromoCodeManagement = ({ eventId }: EventPromoCodeManagementProps) => {
  const { t } = useTranslation('common');

  const {
    eventCodes,
    availableToLink,
    allCodes,
    isLoading,
    createPromoCode,
    updatePromoCode,
    linkPromoCode,
    unlinkPromoCode,
    togglePromoCodeActive,
    deletePromoCode,
    isCreating,
    isUpdating,
  } = useEventPromoCodes(eventId);

  // Get ticket groups and tiers for scope selection
  const { groups: ticketGroupsData } = useEventTicketTiers(eventId);

  // Transform ticket groups for the modal
  const ticketGroups = useMemo(() =>
    ticketGroupsData
      .filter(g => g.id !== NO_GROUP_ID)
      .map(g => ({
        id: g.id,
        name: g.name,
        color: g.color,
      })),
    [ticketGroupsData]
  );

  // Flatten tiers for the modal
  const ticketTiers = useMemo(() =>
    ticketGroupsData.flatMap(g =>
      g.tiers.map(tier => ({
        id: tier.id,
        name: tier.name,
        groupName: g.id !== NO_GROUP_ID ? g.name : undefined,
      }))
    ),
    [ticketGroupsData]
  );

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCodeWithScope | null>(null);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Helper to find full code with scope data from allCodes
  const findCodeWithScope = (codeId: string): PromoCodeWithScope | undefined =>
    allCodes.find(c => c.id === codeId);

  const handleCreateOrUpdate = (data: CreatePromoCodeInput | UpdatePromoCodeInput) => {
    if ('id' in data) {
      updatePromoCode(data, {
        onSuccess: () => {
          setEditingCode(null);
        },
      });
    } else {
      createPromoCode(data, {
        onSuccess: () => {
          setShowCreateModal(false);
        },
      });
    }
  };

  const handleLink = (promoCodeId: string) => {
    linkPromoCode(promoCodeId);
    setShowLinkDropdown(false);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <p className='text-muted-foreground'>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <FmFormSection
        title={t('promoCodes.title')}
        description={t('promoCodes.description')}
        icon={Tag}
      >
        {/* Actions Bar */}
        <div className='flex flex-wrap gap-3 mb-4'>
          <FmCommonButton
            variant='gold'
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            {t('promoCodes.createNew')}
          </FmCommonButton>

          {/* Link Existing Code Dropdown */}
          <div className='relative'>
            <FmCommonButton
              variant='default'
              icon={Link2}
              onClick={() => setShowLinkDropdown(!showLinkDropdown)}
              disabled={availableToLink.length === 0}
            >
              {t('promoCodes.linkGlobal')}
            </FmCommonButton>

            {showLinkDropdown && availableToLink.length > 0 && (
              <>
                {/* Backdrop */}
                <div
                  className='fixed inset-0 z-40'
                  onClick={() => setShowLinkDropdown(false)}
                />
                {/* Dropdown */}
                <div className='absolute top-full left-0 mt-2 w-64 z-50 bg-background/95 backdrop-blur-xl border border-white/20 shadow-xl'>
                  <div className='p-2 border-b border-white/10'>
                    <p className='text-xs text-muted-foreground uppercase'>
                      {t('promoCodes.availableCodes')}
                    </p>
                  </div>
                  <div className='max-h-64 overflow-y-auto'>
                    {availableToLink.map(code => (
                      <button
                        key={code.id}
                        onClick={() => handleLink(code.id)}
                        className='w-full flex items-center justify-between p-3 hover:bg-fm-gold/10 transition-colors text-left'
                      >
                        <div>
                          <p className='font-medium'>{code.code}</p>
                          <p className='text-xs text-muted-foreground'>
                            {formatDiscount(code.discount_type, code.discount_value)}
                            {code.is_global && (
                              <span className='ml-2 text-fm-gold'>
                                <Globe className='inline h-3 w-3 mr-1' />
                                {t('promoCodes.global')}
                              </span>
                            )}
                          </p>
                        </div>
                        <Link2 className='h-4 w-4 text-muted-foreground' />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Codes List */}
        {eventCodes.length === 0 ? (
          <div className='text-center py-12 border border-dashed border-white/20'>
            <Tag className='h-12 w-12 mx-auto text-muted-foreground/50 mb-4' />
            <p className='text-muted-foreground'>{t('promoCodes.noCodes')}</p>
            <p className='text-sm text-muted-foreground/70 mt-1'>
              {t('promoCodes.noCodesHint')}
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            {eventCodes.map((eventCode, index) => {
              const code = eventCode.promo_codes;
              if (!code) return null;

              const status = getPromoCodeStatus(code);
              const isExpired = status === 'expired';
              const codeWithScope = findCodeWithScope(code.id);

              return (
                <div
                  key={eventCode.id}
                  className={cn(
                    'flex items-center justify-between p-4 border transition-colors',
                    index % 2 === 0 ? 'bg-background/40' : 'bg-background/60',
                    isExpired && 'opacity-60'
                  )}
                >
                  {/* Code Info */}
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center justify-center w-10 h-10 bg-fm-gold/20 border border-fm-gold/40'>
                      <Tag className='h-5 w-5 text-fm-gold' />
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium font-mono text-lg'>{code.code}</p>
                        {/* Status Badge */}
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs uppercase',
                            status === 'active' && 'bg-green-500/20 text-green-400 border border-green-500/40',
                            status === 'inactive' && 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
                            status === 'expired' && 'bg-red-500/20 text-red-400 border border-red-500/40'
                          )}
                        >
                          {t(`promoCodes.${status}`)}
                        </span>
                        {/* Scope Badge */}
                        {codeWithScope && (
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs uppercase flex items-center gap-1',
                              codeWithScope.application_scope === 'disabled'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : 'bg-white/10 text-muted-foreground border border-white/20'
                            )}
                          >
                            {codeWithScope.application_scope === 'all_tickets' && <Ticket className='h-3 w-3' />}
                            {codeWithScope.application_scope === 'specific_groups' && <Layers className='h-3 w-3' />}
                            {codeWithScope.application_scope === 'specific_tiers' && <Ticket className='h-3 w-3' />}
                            {codeWithScope.application_scope === 'disabled' && <Ban className='h-3 w-3' />}
                            {t(`promoCodes.scope.${codeWithScope.application_scope}`)}
                          </span>
                        )}
                        {/* Order-level badge */}
                        {codeWithScope?.applies_to_order && (
                          <span className='px-2 py-0.5 text-xs uppercase flex items-center gap-1 bg-fm-gold/20 text-fm-gold border border-fm-gold/40'>
                            <ShoppingCart className='h-3 w-3' />
                            {t('promoCodes.orderLevel')}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                        <span>{formatDiscount(code.discount_type, code.discount_value)}</span>
                        {code.expires_at && (
                          <span className='flex items-center gap-1'>
                            <Calendar className='h-3 w-3' />
                            {new Date(code.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-2'>
                    {/* Toggle Active */}
                    <FmPortalTooltip
                      content={code.is_active ? t('promoCodes.deactivate') : t('promoCodes.activate')}
                    >
                      <FmCommonIconButton
                        variant='secondary'
                        icon={code.is_active ? ToggleRight : ToggleLeft}
                        onClick={() => togglePromoCodeActive({ id: code.id, isActive: !code.is_active })}
                        className={code.is_active ? 'text-green-400' : 'text-muted-foreground'}
                        aria-label={code.is_active ? t('promoCodes.deactivate') : t('promoCodes.activate')}
                      />
                    </FmPortalTooltip>

                    {/* Edit */}
                    <FmPortalTooltip content={t('buttons.edit')}>
                      <FmCommonIconButton
                        variant='secondary'
                        icon={Pencil}
                        onClick={() => setEditingCode(codeWithScope || null)}
                        aria-label={t('buttons.edit')}
                      />
                    </FmPortalTooltip>

                    {/* Unlink from event */}
                    <FmPortalTooltip content={t('promoCodes.unlink')}>
                      <FmCommonIconButton
                        variant='secondary'
                        icon={Unlink}
                        onClick={() => setUnlinkConfirm(eventCode.id)}
                        aria-label={t('promoCodes.unlink')}
                      />
                    </FmPortalTooltip>

                    {/* Delete entirely */}
                    <FmPortalTooltip content={t('buttons.delete')}>
                      <FmCommonIconButton
                        variant='destructive'
                        icon={Trash2}
                        onClick={() => setDeleteConfirm(code.id)}
                        aria-label={t('buttons.delete')}
                      />
                    </FmPortalTooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FmFormSection>

      {/* Create Modal */}
      <PromoCodeFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={isCreating}
        eventId={eventId}
        ticketGroups={ticketGroups}
        ticketTiers={ticketTiers}
      />

      {/* Edit Modal */}
      <PromoCodeFormModal
        open={!!editingCode}
        onOpenChange={open => !open && setEditingCode(null)}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={isUpdating}
        editingCode={editingCode}
        eventId={eventId}
        ticketGroups={ticketGroups}
        ticketTiers={ticketTiers}
      />

      {/* Unlink Confirmation */}
      <FmCommonConfirmDialog
        open={!!unlinkConfirm}
        onOpenChange={open => !open && setUnlinkConfirm(null)}
        title={t('promoCodes.unlinkTitle')}
        description={t('promoCodes.unlinkConfirm')}
        confirmText={t('promoCodes.unlink')}
        onConfirm={() => {
          if (unlinkConfirm) {
            unlinkPromoCode(unlinkConfirm);
            setUnlinkConfirm(null);
          }
        }}
      />

      {/* Delete Confirmation */}
      <FmCommonConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={open => !open && setDeleteConfirm(null)}
        title={t('promoCodes.deleteTitle')}
        description={t('promoCodes.deleteConfirm')}
        confirmText={t('buttons.delete')}
        onConfirm={() => {
          if (deleteConfirm) {
            deletePromoCode(deleteConfirm);
            setDeleteConfirm(null);
          }
        }}
        variant='destructive'
      />
    </div>
  );
};
