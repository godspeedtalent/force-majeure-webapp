import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import type {
  MerchProduct,
  MerchProductInsert,
  MerchProductUpdate,
  MerchCategory,
} from '@/features/products/types';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

/**
 * Product Queries
 *
 * Centralized React Query hooks for all product-related data operations.
 * Supports the merch store with inventory tracking and category filtering.
 *
 * Usage:
 * ```ts
 * const { data: products } = useMerchProducts();
 * const { data: product } = useProductById(productId);
 * const createMutation = useCreateProduct();
 * ```
 */

// ============================================================================
// Query Keys
// ============================================================================

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  merch: () => [...productKeys.all, 'merch'] as const,
  merchByCategory: (category: MerchCategory | 'all') =>
    [...productKeys.merch(), category] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all active merch products
 *
 * @param category - Optional category filter ('all' or specific category)
 */
export function useMerchProducts(category?: MerchCategory | 'all') {
  return useQuery<MerchProduct[], Error>({
    queryKey: productKeys.merchByCategory(category ?? 'all'),
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('type', 'merchandise')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching merch products', {
          error: error.message,
          source: 'productQueries',
          category,
        });
        throw error;
      }

      return (data || []) as MerchProduct[];
    },
  });
}

/**
 * Fetch a single product by ID
 *
 * @param productId - Product ID
 */
export function useProductById(productId: string | undefined) {
  return useQuery<MerchProduct | null, Error>({
    queryKey: productKeys.detail(productId || ''),
    queryFn: async () => {
      if (!isUuid(productId)) return null;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Error fetching product by ID', {
          error: error.message,
          source: 'productQueries',
          productId,
        });
        throw error;
      }

      return data as MerchProduct;
    },
    enabled: isUuid(productId),
  });
}

/**
 * Fetch all products (admin view)
 * Includes inactive products
 */
export function useAllProducts() {
  return useQuery<MerchProduct[], Error>({
    queryKey: productKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('type', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching all products', {
          error: error.message,
          source: 'productQueries',
        });
        throw error;
      }

      return (data || []) as MerchProduct[];
    },
  });
}

/**
 * Fetch distinct categories for active merch products
 */
export function useMerchCategories() {
  return useQuery<MerchCategory[], Error>({
    queryKey: productKeys.categories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('type', 'merchandise')
        .eq('is_active', true)
        .not('category', 'is', null);

      if (error) {
        logger.error('Error fetching merch categories', {
          error: error.message,
          source: 'productQueries',
        });
        throw error;
      }

      // Extract unique categories (cast since category column is added by migration)
      const categories = [
        ...new Set(data?.map((p) => (p as unknown as Record<string, unknown>).category).filter(Boolean)),
      ] as MerchCategory[];

      return categories;
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new product
 *
 * Automatically invalidates product list queries on success
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<MerchProduct, Error, MerchProductInsert>({
    mutationFn: async (productData) => {
      // Use type assertion since MerchProductInsert has columns added by migration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('products') as any)
        .insert([productData])
        .select()
        .single();

      if (error) {
        logger.error('Error creating product', {
          error: error.message,
          source: 'productQueries',
        });
        throw error;
      }

      return data as MerchProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Update a product
 *
 * Automatically invalidates product queries on success
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    MerchProduct,
    Error,
    { productId: string; data: MerchProductUpdate }
  >({
    mutationFn: async ({ productId, data: updateData }) => {
      // Use type assertion since MerchProductUpdate has columns added by migration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase.from('products') as any)
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating product', {
          error: error.message,
          source: 'productQueries',
          productId,
        });
        throw error;
      }

      return result as MerchProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.merch() });
      queryClient.invalidateQueries({ queryKey: productKeys.categories() });
    },
  });
}

/**
 * Delete a product
 *
 * Automatically invalidates product queries on success
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (productId) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        logger.error('Error deleting product', {
          error: error.message,
          source: 'productQueries',
        });
        throw error;
      }
    },
    onSuccess: (_, productId) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Update product stock
 *
 * Uses database function to safely decrement stock with concurrency handling
 */
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { productId: string; quantity: number }>({
    mutationFn: async ({ productId, quantity }) => {
      // Use type assertion since RPC function is added by migration
      const { data, error } = await (supabase.rpc as Function)('decrement_product_stock', {
        p_product_id: productId,
        p_quantity: quantity,
      });

      if (error) {
        logger.error('Error decrementing product stock', {
          error: error.message,
          source: 'productQueries',
          productId,
          quantity,
        });
        throw error;
      }

      return data as boolean;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.merch() });
    },
  });
}

/**
 * Toggle product active status
 */
export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation<
    MerchProduct,
    Error,
    { productId: string; isActive: boolean }
  >({
    mutationFn: async ({ productId, isActive }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        logger.error('Error toggling product active status', {
          error: error.message,
          source: 'productQueries',
          productId,
        });
        throw error;
      }

      return data as MerchProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Adjust product stock (for admin manual adjustments)
 */
export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation<
    MerchProduct,
    Error,
    { productId: string; newQuantity: number }
  >({
    mutationFn: async ({ productId, newQuantity }) => {
      // Use type assertion since stock_quantity column is added by migration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('products') as any)
        .update({ stock_quantity: newQuantity })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        logger.error('Error adjusting product stock', {
          error: error.message,
          source: 'productQueries',
          productId,
          newQuantity,
        });
        throw error;
      }

      return data as MerchProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.merch() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
