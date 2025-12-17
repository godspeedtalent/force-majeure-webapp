import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
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
      toast.error(tToast('validation.venueNameRequired'));
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

      toast.success(tToast('success.created'));

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
      const errorMessage = supabaseError?.message || tToast('error.create');
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
      title={t('createForms.venue.title')}
      description={t('createForms.venue.description')}
      icon={MapPin}
      helperText={t('createForms.venue.helperText')}
      isSubmitting={isSubmitting || isImageUploading}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitText={t('createForms.venue.submitText')}
    >
      <FmCommonTextField
        label={t('labels.venueName')}
        required
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder={t('placeholders.enterVenueName')}
      />

      <FmCommonTextField
        label={t('labels.website')}
        value={formData.website}
        onChange={e => setFormData({ ...formData, website: e.target.value })}
        placeholder={t('placeholders.exampleUrl')}
      />

      {/* Address Section - Grouped */}
      <div className='space-y-[10px] p-[20px] border border-white/10 bg-black/20 backdrop-blur-sm'>
        <h3 className='text-sm font-canela uppercase tracking-wider text-fm-gold mb-[10px]'>
          {t('labels.address')}
        </h3>

        {/* Stacked address lines with single label below */}
        <div className='space-y-0'>
          <FmCommonTextField
            value={formData.address_line_1}
            onChange={e =>
              setFormData({ ...formData, address_line_1: e.target.value })
            }
            placeholder={t('placeholders.streetAddress')}
          />
          <FmCommonTextField
            value={formData.address_line_2}
            onChange={e =>
              setFormData({ ...formData, address_line_2: e.target.value })
            }
            placeholder={t('placeholders.aptSuiteUnit')}
          />
          <p className='text-xs text-muted-foreground uppercase tracking-wider mt-1'>
            {t('labels.address')}
          </p>
        </div>

        <div className='grid grid-cols-2 gap-[10px]'>
          <FmCommonTextField
            label={t('labels.city')}
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            placeholder={t('placeholders.losAngeles')}
          />
          <FmCommonTextField
            label={t('labels.state')}
            value={formData.state}
            onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
            placeholder={t('placeholders.ca')}
          />
        </div>

        <FmCommonTextField
          label={t('labels.zipCode')}
          value={formData.zip_code}
          onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
          placeholder={t('placeholders.zipCode')}
        />
      </div>

      <FmCommonTextField
        label={t('labels.capacity')}
        type='number'
        value={formData.capacity}
        onChange={e =>
          setFormData({ ...formData, capacity: e.target.value })
        }
        placeholder={t('placeholders.capacity')}
      />

      <FmFlexibleImageUpload
        label={t('labels.venueImage')}
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
