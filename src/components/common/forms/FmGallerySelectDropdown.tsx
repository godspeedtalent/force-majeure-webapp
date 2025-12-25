/**
 * FmGallerySelectDropdown
 *
 * Reusable dropdown component for selecting media galleries.
 * Includes inline gallery creation capability.
 */

import { useState, useCallback, ChangeEvent } from 'react';
import { ChevronDown, Check, FolderPlus, Plus } from 'lucide-react';
import { useGalleryManagement } from '@/features/media/hooks/useGalleryManagement';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import type { MediaGallery } from '@/features/media/types';
import { cn } from '@/shared';

export interface FmGallerySelectDropdownProps {
  /** Currently selected gallery */
  value?: MediaGallery | null;
  /** Callback when gallery selection changes */
  onChange?: (gallery: MediaGallery | null) => void;
  /** Placeholder text when no gallery is selected */
  placeholder?: string;
  /** Whether to show the create gallery option */
  showCreateOption?: boolean;
  /** Additional class names for the trigger button */
  className?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Dropdown content alignment */
  align?: 'start' | 'center' | 'end';
  /** Width of the dropdown content */
  contentWidth?: string;
}

export const FmGallerySelectDropdown = ({
  value,
  onChange,
  placeholder = 'Select gallery',
  showCreateOption = true,
  className,
  disabled = false,
  align = 'start',
  contentWidth = 'w-64',
}: FmGallerySelectDropdownProps) => {
  const {
    galleries,
    galleriesLoading,
    selectedGallery: hookSelectedGallery,
    setSelectedGallery: hookSetSelectedGallery,
    createGallery,
  } = useGalleryManagement();

  // Use controlled value if provided, otherwise fall back to hook state
  const selectedGallery = value !== undefined ? value : hookSelectedGallery;
  const setSelectedGallery = onChange || hookSetSelectedGallery;

  // Create gallery modal state
  const [showCreateGallery, setShowCreateGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [newGallerySlug, setNewGallerySlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectGallery = useCallback(
    (gallery: MediaGallery) => {
      setSelectedGallery(gallery);
    },
    [setSelectedGallery]
  );

  const handleCreateGallery = async () => {
    if (!newGalleryName || !newGallerySlug) return;

    setIsCreating(true);
    try {
      const gallery = await createGallery({
        name: newGalleryName,
        slug: newGallerySlug
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-'),
      });

      if (gallery) {
        setShowCreateGallery(false);
        setNewGalleryName('');
        setNewGallerySlug('');
        setSelectedGallery(gallery);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewGalleryName(name);
    // Auto-generate slug from name
    setNewGallerySlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            className={cn(
              'flex items-center justify-between px-3 py-2',
              'bg-white/5 border border-white/10',
              'hover:border-white/20 transition-colors text-left',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
          >
            <span className='font-canela text-sm truncate'>
              {selectedGallery?.name || placeholder}
            </span>
            <ChevronDown className='w-4 h-4 text-muted-foreground ml-2 flex-shrink-0' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className={contentWidth}>
          {galleriesLoading ? (
            <div className='p-3 text-center'>
              <FmCommonLoadingSpinner size='sm' />
            </div>
          ) : galleries.length === 0 && !showCreateOption ? (
            <div className='p-3 text-sm text-muted-foreground text-center'>
              No galleries available
            </div>
          ) : (
            <>
              {galleries.length === 0 ? (
                <div className='p-3 text-sm text-muted-foreground text-center'>
                  No galleries yet
                </div>
              ) : (
                galleries.map(gallery => (
                  <DropdownMenuItem
                    key={gallery.id}
                    onClick={() => handleSelectGallery(gallery)}
                    className='flex items-center justify-between cursor-pointer'
                  >
                    <div className='flex flex-col'>
                      <span className='font-canela'>{gallery.name}</span>
                      <span className='text-xs text-muted-foreground font-mono'>
                        {gallery.slug}
                      </span>
                    </div>
                    {selectedGallery?.id === gallery.id && (
                      <Check className='w-4 h-4 text-fm-gold flex-shrink-0' />
                    )}
                  </DropdownMenuItem>
                ))
              )}

              {showCreateOption && (
                <>
                  {galleries.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => setShowCreateGallery(true)}
                    className='flex items-center gap-2 cursor-pointer text-fm-gold'
                  >
                    <Plus className='w-4 h-4' />
                    <span>Create new gallery</span>
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Gallery Dialog */}
      <Dialog open={showCreateGallery} onOpenChange={setShowCreateGallery}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FolderPlus className='w-5 h-5' />
              Create gallery
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <FmCommonTextField
              label='Name'
              value={newGalleryName}
              onChange={handleNameChange}
              placeholder='Artist Signup Carousel'
              autoFocus
            />
            <FmCommonTextField
              label='Slug'
              value={newGallerySlug}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewGallerySlug(e.target.value)
              }
              placeholder='artist-signup-carousel'
              description='URL-safe identifier used in code'
            />
          </div>
          <DialogFooter>
            <FmCommonButton
              variant='secondary'
              onClick={() => setShowCreateGallery(false)}
              disabled={isCreating}
            >
              Cancel
            </FmCommonButton>
            <FmCommonButton
              variant='gold'
              onClick={handleCreateGallery}
              disabled={!newGalleryName || !newGallerySlug || isCreating}
            >
              {isCreating ? (
                <>
                  <FmCommonLoadingSpinner size='sm' className='mr-2' />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </FmCommonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FmGallerySelectDropdown;
