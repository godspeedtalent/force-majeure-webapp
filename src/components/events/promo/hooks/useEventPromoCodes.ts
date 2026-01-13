import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import type {
  PromoCodeWithScope,
  EventPromoCodeWithDetails,
  CreatePromoCodeInput,
  UpdatePromoCodeInput,
  DiscountType,
  PromoCodeScope,
  PromoCodeGroup,
  PromoCodeTier,
} from '@/shared/types/promoCode';

// Query keys for cache management
export const eventPromoCodeKeys = {
  all: ['event-promo-codes'] as const,
  byEvent: (eventId: string) => ['event-promo-codes', eventId] as const,
  globalCodes: () => ['promo-codes', 'global'] as const,
  allCodes: () => ['promo-codes', 'all'] as const,
};

// Helper functions to access tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventPromoCodesTable = () => (supabase as any).from('event_promo_codes');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promoCodeGroupsTable = () => (supabase as any).from('promo_code_groups');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promoCodeTiersTable = () => (supabase as any).from('promo_code_tiers');

/**
 * Hook for managing promo codes for a specific event
 *
 * Returns:
 * - eventCodes: Promo codes linked to this event
 * - globalCodes: Promo codes that work everywhere (not linked to any event)
 * - allCodes: All available promo codes for linking
 */
