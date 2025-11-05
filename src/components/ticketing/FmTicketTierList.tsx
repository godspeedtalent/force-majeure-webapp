import { FmCommonList, type FmCommonListColumn } from '@/components/common/data/FmCommonList';

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

export const FmTicketTierList = ({ selections, className }: FmTicketTierListProps) => {
  const columns: FmCommonListColumn<TicketSelection>[] = [
    {
      key: 'name',
      label: 'Ticket',
      render: (_, item) => (
        <div className='flex flex-col gap-0.5'>
          <span className='font-medium text-foreground'>{item.tier.name}</span>
          <span className='text-xs text-muted-foreground'>
            {item.quantity}x ${item.tier.price.toFixed(2)}
          </span>
        </div>
      ),
      align: 'left',
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      render: (_, item) => (
        <span className='font-medium text-foreground'>
          ${item.subtotal.toFixed(2)}
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
      emptyMessage='No tickets selected'
    />
  );
};
