/**
 * Address Hooks
 *
 * React Query hooks for address data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addressService } from '../services/addressService';
import { handleError } from '@/shared/services/errorHandler';
import type { AddressFormData, AddressType, AddressOwnerType } from '@/shared/types/address';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const addressQueryKeys = {
  all: ['addresses'] as const,
  profileAddresses: (profileId: string) => ['addresses', 'profile', profileId] as const,
  profileBilling: (profileId: string) => ['addresses', 'profile', profileId, 'billing'] as const,
  guestAddresses: (guestId: string) => ['addresses', 'guest', guestId] as const,
  guestBilling: (guestId: string) => ['addresses', 'guest', guestId, 'billing'] as const,
};

// ============================================================================
// PROFILE ADDRESS HOOKS
// ============================================================================

/**
 * Get all addresses for a profile
 */
export function useProfileAddresses(profileId: string | undefined) {
  return useQuery({
    queryKey: addressQueryKeys.profileAddresses(profileId || ''),
    queryFn: () => addressService.getProfileAddresses(profileId!),
    enabled: !!profileId,
  });
}

/**
 * Get default billing address for a profile
 */
export function useProfileBillingAddress(profileId: string | undefined) {
  return useQuery({
    queryKey: addressQueryKeys.profileBilling(profileId || ''),
    queryFn: () => addressService.getProfileBillingAddress(profileId!),
    enabled: !!profileId,
  });
}

/**
 * Upsert (create or update) billing address for a profile
 */
export function useUpsertProfileBillingAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, address }: { profileId: string; address: AddressFormData }) =>
      addressService.upsertProfileBillingAddress(profileId, address),
    onSuccess: (_addressId, { profileId }) => {
      // Invalidate both the specific billing query and all profile addresses
      queryClient.invalidateQueries({ queryKey: addressQueryKeys.profileBilling(profileId) });
      queryClient.invalidateQueries({ queryKey: addressQueryKeys.profileAddresses(profileId) });
      toast.success('Address updated successfully');
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: 'Failed to update address',
        context: 'useUpsertProfileBillingAddress',
      });
    },
  });
}

// ============================================================================
// GUEST ADDRESS HOOKS
// ============================================================================

/**
 * Get all addresses for a guest
 */
export function useGuestAddresses(guestId: string | undefined) {
  return useQuery({
    queryKey: addressQueryKeys.guestAddresses(guestId || ''),
    queryFn: () => addressService.getGuestAddresses(guestId!),
    enabled: !!guestId,
  });
}

/**
 * Get default billing address for a guest
 */
export function useGuestBillingAddress(guestId: string | undefined) {
  return useQuery({
    queryKey: addressQueryKeys.guestBilling(guestId || ''),
    queryFn: () => addressService.getGuestBillingAddress(guestId!),
    enabled: !!guestId,
  });
}

/**
 * Upsert (create or update) billing address for a guest
 */
export function useUpsertGuestBillingAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guestId, address }: { guestId: string; address: AddressFormData }) =>
      addressService.upsertGuestBillingAddress(guestId, address),
    onSuccess: (_addressId, { guestId }) => {
      queryClient.invalidateQueries({ queryKey: addressQueryKeys.guestBilling(guestId) });
      queryClient.invalidateQueries({ queryKey: addressQueryKeys.guestAddresses(guestId) });
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: 'Failed to update address',
        context: 'useUpsertGuestBillingAddress',
      });
    },
  });
}

// ============================================================================
// GENERIC ADDRESS HOOKS
// ============================================================================

/**
 * Create a new address
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ownerId,
      ownerType,
      addressType,
      address,
      options,
    }: {
      ownerId: string;
      ownerType: AddressOwnerType;
      addressType: AddressType;
      address: AddressFormData;
      options?: { label?: string; isDefault?: boolean };
    }) => addressService.createAddress(ownerId, ownerType, addressType, address, options),
    onSuccess: (newAddress) => {
      // Invalidate the appropriate queries based on owner type
      if (newAddress.profile_id) {
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.profileAddresses(newAddress.profile_id) });
      }
      if (newAddress.guest_id) {
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.guestAddresses(newAddress.guest_id) });
      }
      toast.success('Address created successfully');
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: 'Failed to create address',
        context: 'useCreateAddress',
      });
    },
  });
}

/**
 * Update an existing address
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      addressId,
      address,
    }: {
      addressId: string;
      address: Partial<AddressFormData>;
      ownerId?: string;
      ownerType?: AddressOwnerType;
    }) => addressService.updateAddress(addressId, address),
    onSuccess: (updatedAddress) => {
      // Invalidate the appropriate queries based on owner type
      if (updatedAddress.profile_id) {
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.profileAddresses(updatedAddress.profile_id) });
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.profileBilling(updatedAddress.profile_id) });
      }
      if (updatedAddress.guest_id) {
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.guestAddresses(updatedAddress.guest_id) });
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.guestBilling(updatedAddress.guest_id) });
      }
      toast.success('Address updated successfully');
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: 'Failed to update address',
        context: 'useUpdateAddress',
      });
    },
  });
}

/**
 * Delete an address
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      addressId,
    }: {
      addressId: string;
      ownerId: string;
      ownerType: AddressOwnerType;
    }) => addressService.deleteAddress(addressId),
    onSuccess: (_, { ownerId, ownerType }) => {
      // Invalidate queries based on owner type
      if (ownerType === 'profile') {
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.profileAddresses(ownerId) });
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.profileBilling(ownerId) });
      } else if (ownerType === 'guest') {
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.guestAddresses(ownerId) });
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.guestBilling(ownerId) });
      }
      toast.success('Address deleted successfully');
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: 'Failed to delete address',
        context: 'useDeleteAddress',
      });
    },
  });
}

/**
 * Set an address as default for its type
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      addressId,
      ownerId,
      ownerType,
    }: {
      addressId: string;
      ownerId: string;
      ownerType: AddressOwnerType;
    }) => addressService.setDefaultAddress(addressId, ownerId, ownerType),
    onSuccess: (_, { ownerId, ownerType }) => {
      if (ownerType === 'profile') {
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.profileAddresses(ownerId) });
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.profileBilling(ownerId) });
      } else if (ownerType === 'guest') {
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.guestAddresses(ownerId) });
        queryClient.invalidateQueries({ queryKey: addressQueryKeys.guestBilling(ownerId) });
      }
      toast.success('Default address updated');
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: 'Failed to set default address',
        context: 'useSetDefaultAddress',
      });
    },
  });
}
