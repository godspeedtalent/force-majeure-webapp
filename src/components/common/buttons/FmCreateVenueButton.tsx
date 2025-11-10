import { useState } from 'react';
import { FmCommonCreateButton } from './FmCommonCreateButton';
import { FmCommonFormModal } from '@/components/common/modals/FmCommonFormModal';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Button } from '@/components/common/shadcn/button';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';

interface FmCreateVenueButtonProps {
  onModalOpen?: () => void;
  variant?: 'default' | 'outline';
  className?: string;
  mode?: 'button' | 'standalone';
  onClose?: () => void;
}

export const FmCreateVenueButton = ({
  onModalOpen,
  variant = 'outline',
  className,
  mode = 'button',
  onClose,
}: FmCreateVenueButtonProps) => {
  const isStandalone = mode === 'standalone';
  const [isModalOpen, setIsModalOpen] = useState(isStandalone);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    capacity: '',
    website: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = () => {
    if (isStandalone) {
      return;
    }
    onModalOpen?.();
    setIsModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open && isStandalone) {
      onClose?.();
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Venue name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('venues').insert({
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        website: formData.website.trim() || null,
      });

      if (error) throw error;

      toast.success('Venue created successfully');
      setIsModalOpen(false);
      if (isStandalone) {
        onClose?.();
      }
      setFormData({
        name: '',
        address: '',
        city: '',
        capacity: '',
        website: '',
      });
    } catch (error) {
      logger.error('Error creating venue:', error);
      toast.error('Failed to create venue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    {
      content: (
        <div className='space-y-4'>
          <FmCommonTextField
            label='Venue Name'
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder='Enter venue name'
          />
          <FmCommonTextField
            label='Address'
            value={formData.address}
            onChange={e =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder='123 Main St'
          />
          <FmCommonTextField
            label='City'
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            placeholder='Los Angeles'
          />
          <FmCommonTextField
            label='Capacity'
            type='number'
            value={formData.capacity}
            onChange={e =>
              setFormData({ ...formData, capacity: e.target.value })
            }
            placeholder='500'
          />
          <FmCommonTextField
            label='Website'
            value={formData.website}
            onChange={e =>
              setFormData({ ...formData, website: e.target.value })
            }
            placeholder='https://example.com'
          />
        </div>
      ),
    },
  ];

  const actions = (
    <div className='flex gap-3 justify-end'>
      <Button
        variant='outline'
        onClick={() => handleModalOpenChange(false)}
        disabled={isSubmitting}
        className='bg-white/5 border-white/20 hover:bg-white/10'
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className='bg-fm-gold hover:bg-fm-gold/90 text-black'
      >
        {isSubmitting ? 'Creating...' : 'Create Venue'}
      </Button>
    </div>
  );

  return (
    <>
      {mode === 'button' && (
        <FmCommonCreateButton
          onClick={handleClick}
          label='Create Venue'
          variant={variant}
          className={className}
        />
      )}
      <FmCommonFormModal
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
        title='Create New Venue'
        description='Add a new venue to the database'
        sections={sections}
        actions={actions}
        className='z-[200]'
      />
    </>
  );
};
