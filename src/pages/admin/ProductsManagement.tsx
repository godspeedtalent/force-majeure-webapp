import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmConfigurableDataGrid, DataGridAction } from '@/features/data-grid';
import { Trash2, Eye, Package } from 'lucide-react';
import { logger, useDeleteConfirmation } from '@/shared';
import { toast } from 'sonner';
import { productColumns } from './config/productGridColumns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonTextField } from '@/components/common/forms';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { Label } from '@/components/common/shadcn/label';
import {
  useAllProducts,
  useCreateProduct,
  useUpdateProduct,
  useToggleProductActive,
} from '@/shared/api/queries/productQueries';
import {
  type MerchProduct,
  type MerchCategory,
  type ProductType,
  MERCH_CATEGORY_LABELS,
} from '@/features/products/types';

interface CreateProductFormData {
  name: string;
  description: string;
  type: ProductType;
  category: MerchCategory | '';
  price_cents: number;
  sku: string;
  track_inventory: boolean;
  stock_quantity: number | null;
  low_stock_threshold: number;
}

const initialFormData: CreateProductFormData = {
  name: '',
  description: '',
  type: 'merchandise',
  category: '',
  price_cents: 0,
  sku: '',
  track_inventory: false,
  stock_quantity: null,
  low_stock_threshold: 5,
};

const typeOptions = [
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'ticket_protection', label: 'Ticket Protection' },
  { value: 'parking', label: 'Parking' },
  { value: 'vip_upgrade', label: 'VIP Upgrade' },
  { value: 'service_fee', label: 'Service Fee' },
  { value: 'other', label: 'Other' },
];