export const useEventPromoCodes = (eventId: string | undefined) => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  // Fetch promo codes linked to this event
  const {
    data: eventCodes = [],
    isLoading: isLoadingEventCodes,
    error: eventCodesError,
  } = useQuery({
    queryKey: eventPromoCodeKeys.byEvent(eventId || ''),
    queryFn: async (): Promise<EventPromoCodeWithDetails[]> => {
      if (!eventId) return [];

      const { data, error } = await eventPromoCodesTable()
        .select(`
          id,
          event_id,
          promo_code_id,
          created_at,
          promo_codes (
            id,
            code,
            discount_type,
            discount_value,
            is_active,
            expires_at,
            created_at,
            updated_at
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EventPromoCodeWithDetails[];
    },
    enabled: !!eventId,
  });

  // Fetch all promo codes to determine global vs event-specific
  const {
    data: allCodes = [],
    isLoading: isLoadingAllCodes,
  } = useQuery({
    queryKey: eventPromoCodeKeys.allCodes(),
    queryFn: async (): Promise<PromoCodeWithScope[]> => {
      // Get all promo codes
      const { data: codes, error: codesError } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      // Get all event linkages to determine scope
      const { data: linkages, error: linkagesError } = await eventPromoCodesTable()
        .select('promo_code_id');

      if (linkagesError) throw linkagesError;

      // Get all group linkages
      const { data: groupLinkages, error: groupError } = await promoCodeGroupsTable()
        .select('*');

      if (groupError) throw groupError;

      // Get all tier linkages
      const { data: tierLinkages, error: tierError } = await promoCodeTiersTable()
        .select('*');

      if (tierError) throw tierError;

      // Count event linkages per code
      const linkageCounts = (linkages || []).reduce(
        (acc: Record<string, number>, link: { promo_code_id: string }) => {
          acc[link.promo_code_id] = (acc[link.promo_code_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Group linkages by promo code
      const groupsByCode = (groupLinkages || []).reduce(
        (acc: Record<string, PromoCodeGroup[]>, link: PromoCodeGroup) => {
          if (!acc[link.promo_code_id]) acc[link.promo_code_id] = [];
          acc[link.promo_code_id].push(link);
          return acc;
        },
        {} as Record<string, PromoCodeGroup[]>
      );

      // Tier linkages by promo code
      const tiersByCode = (tierLinkages || []).reduce(
        (acc: Record<string, PromoCodeTier[]>, link: PromoCodeTier) => {
          if (!acc[link.promo_code_id]) acc[link.promo_code_id] = [];
          acc[link.promo_code_id].push(link);
          return acc;
        },
        {} as Record<string, PromoCodeTier[]>
      );

      // Add scope info to codes
      // Note: application_scope and applies_to_order are added via migration but may not be in generated types yet
      return (codes || []).map(code => {
        const codeWithExtras = code as typeof code & { application_scope?: string; applies_to_order?: boolean };
        return {
          ...code,
          discount_type: code.discount_type as DiscountType,
          application_scope: (codeWithExtras.application_scope || 'all_tickets') as PromoCodeScope,
          applies_to_order: codeWithExtras.applies_to_order ?? false,
          is_global: !linkageCounts[code.id],
          event_count: linkageCounts[code.id] || 0,
          groups: groupsByCode[code.id] || [],
          tiers: tiersByCode[code.id] || [],
        };
      });
    },
  });

  // Filter to get global codes (not linked to any event)
  const globalCodes = allCodes.filter(code => code.is_global);

  // Get codes available to link (not already linked to this event)
  const linkedCodeIds = new Set(eventCodes.map(ec => ec.promo_code_id));
  const availableToLink = allCodes.filter(code => !linkedCodeIds.has(code.id));

  // Create a new promo code
  const createPromoCode = useMutation({
    mutationFn: async (input: CreatePromoCodeInput) => {
      // Create the promo code
      const { data: newCode, error: createError } = await supabase
        .from('promo_codes')
        .insert({
          code: input.code.toUpperCase(),
          discount_type: input.discount_type,
          discount_value: input.discount_value,
          expires_at: input.expires_at || null,
          is_active: input.is_active ?? true,
          application_scope: input.application_scope || 'all_tickets',
          applies_to_order: input.applies_to_order ?? false,
        })
        .select()
        .single();

      if (createError) throw createError;

      // If event_id provided, link to the event
      if (input.event_id && newCode) {
        const { error: linkError } = await eventPromoCodesTable()
          .insert({
            event_id: input.event_id,
            promo_code_id: newCode.id,
          });

        if (linkError) throw linkError;
      }

      // Link to specific groups if scope is 'specific_groups'
      if (input.application_scope === 'specific_groups' && input.group_ids?.length && newCode) {
        const groupInserts = input.group_ids.map(groupId => ({
          promo_code_id: newCode.id,
          ticket_group_id: groupId,
        }));
        const { error: groupError } = await promoCodeGroupsTable().insert(groupInserts);
        if (groupError) throw groupError;
      }

      // Link to specific tiers if scope is 'specific_tiers'
      if (input.application_scope === 'specific_tiers' && input.tier_ids?.length && newCode) {
        const tierInserts = input.tier_ids.map(tierId => ({
          promo_code_id: newCode.id,
          ticket_tier_id: tierId,
        }));
        const { error: tierError } = await promoCodeTiersTable().insert(tierInserts);
        if (tierError) throw tierError;
      }

      return newCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.byEvent(eventId || '') });
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.allCodes() });
      toast.success(t('promoCodes.created'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('promoCodes.createFailed'),
        context: 'useEventPromoCodes.createPromoCode',
      });
    },
  });

  // Update an existing promo code
  const updatePromoCode = useMutation({
    mutationFn: async (input: UpdatePromoCodeInput) => {
      const { id, group_ids, tier_ids, ...updates } = input;

      // Uppercase code if provided
      if (updates.code) {
        updates.code = updates.code.toUpperCase();
      }

      const { data, error } = await supabase
        .from('promo_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Handle group linkages update
      if (group_ids !== undefined) {
        // Delete existing group linkages
        await promoCodeGroupsTable().delete().eq('promo_code_id', id);

        // Insert new group linkages
        if (group_ids.length > 0) {
          const groupInserts = group_ids.map(groupId => ({
            promo_code_id: id,
            ticket_group_id: groupId,
          }));
          const { error: groupError } = await promoCodeGroupsTable().insert(groupInserts);
          if (groupError) throw groupError;
        }
      }

      // Handle tier linkages update
      if (tier_ids !== undefined) {
        // Delete existing tier linkages
        await promoCodeTiersTable().delete().eq('promo_code_id', id);

        // Insert new tier linkages
        if (tier_ids.length > 0) {
          const tierInserts = tier_ids.map(tierId => ({
            promo_code_id: id,
            ticket_tier_id: tierId,
          }));
          const { error: tierError } = await promoCodeTiersTable().insert(tierInserts);
          if (tierError) throw tierError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.byEvent(eventId || '') });
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.allCodes() });
      toast.success(t('promoCodes.updated'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('promoCodes.updateFailed'),
        context: 'useEventPromoCodes.updatePromoCode',
      });
    },
  });

  // Link an existing promo code to this event
  const linkPromoCode = useMutation({
    mutationFn: async (promoCodeId: string) => {
      if (!eventId) throw new Error('Event ID is required');

      const { data, error } = await eventPromoCodesTable()
        .insert({
          event_id: eventId,
          promo_code_id: promoCodeId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.byEvent(eventId || '') });
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.allCodes() });
      toast.success(t('promoCodes.linked'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('promoCodes.linkFailed'),
        context: 'useEventPromoCodes.linkPromoCode',
      });
    },
  });

  // Unlink a promo code from this event (keeps the code, just removes the linkage)
  const unlinkPromoCode = useMutation({
    mutationFn: async (eventPromoCodeId: string) => {
      const { error } = await eventPromoCodesTable()
        .delete()
        .eq('id', eventPromoCodeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.byEvent(eventId || '') });
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.allCodes() });
      toast.success(t('promoCodes.unlinked'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('promoCodes.unlinkFailed'),
        context: 'useEventPromoCodes.unlinkPromoCode',
      });
    },
  });

  // Toggle promo code active status
  const togglePromoCodeActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.byEvent(eventId || '') });
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.allCodes() });
      toast.success(variables.isActive ? t('promoCodes.activated') : t('promoCodes.deactivated'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('promoCodes.toggleFailed'),
        context: 'useEventPromoCodes.togglePromoCodeActive',
      });
    },
  });

  // Delete a promo code entirely
  const deletePromoCode = useMutation({
    mutationFn: async (promoCodeId: string) => {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', promoCodeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.byEvent(eventId || '') });
      queryClient.invalidateQueries({ queryKey: eventPromoCodeKeys.allCodes() });
      toast.success(t('promoCodes.deleted'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('promoCodes.deleteFailed'),
        context: 'useEventPromoCodes.deletePromoCode',
      });
    },
  });

  return {
    // Data
    eventCodes,
    globalCodes,
    allCodes,
    availableToLink,

    // Loading states
    isLoading: isLoadingEventCodes || isLoadingAllCodes,
    error: eventCodesError,

    // Mutations
    createPromoCode: createPromoCode.mutate,
    updatePromoCode: updatePromoCode.mutate,
    linkPromoCode: linkPromoCode.mutate,
    unlinkPromoCode: unlinkPromoCode.mutate,
    togglePromoCodeActive: togglePromoCodeActive.mutate,
    deletePromoCode: deletePromoCode.mutate,

    // Mutation states
    isCreating: createPromoCode.isPending,
    isUpdating: updatePromoCode.isPending,
    isLinking: linkPromoCode.isPending,
    isUnlinking: unlinkPromoCode.isPending,
    isToggling: togglePromoCodeActive.isPending,
    isDeleting: deletePromoCode.isPending,
  };
};
