/**
 * Addresses Feature
 *
 * Exports for the normalized addresses system.
 */

// Services
export { addressService } from './services/addressService';

// Hooks
export {
  // Query keys
  addressQueryKeys,
  // Profile hooks
  useProfileAddresses,
  useProfileBillingAddress,
  useUpsertProfileBillingAddress,
  // Guest hooks
  useGuestAddresses,
  useGuestBillingAddress,
  useUpsertGuestBillingAddress,
  // Generic hooks
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from './hooks/useAddresses';
