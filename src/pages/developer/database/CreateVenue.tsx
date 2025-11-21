import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FmCommonCreateForm } from '@/components/common/forms/FmCommonCreateForm';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/shared/services/logger';

const DeveloperCreateVenuePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    capacity: '',
    image_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Venue name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('venues').insert({
        name: formData.name.trim(),
        address_line_1: formData.address_line_1.trim() || null,
        address_line_2: formData.address_line_2.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim().toUpperCase() || null,
        zip_code: formData.zip_code.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        image_url: formData.image_url.trim() || null,
      });

      if (error) throw error;

      toast.success('Venue created successfully');
      setFormData({
        name: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        zip_code: '',
        capacity: '',
        image_url: '',
      });
      navigate('/developer/database');
    } catch (error) {
      logger.error('Error creating venue:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      toast.error('Failed to create venue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      capacity: '',
      image_url: '',
    });
    navigate('/developer/database');
  };

  return (
    <FmCommonCreateForm
      title='Create Venue'
      description='Register a new venue with capacity and location details.'
      icon={MapPin}
      helperText='Provide venue metadata so events can reference accurate locations.'
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitText='Create Venue'
    >
      <FmCommonTextField
        label='Venue Name'
        required
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder='Enter venue name'
      />

      <FmCommonTextField
        label='Address Line 1'
        value={formData.address_line_1}
        onChange={e =>
          setFormData({ ...formData, address_line_1: e.target.value })
        }
        placeholder='123 Main St'
        description='Street address'
      />

      <FmCommonTextField
        label='Address Line 2'
        value={formData.address_line_2}
        onChange={e =>
          setFormData({ ...formData, address_line_2: e.target.value })
        }
        placeholder='Suite 100'
        description='Apartment, suite, unit, building, floor, etc. (optional)'
      />

      <div className='grid grid-cols-2 gap-[20px]'>
        <FmCommonTextField
          label='City'
          value={formData.city}
          onChange={e => setFormData({ ...formData, city: e.target.value })}
          placeholder='Los Angeles'
        />
        <FmCommonTextField
          label='State'
          value={formData.state}
          onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
          placeholder='CA'
          description='Two-letter state code'
        />
      </div>

      <FmCommonTextField
        label='ZIP Code'
        value={formData.zip_code}
        onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
        placeholder='90001'
        description='5-digit ZIP code or ZIP+4 format'
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

      <FmFlexibleImageUpload
        label='Venue Image'
        value={formData.image_url}
        onChange={url => setFormData({ ...formData, image_url: url })}
        bucket='venue-images'
        pathPrefix='venues'
      />
    </FmCommonCreateForm>
  );
};

export default DeveloperCreateVenuePage;
