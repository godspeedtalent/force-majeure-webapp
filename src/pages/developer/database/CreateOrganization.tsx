import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FmCommonCreateForm } from '@/components/common/forms/FmCommonCreateForm';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';

const DeveloperCreateOrganizationPage = () => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const navigate = useNavigate();
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    profile_picture: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(tToast('validation.organizationNameRequired'));
      return;
    }

    if (!session?.user?.id) {
      toast.error(tToast('auth.loginRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert({
          name: formData.name.trim(),
          profile_picture: formData.profile_picture.trim() || null,
          owner_id: session.user.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update the creator's profile with the new organization_id
      if (newOrg) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ organization_id: newOrg.id })
          .eq('user_id', session.user.id);

        if (profileError) {
          logger.error('Failed to update profile with organization_id:', {
            error: profileError.message,
            source: 'CreateOrganization',
            organizationId: newOrg.id,
          });
        }
      }

      toast.success(tToast('success.created'));
      setFormData({
        name: '',
        profile_picture: '',
      });
      navigate('/developer/database?table=organizations');
    } catch (error) {
      logger.error('Error creating organization:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      toast.error(tToast('error.create'));
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
    <FmCommonCreateForm
      title={t('createForms.organization.title')}
      description={t('createForms.organization.description')}
      icon={Building2}
      helperText={t('createForms.organization.helperText')}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitText={t('createForms.organization.submitText')}
      returnPath='/developer/database'
      returnQuery='table=organizations'
    >
      <FmCommonTextField
        label={t('labels.organizationName')}
        required
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder={t('placeholders.enterOrganizationName')}
      />

      <FmFlexibleImageUpload
        label={t('labels.organizationLogo')}
        value={formData.profile_picture}
        onChange={url => setFormData({ ...formData, profile_picture: url })}
        bucket='organization-images'
        pathPrefix='organizations'
      />
    </FmCommonCreateForm>
  );
};

export default DeveloperCreateOrganizationPage;
