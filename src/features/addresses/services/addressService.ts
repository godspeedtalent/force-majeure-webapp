/**
 * Address Service
 *
 * Centralized service for address CRUD operations.
 * Uses the normalized addresses table with polymorphic ownership.
 *
 * NOTE: Type assertions (as any) are used because the addresses table
 * types are not yet in the generated Supabase types file. After running
 * migrations and regenerating types, these can be removed.
 */

import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import type { Address, AddressFormData, AddressType, AddressOwnerType } from '@/shared/types/address';

export const addressService = {
  /**
   * Get all addresses for a profile
   */
  async getProfileAddresses(profileId: string): Promise<Address[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('addresses')
      .select('*')
      .eq('profile_id', profileId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching profile addresses', {
        error: error.message,
        source: 'addressService.getProfileAddresses',
        profileId,
      });
      throw error;
    }

    return (data || []) as Address[];
  },

  /**
   * Get all addresses for a guest
   */
  async getGuestAddresses(guestId: string): Promise<Address[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('addresses')
      .select('*')
      .eq('guest_id', guestId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching guest addresses', {
        error: error.message,
        source: 'addressService.getGuestAddresses',
        guestId,
      });
      throw error;
    }

    return (data || []) as Address[];
  },

  /**
   * Get default billing address for a profile
   */
  async getProfileBillingAddress(profileId: string): Promise<Address | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('addresses')
      .select('*')
      .eq('profile_id', profileId)
      .eq('address_type', 'billing')
      .eq('is_default', true)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching profile billing address', {
        error: error.message,
        source: 'addressService.getProfileBillingAddress',
        profileId,
      });
      throw error;
    }

    return data as Address | null;
  },

  /**
   * Get default billing address for a guest
   */
  async getGuestBillingAddress(guestId: string): Promise<Address | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('addresses')
      .select('*')
      .eq('guest_id', guestId)
      .eq('address_type', 'billing')
      .eq('is_default', true)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching guest billing address', {
        error: error.message,
        source: 'addressService.getGuestBillingAddress',
        guestId,
      });
      throw error;
    }

    return data as Address | null;
  },

  /**
   * Create or update default billing address for a profile (uses DB function)
   */
  async upsertProfileBillingAddress(
    profileId: string,
    address: AddressFormData
  ): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('upsert_profile_billing_address', {
      p_profile_id: profileId,
      p_line_1: address.line_1 || null,
      p_line_2: address.line_2 || null,
      p_city: address.city || null,
      p_state: address.state || null,
      p_zip_code: address.zip_code || null,
      p_country: address.country || 'US',
    });

    if (error) {
      logger.error('Error upserting profile billing address', {
        error: error.message,
        source: 'addressService.upsertProfileBillingAddress',
        profileId,
      });
      throw error;
    }

    return data as string;
  },

  /**
   * Create or update default billing address for a guest (uses DB function)
   */
  async upsertGuestBillingAddress(
    guestId: string,
    address: AddressFormData
  ): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('upsert_guest_billing_address', {
      p_guest_id: guestId,
      p_line_1: address.line_1 || null,
      p_line_2: address.line_2 || null,
      p_city: address.city || null,
      p_state: address.state || null,
      p_zip_code: address.zip_code || null,
      p_country: address.country || 'US',
    });

    if (error) {
      logger.error('Error upserting guest billing address', {
        error: error.message,
        source: 'addressService.upsertGuestBillingAddress',
        guestId,
      });
      throw error;
    }

    return data as string;
  },

  /**
   * Create a new address with explicit owner and type
   */
  async createAddress(
    ownerId: string,
    ownerType: AddressOwnerType,
    addressType: AddressType,
    address: AddressFormData,
    options?: { label?: string; isDefault?: boolean }
  ): Promise<Address> {
    const ownerField = `${ownerType}_id`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('addresses')
      .insert({
        [ownerField]: ownerId,
        address_type: addressType,
        line_1: address.line_1 || null,
        line_2: address.line_2 || null,
        city: address.city || null,
        state: address.state || null,
        zip_code: address.zip_code || null,
        country: address.country || 'US',
        label: options?.label || null,
        is_default: options?.isDefault ?? false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating address', {
        error: error.message,
        source: 'addressService.createAddress',
        ownerId,
        ownerType,
        addressType,
      });
      throw error;
    }

    return data as Address;
  },

  /**
   * Update an existing address
   */
  async updateAddress(
    addressId: string,
    address: Partial<AddressFormData>
  ): Promise<Address> {
    const updateData: Record<string, unknown> = {};

    if (address.line_1 !== undefined) updateData.line_1 = address.line_1 || null;
    if (address.line_2 !== undefined) updateData.line_2 = address.line_2 || null;
    if (address.city !== undefined) updateData.city = address.city || null;
    if (address.state !== undefined) updateData.state = address.state || null;
    if (address.zip_code !== undefined) updateData.zip_code = address.zip_code || null;
    if (address.country !== undefined) updateData.country = address.country || 'US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('addresses')
      .update(updateData)
      .eq('id', addressId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating address', {
        error: error.message,
        source: 'addressService.updateAddress',
        addressId,
      });
      throw error;
    }

    return data as Address;
  },

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      logger.error('Error deleting address', {
        error: error.message,
        source: 'addressService.deleteAddress',
        addressId,
      });
      throw error;
    }
  },

  /**
   * Set an address as the default for its type
   */
  async setDefaultAddress(addressId: string, ownerId: string, ownerType: AddressOwnerType): Promise<void> {
    const ownerField = `${ownerType}_id`;

    // First, get the address type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: address, error: fetchError } = await (supabase as any)
      .from('addresses')
      .select('address_type')
      .eq('id', addressId)
      .single();

    if (fetchError) {
      logger.error('Error fetching address for default update', {
        error: fetchError.message,
        source: 'addressService.setDefaultAddress',
        addressId,
      });
      throw fetchError;
    }

    // Unset any existing default for this type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: unsetError } = await (supabase as any)
      .from('addresses')
      .update({ is_default: false })
      .eq(ownerField, ownerId)
      .eq('address_type', address.address_type)
      .eq('is_default', true);

    if (unsetError) {
      logger.error('Error unsetting previous default address', {
        error: unsetError.message,
        source: 'addressService.setDefaultAddress',
        ownerId,
        ownerType,
      });
      throw unsetError;
    }

    // Set the new default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: setError } = await (supabase as any)
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId);

    if (setError) {
      logger.error('Error setting new default address', {
        error: setError.message,
        source: 'addressService.setDefaultAddress',
        addressId,
      });
      throw setError;
    }
  },
};
