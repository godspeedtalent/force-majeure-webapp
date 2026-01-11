import { useTranslation } from 'react-i18next';
import {
  FmCommonList,
  type FmCommonListColumn,
} from '@/components/common/data/FmCommonList';
import { formatDollars } from '@/lib/utils/currency';

interface TicketTierSummary {
  id: string;
  name: string;
  description?: string;
  price: number;
  available_inventory: number;
}

interface TicketSelection {
  tier: TicketTierSummary;
  quantity: number;
  subtotal: number;
}

interface FmTicketTierListProps {
  selections: TicketSelection[];
  className?: string;
}

export const FmTicketTierList = ({
  selections,
  className,
}: FmTicketTierListProps) => {
  const { t } = useTranslation('common');

  const columns: FmCommonListColumn<TicketSelection>[] = [
    {
      key: 'name',
      label: t('ticketTierList.ticket'),
      render: (_, item) => (
        <div className='flex flex-col gap-0.5'>
          <span className='font-medium text-foreground'>{item.tier.name}</span>
          <span className='text-xs text-muted-foreground'>
            {item.quantity}x {formatDollars(item.tier.price)}
          </span>
        </div>
      ),
      align: 'left',
    },
    {
      key: 'subtotal',
      label: t('checkout.subtotal'),
      render: (_, item) => (
        <span className='font-medium text-foreground'>
          {formatDollars(item.subtotal)}
        </span>
      ),
      align: 'right',
    },
  ];

  return (
    <FmCommonList
      items={selections}
      columns={columns}
      striped
      dense
      className={className}
      emptyMessage={t('ticketTierList.noTicketsSelected')}
    />
  );
};
