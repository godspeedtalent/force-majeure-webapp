import * as React from 'react';
import {
  FmEntityAvatar,
  EntityType,
} from '@/components/common/display/FmEntityAvatar';
import { FmDataGridImageUploadModal } from '@/components/common/modals/FmDataGridImageUploadModal';
import { Pencil } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

export interface ImageCellProps {
  value: string | null | undefined;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'square' | 'circle';
  entityType?: EntityType;
  entityName?: string;
  onImageUpdate?: (newImageUrl: string) => void;
  editable?: boolean;
  bucket?: string;
  storagePath?: string;
}

/**
 * ImageCell - Displays an image in a data grid cell
 *
 * Features:
 * - Configurable size and shape
 * - Fallback to entity avatar if no image
 * - Clickable to upload/change image (if editable)
 * - 200x200px fixed size, fills cell
 * - Square aspect ratio with center crop
 * - Consistent with design system
 */
export function ImageCell({
  value,
  alt = 'Image',
  fallback,
  shape = 'square',
  entityType = 'user',
  entityName,
  onImageUpdate,
  editable = false,
  bucket,
  storagePath,
}: ImageCellProps) {
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const handleImageUploaded = (newImageUrl: string) => {
    if (onImageUpdate) {
      onImageUpdate(newImageUrl);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (editable) {
      setUploadModalOpen(true);
    }
  };

  // If no image, use entity avatar
  if (!value) {
    return (
      <>
        <div
          className={cn(
            'relative group',
            'h-[75px] w-[75px]',
            'flex items-center justify-center',
            'p-0 m-0',
            editable && 'cursor-pointer hover:opacity-80 transition-opacity'
          )}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <FmEntityAvatar
            imageUrl={value}
            displayName={fallback || entityName}
            entityType={entityType}
            size='xl'
            shape={shape}
            className='h-full w-full'
          />
          
          {editable && isHovered && (
            <div className='absolute inset-[12.5px] bg-black/60 flex items-center justify-center backdrop-blur-sm'>
              <div className='flex flex-col items-center gap-[5px] text-fm-gold'>
                <Pencil className='h-5 w-5' />
                <span className='text-[10px] font-medium uppercase'>Upload</span>
              </div>
            </div>
          )}
        </div>

        {editable && (
          <FmDataGridImageUploadModal
            open={uploadModalOpen}
            onOpenChange={setUploadModalOpen}
            currentImageUrl={value}
            entityName={entityName || 'Entity'}
            onImageUploaded={handleImageUploaded}
            bucket={bucket}
            storagePath={storagePath}
          />
        )}
      </>
    );
  }

  // Display image - 75x75px, fills entire cell, no padding
  return (
    <>
      <div
        className={cn(
          'relative group',
          'h-[75px] w-[75px]',
          'p-0 m-0',
          editable && 'cursor-pointer'
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={value}
          alt={alt}
          className={cn(
            'h-full w-full object-cover',
            'rounded-none',
            'border-none'
          )}
          style={{ objectPosition: 'center' }}
        />

        {editable && isHovered && (
          <div className='absolute inset-[12.5px] bg-black/60 flex items-center justify-center backdrop-blur-sm'>
            <div className='flex flex-col items-center gap-[5px] text-fm-gold'>
              <Pencil className='h-5 w-5' />
              <span className='text-[10px] font-medium uppercase'>Change</span>
            </div>
          </div>
        )}
      </div>

      {editable && (
        <FmDataGridImageUploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          currentImageUrl={value}
          entityName={entityName || 'Entity'}
          onImageUploaded={handleImageUploaded}
          bucket={bucket}
          storagePath={storagePath}
        />
      )}
    </>
  );
}
