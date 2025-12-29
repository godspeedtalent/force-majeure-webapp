import { DataGridColumn, DataGridColumns } from '@/features/data-grid';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';
import i18n from '@/i18n';
import {
  MERCH_CATEGORY_LABELS,
  type MerchCategory,
  getStockStatus,
  type MerchProduct,
} from '@/features/products/types';
import { StockBadge } from '@/features/products/components/StockBadge';

/**
 * Helper to get translation
 */
const t = (key: string) => i18n.t(key, { ns: 'common' });

/**
 * Update product image URL in the database
 */
async function updateProductImage(row: MerchProduct, newImageUrl: string) {
  try {
    // Use type assertion since image_url column is added by migration
    const { error } = await supabase
      .from('products')
      .update({ image_url: newImageUrl } as Record<string, unknown>)
      .eq('id', row.id);

    if (error) throw error;
    toast.success(t('adminGrid.productImageUpdated'));
  } catch (error) {
    logger.error('Failed to update product image', {
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'productGridColumns',
      details: { productId: row.id },
    });
    toast.error(t('adminGrid.productImageUpdateFailed'));
    throw error;
  }
}

/**
 * Category options for select dropdown
 */
const categoryOptions = [
  { value: '', label: '—' },
  ...Object.entries(MERCH_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

/**
 * Product type options
 */
const typeOptions = [
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'ticket_protection', label: 'Ticket Protection' },
  { value: 'parking', label: 'Parking' },
  { value: 'vip_upgrade', label: 'VIP Upgrade' },
  { value: 'service_fee', label: 'Service Fee' },
  { value: 'other', label: 'Other' },
];

/**
 * Column definitions for the Products data grid
 * Note: Some columns use merch-specific fields added by migration
 */
export const productColumns: DataGridColumn[] = [
  DataGridColumns.image({
    key: 'image_url',
    label: t('adminGrid.columns.image'),
    shape: 'square',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'products',
    onImageUpdate: (row, newImageUrl) =>
      updateProductImage(row as MerchProduct, newImageUrl),
  }),
  DataGridColumns.text({
    key: 'name',
    label: t('adminGrid.columns.name'),
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.text({
    key: 'sku',
    label: 'SKU',
    sortable: true,
    filterable: true,
    editable: true,
  }),
  {
    key: 'type',
    label: t('adminGrid.columns.type'),
    sortable: true,
    filterable: true,
    editable: true,
    type: 'select',
    options: typeOptions,
    render: (value: string) => {
      const option = typeOptions.find((o) => o.value === value);
      return (
        <span className='text-xs px-2 py-0.5 bg-white/10 border border-white/20'>
          {option?.label || value}
        </span>
      );
    },
  },
  {
    key: 'category',
    label: t('adminGrid.columns.category'),
    sortable: true,
    filterable: true,
    editable: true,
    type: 'select',
    options: categoryOptions,
    render: (value: MerchCategory | null) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      return (
        <span className='text-xs px-2 py-0.5 bg-fm-gold/10 text-fm-gold border border-fm-gold/30'>
          {MERCH_CATEGORY_LABELS[value] || value}
        </span>
      );
    },
  },
  {
    key: 'price_cents',
    label: t('adminGrid.columns.price'),
    sortable: true,
    editable: true,
    type: 'number',
    render: (value: number) => {
      return <span className='font-mono'>${(value / 100).toFixed(2)}</span>;
    },
  },
  {
    key: 'stock_status',
    label: t('adminGrid.columns.stock'),
    sortable: false,
    render: (_value: unknown, row: unknown) => {
      const product = row as MerchProduct;
      const status = getStockStatus(product);
      return (
        <StockBadge
          status={status}
          quantity={product.stock_quantity}
          showQuantity={product.track_inventory}
        />
      );
    },
  },
  {
    key: 'stock_quantity',
    label: t('adminGrid.columns.quantity'),
    sortable: true,
    editable: true,
    type: 'number',
    render: (value: number | null) => {
      if (value === null) return <span className='text-muted-foreground'>—</span>;
      return <span>{value}</span>;
    },
  },
  {
    key: 'track_inventory',
    label: t('adminGrid.columns.trackInventory'),
    editable: true,
    type: 'boolean',
    render: (value: boolean) => (
      <span className={value ? 'text-green-500' : 'text-muted-foreground'}>
        {value ? 'Yes' : 'No'}
      </span>
    ),
  },
  {
    key: 'is_active',
    label: t('adminGrid.columns.active'),
    editable: true,
    type: 'boolean',
    render: (value: boolean) => (
      <span className={value ? 'text-green-500' : 'text-fm-danger'}>
        {value ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    key: 'sort_order',
    label: t('adminGrid.columns.sortOrder'),
    sortable: true,
    editable: true,
    type: 'number',
    render: (value: number) => <span>{value ?? 0}</span>,
  },
  DataGridColumns.date({
    key: 'created_at',
    label: t('adminGrid.columns.created'),
    sortable: true,
  }),
];
