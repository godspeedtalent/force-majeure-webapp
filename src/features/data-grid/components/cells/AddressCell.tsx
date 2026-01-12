import * as React from 'react';
import { Pencil, MapPin } from 'lucide-react';
import { cn } from '@/shared';
import {
  FmAddressEditModal,
  AddressData,
} from '@/components/common/modals/FmAddressEditModal';

export interface AddressCellProps {
  address: AddressData;
  editable?: boolean;
  onAddressUpdate?: (address: AddressData) => void;
  emptyText?: string;
}

/**
 * AddressCell - Displays an address in a data grid cell with optional edit modal
 *
 * Features:
 * - Displays formatted multi-line address
 * - Click to open edit modal (if editable)
 * - Hover state shows edit indicator
 * - Empty state with placeholder
 */
export function AddressCell({
  address,
  editable = false,
  onAddressUpdate,
  emptyText = '—',
}: AddressCellProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editable) {
      setModalOpen(true);
    }
  };

  const handleSave = (newAddress: AddressData) => {
    if (onAddressUpdate) {
      onAddressUpdate(newAddress);
    }
  };

  // Format address for display
  const formatAddress = () => {
    const parts = [
      address.line1,
      address.line2,
      [address.city, address.state].filter(Boolean).join(', '),
      address.zipCode,
    ].filter(Boolean);

    return parts;
  };

  const addressParts = formatAddress();
  const hasAddress = addressParts.length > 0;

  return (
    <>
      <div
        className={cn(
          'relative group min-h-[40px] py-1',
          editable && 'cursor-pointer'
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasAddress ? (
          <div className='flex items-start gap-2'>
            <MapPin className='h-4 w-4 text-muted-foreground shrink-0 mt-0.5' />
            <div className='flex flex-col text-sm leading-tight'>
              {addressParts.map((part, i) => (
                <span key={i} className={i === 0 ? 'text-foreground' : 'text-muted-foreground'}>
                  {part}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className='text-xs text-muted-foreground'>{emptyText}</span>
        )}

        {/* Edit overlay */}
        {editable && isHovered && (
          <div className='absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm rounded-none'>
            <div className='flex items-center gap-2 text-fm-gold'>
              <Pencil className='h-4 w-4' />
              <span className='text-xs font-medium uppercase'>
                {hasAddress ? 'Edit' : 'Add'}
              </span>
            </div>
          </div>
        )}
      </div>

      {editable && (
        <FmAddressEditModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          address={address}
          onSave={handleSave}
        />
      )}
    </>
  );
}
