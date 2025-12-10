import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateEntityNavigation } from '@force-majeure/shared';
import { FmCommonCreateForm } from '@/components/common/forms/FmCommonCreateForm';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { supabase } from '@force-majeure/shared';
import { toast } from 'sonner';
import { logger } from '@force-majeure/shared';

const DeveloperCreateVenuePage = () => {
  const navigate = useNavigate();
  const { returnTo, navigateWithEntity } = useCreateEntityNavigation('newVenueId');
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    capacity: '',
    image_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Venue name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: venue, error } = await supabase.from('venues').insert({
        name: formData.name.trim(),
        website: formData.website.trim() || null,
        address_line_1: formData.address_line_1.trim() || null,
        address_line_2: formData.address_line_2.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim().toUpperCase() || null,
        zip_code: formData.zip_code.trim() || null,
        capacity: formData.capacity !== '' ? parseInt(formData.capacity, 10) : null,
        image_url: formData.image_url.trim() || null,
      }).select().single();

      if (error) throw error;

      toast.success('Venue created successfully');

      // Return to origin page with new entity, or go to database page
      if (returnTo) {
        const returnUrl = navigateWithEntity(venue.id);
        navigate(returnUrl!);
      } else {
        navigate('/developer/database?table=venues');
      }
    } catch (error) {
      // Enhanced error logging for Supabase errors
      const supabaseError = error as any;
      logger.error('Error creating venue:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: supabaseError?.code,
        details: supabaseError?.details,
        hint: supabaseError?.hint,
        statusCode: supabaseError?.statusCode,
        fullError: error,
      });

      // Show detailed error to user
      const errorMessage = supabaseError?.message || 'Failed to create venue';
      const errorHint = supabaseError?.hint ? ` (${supabaseError.hint})` : '';
      toast.error(`${errorMessage}${errorHint}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // If we came from a dropdown, go back there; otherwise go to database
    if (returnTo) {
      navigate(decodeURIComponent(returnTo));
    } else {
      setFormData({
        name: '',
        website: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        zip_code: '',
        capacity: '',
        image_url: '',
      });
      navigate('/developer/database');
    }
  };

  return (
    <FmCommonCreateForm
      title='Create Venue'
      description='Register a new venue with capacity and location details.'
      icon={MapPin}
      helperText='Provide venue metadata so events can reference accurate locations.'
      isSubmitting={isSubmitting || isImageUploading}
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
        label='Website'
        value={formData.website}
        onChange={e => setFormData({ ...formData, website: e.target.value })}
        placeholder='https://example.com'
      />

      {/* Address Section - Grouped */}
      <div className='space-y-[10px] p-[20px] border border-white/10 bg-black/20 backdrop-blur-sm'>
        <h3 className='text-sm font-canela uppercase tracking-wider text-fm-gold mb-[10px]'>
          Address
        </h3>

        {/* Stacked address lines with single label below */}
        <div className='space-y-0'>
          <FmCommonTextField
            value={formData.address_line_1}
            onChange={e =>
              setFormData({ ...formData, address_line_1: e.target.value })
            }
            placeholder='Street address'
          />
          <FmCommonTextField
            value={formData.address_line_2}
            onChange={e =>
              setFormData({ ...formData, address_line_2: e.target.value })
            }
            placeholder='Apt, suite, unit, etc. (optional)'
          />
          <p className='text-xs text-muted-foreground uppercase tracking-wider mt-1'>
            Address
          </p>
        </div>

        <div className='grid grid-cols-2 gap-[10px]'>
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
          />
        </div>

        <FmCommonTextField
          label='ZIP Code'
          value={formData.zip_code}
          onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
          placeholder='90001'
        />
      </div>

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
        onUploadStateChange={setIsImageUploading}
      />
    </FmCommonCreateForm>
  );
};

export default DeveloperCreateVenuePage;
