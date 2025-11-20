import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/shadcn/button';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/shared/services/logger';
import { useAuth } from '@/features/auth/services/AuthContext';

const DeveloperCreateOrganizationPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    profile_picture: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    if (!session?.user?.id) {
      toast.error('You must be logged in to create an organization');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('organizations').insert({
        name: formData.name.trim(),
        profile_picture: formData.profile_picture.trim() || null,
        owner_id: session.user.id,
      });

      if (error) throw error;

      toast.success('Organization created successfully');
      setFormData({
        name: '',
        profile_picture: '',
      });
      navigate('/developer/database?table=organizations');
    } catch (error) {
      logger.error('Error creating organization:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      toast.error('Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      profile_picture: '',
    });
    navigate('/developer/database?table=organizations');
  };

  return (
    <DemoLayout
      title='Create Organization'
      description='Register a new organization for event management.'
      icon={Building2}
      condensed
    >
      <div className='space-y-6'>
        <p className='text-sm text-muted-foreground'>
          Create a new organization profile for managing events and staff.
        </p>

        <div className='space-y-4'>
          <FmCommonTextField
            label='Organization Name'
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder='Enter organization name'
          />
          <FmFlexibleImageUpload
            label='Organization Logo'
            value={formData.profile_picture}
            onChange={url => setFormData({ ...formData, profile_picture: url })}
            bucket='organization-images'
            pathPrefix='organizations'
          />
        </div>

        {/* Form Actions */}
        <div className='flex gap-3 justify-end pt-4 border-t border-white/20'>
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={isSubmitting}
            className='bg-white/5 border-white/20 hover:bg-white/10'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Organization'}
          </Button>
        </div>
      </div>
    </DemoLayout>
  );
};

export default DeveloperCreateOrganizationPage;
