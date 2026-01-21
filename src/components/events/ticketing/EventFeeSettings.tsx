import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FeeItemsEditor } from './ticket-group-manager/components/FeeItemsEditor';
import { useTicketFees } from '@/components/ticketing/hooks/useTicketFees';
import { useEntityFeeItems, type FeeItem, type CreateFeeItemInput } from '@/features/events/hooks/useEntityFeeItems';

interface EventFeeSettingsProps {
  /** Event ID for managing fee items */
  eventId: string;
  /** Whether using default site fees */
  useDefaultFees: boolean;
  /** Callback when use default fees changes */
  onUseDefaultFeesChange: (useDefault: boolean) => void;
  /** Whether the component is in a loading/saving state */
  isLoading?: boolean;
}

/**
 * EventFeeSettings - Event-level fee configuration section
 *
 * Allows toggling between default site fees and custom event fees.
 * When using default fees, shows the current site fee values in read-only mode.
 * Supports multiple fee items with labels.
 */
export function EventFeeSettings({
  eventId,
  useDefaultFees,
  onUseDefaultFeesChange,
  isLoading = false,
}: EventFeeSettingsProps) {
  const { t } = useTranslation('common');
  const { fees } = useTicketFees();

  // Fee items for this event
  const {
    feeItems,
    isLoading: isFeeItemsLoading,
    isCreating,
    isUpdating,
    isDeleting,
    createFeeItem,
    updateFeeItem,
    deleteFeeItem,
  } = useEntityFeeItems('event', eventId);

  // Convert global fees to inherited fees format
  const inheritedFees = fees.map(fee => ({
    label: (fee as any).label || fee.fee_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    fee_type: fee.fee_type as 'flat' | 'percentage',
    fee_value: fee.fee_type === 'flat'
      ? Math.round(fee.fee_value * 100) // Convert dollars to cents
      : Math.round(fee.fee_value * 100), // Convert percent to basis points
  }));

  const handleAddFeeItem = (input: CreateFeeItemInput) => {
    createFeeItem(input);
  };

  const handleUpdateFeeItem = (id: string, updates: Partial<FeeItem>) => {
    updateFeeItem({ id, ...updates });
  };

  const handleDeleteFeeItem = (id: string) => {
    deleteFeeItem(id);
  };

  return (
    <FmFormSection
      title={t('ticketing.eventFeeSettings')}
      description={t('ticketing.eventFeeSettingsDescription')}
      icon={Settings}
    >
      <FeeItemsEditor
        inheritLabel={t('ticketing.useDefaultSiteFees')}
        inheritDescription={t('ticketing.useDefaultSiteFeesDescription')}
        isInheriting={useDefaultFees}
        onInheritChange={onUseDefaultFeesChange}
        inheritedFees={inheritedFees}
        feeItems={feeItems}
        onAddFeeItem={handleAddFeeItem}
        onUpdateFeeItem={handleUpdateFeeItem}
        onDeleteFeeItem={handleDeleteFeeItem}
        disabled={isLoading}
        isLoading={isFeeItemsLoading || isCreating || isUpdating || isDeleting}
      />
    </FmFormSection>
  );
}