const categoryOptions = [
  { value: '', label: 'No Category' },
  ...Object.entries(MERCH_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export const ProductsManagement = () => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] =
    useState<CreateProductFormData>(initialFormData);

  // Queries and mutations
  const { data: products = [], isLoading } = useAllProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const toggleActiveMutation = useToggleProductActive();

  // Delete confirmation
  const {
    showConfirm: showDeleteConfirm,
    itemsToDelete: productsToDelete,
    isDeleting,
    openConfirm: handleDeleteClick,
    confirmDelete: handleDelete,
    setShowConfirm: setShowDeleteConfirm,
  } = useDeleteConfirmation<MerchProduct>({
    table: 'products',
    queryKey: ['products'],
    messages: {
      successSingle: tToast('products.deleted', 'Product deleted'),
      successMultiple: (count) =>
        tToast('products.deletedMultiple', { count }) ||
        `${count} products deleted`,
      error: tToast('products.deleteFailed', 'Failed to delete product'),
    },
    source: 'ProductsManagement',
  });

  const handleUpdate = async (
    row: MerchProduct,
    columnKey: string,
    newValue: unknown
  ) => {
    try {
      const normalizedValue =
        typeof newValue === 'string' ? newValue.trim() : newValue;

      await updateMutation.mutateAsync({
        productId: row.id,
        data: {
          [columnKey]: normalizedValue === '' ? null : normalizedValue,
        },
      });

      toast.success(tToast('products.updated', 'Product updated'));
    } catch (error) {
      logger.error('Error updating product', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'ProductsManagement',
        details: { productId: row.id, columnKey },
      });
      toast.error(tToast('products.updateFailed', 'Failed to update product'));
      throw error;
    }
  };

  const handleToggleActive = async (product: MerchProduct) => {
    try {
      await toggleActiveMutation.mutateAsync({
        productId: product.id,
        isActive: !product.is_active,
      });
      toast.success(
        product.is_active
          ? tToast('products.deactivated', 'Product deactivated')
          : tToast('products.activated', 'Product activated')
      );
    } catch (error) {
      logger.error('Error toggling product active status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'ProductsManagement',
        details: { productId: product.id },
      });
      toast.error(tToast('products.toggleFailed', 'Failed to update status'));
    }
  };

  const handleCreate = async () => {
    if (!createFormData.name.trim()) {
      toast.error(tToast('products.nameRequired', 'Product name is required'));
      return;
    }

    if (createFormData.price_cents <= 0) {
      toast.error(tToast('products.priceRequired', 'Price must be greater than 0'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: createFormData.name.trim(),
        description: createFormData.description.trim() || null,
        type: createFormData.type,
        category: createFormData.category || null,
        price_cents: createFormData.price_cents,
        sku: createFormData.sku.trim() || null,
        track_inventory: createFormData.track_inventory,
        stock_quantity: createFormData.track_inventory
          ? createFormData.stock_quantity
          : null,
        low_stock_threshold: createFormData.low_stock_threshold,
        is_active: true,
        sort_order: 0,
      });

      toast.success(tToast('products.created', 'Product created'));
      setIsCreateDialogOpen(false);
      setCreateFormData(initialFormData);
    } catch (error) {
      logger.error('Error creating product', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'ProductsManagement',
        details: { name: createFormData.name },
      });
      toast.error(tToast('products.createFailed', 'Failed to create product'));
    }
  };

  const contextActions: DataGridAction[] = [
    {
      label: t('table.toggleActive', 'Toggle Active'),
      icon: <Eye className='h-4 w-4' />,
      onClick: (rows: MerchProduct[]) => {
        if (rows.length === 1) {
          handleToggleActive(rows[0]);
        }
      },
    },
    {
      label: t('table.deleteProduct', 'Delete Product'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteClick,
      variant: 'destructive',
    },
  ];

  const getDeleteConfirmMessage = () => {
    if (productsToDelete.length === 1) {
      return t('dialogs.deleteProductConfirm', {
        productName: productsToDelete[0].name,
      }) || `Are you sure you want to delete "${productsToDelete[0].name}"?`;
    }
    return (
      t('dialogs.deleteProductsConfirm', { count: productsToDelete.length }) ||
      `Are you sure you want to delete ${productsToDelete.length} products?`
    );
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
          {t('pageTitles.productsManagement', 'Products Management')}
        </h1>
        <p className='text-muted-foreground'>
          {t(
            'pageTitles.productsManagementDescription',
            'Manage merchandise and other products for the store'
          )}
        </p>
      </div>

      <FmConfigurableDataGrid
        gridId='admin-products'
        data={products}
        columns={productColumns}
        contextMenuActions={contextActions}
        loading={isLoading}
        pageSize={20}
        onUpdate={handleUpdate}
        resourceName='Product'
        createButtonLabel={t('table.addProduct', 'Add Product')}
        onCreateButtonClick={() => setIsCreateDialogOpen(true)}
      />

      {/* Create Product Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Package className='h-5 w-5' />
              {t('dialogs.createProduct', 'Create Product')}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4 max-h-[60vh] overflow-y-auto'>
            <FmCommonTextField
              label={t('labels.productName', 'Product Name')}
              value={createFormData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCreateFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={t('forms.products.namePlaceholder', 'Enter product name')}
              required
            />

            <FmCommonTextField
              label={t('labels.description', 'Description')}
              value={createFormData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCreateFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder={t('forms.products.descriptionPlaceholder', 'Product description')}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FmCommonSelect
                label={t('labels.type', 'Type')}
                value={createFormData.type}
                onChange={(value) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    type: value as ProductType,
                  }))
                }
                options={typeOptions}
              />

              <FmCommonSelect
                label={t('labels.category', 'Category')}
                value={createFormData.category}
                onChange={(value) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    category: value as MerchCategory | '',
                  }))
                }
                options={categoryOptions}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FmCommonTextField
                label={t('labels.priceCents', 'Price (cents)')}
                type='number'
                value={createFormData.price_cents.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    price_cents: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder='e.g., 2500 for $25.00'
                required
              />

              <FmCommonTextField
                label={t('labels.sku', 'SKU')}
                value={createFormData.sku}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateFormData((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder={t('forms.products.skuPlaceholder', 'e.g., FM-TEE-001')}
              />
            </div>

            <div className='space-y-3 pt-2 border-t border-white/10'>
              <div className='flex items-center space-x-2'>
                <FmCommonCheckbox
                  id='track_inventory'
                  checked={createFormData.track_inventory}
                  onCheckedChange={(checked) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      track_inventory: checked,
                    }))
                  }
                />
                <Label htmlFor='track_inventory' className='text-sm'>
                  {t('labels.trackInventory', 'Track inventory for this product')}
                </Label>
              </div>

              {createFormData.track_inventory && (
                <div className='grid grid-cols-2 gap-4 pl-6'>
                  <FmCommonTextField
                    label={t('labels.stockQuantity', 'Stock Quantity')}
                    type='number'
                    value={(createFormData.stock_quantity ?? 0).toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        stock_quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder='0'
                  />

                  <FmCommonTextField
                    label={t('labels.lowStockThreshold', 'Low Stock Alert')}
                    type='number'
                    value={createFormData.low_stock_threshold.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        low_stock_threshold: parseInt(e.target.value) || 5,
                      }))
                    }
                    placeholder='5'
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsCreateDialogOpen(false)}
            >
              {t('buttons.cancel', 'Cancel')}
            </Button>
            <Button
              variant='outline'
              onClick={handleCreate}
              disabled={
                createMutation.isPending ||
                !createFormData.name.trim() ||
                createFormData.price_cents <= 0
              }
              className='border-fm-gold text-fm-gold hover:bg-fm-gold/10'
            >
              {createMutation.isPending
                ? t('dialogs.creating', 'Creating...')
                : t('buttons.createProduct', 'Create Product')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('table.deleteProduct', 'Delete Product')}
        description={getDeleteConfirmMessage()}
        confirmText={t('buttons.delete', 'Delete')}
        onConfirm={handleDelete}
        variant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProductsManagement;
