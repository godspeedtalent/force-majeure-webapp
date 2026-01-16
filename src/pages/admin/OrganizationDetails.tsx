import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { Building2, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import { FmInstagramStoryButton } from '@/components/common/sharing';

import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EntityDeletionActions } from '@/components/common/entity/EntityDeletionActions';

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

export default function OrganizationDetails() {
  const { t } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: organization, isLoading, error } = useQuery({
    queryKey: ['organization', id],
    queryFn: async (): Promise<Organization> => {
      if (!id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Organization not found');
      return data as Organization;
    },
    enabled: !!id,
  });

  const handleBack = () => navigate(-1);

  if (isLoading) {
    return (
      <Layout showBackButton onBack={handleBack} backButtonLabel={t('buttons.back')}>
        <div className='flex items-center justify-center min-h-[400px]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  if (error || !organization) {
    toast.error(t('organization.loadFailed'));
    return (
      <Layout showBackButton onBack={handleBack} backButtonLabel={t('buttons.back')}>
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>{t('organization.notFound')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton onBack={handleBack} backButtonLabel={t('buttons.back')}>
      <div className='container mx-auto py-8 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-3'>
            <Building2 className='h-8 w-8 text-fm-gold' />
            {organization.name}
          </h1>
          <p className='text-muted-foreground mt-1'>{t('organization.details')}</p>
        </div>

        {/* Instagram Story Button - Mobile only */}
        <FmInstagramStoryButton
          entityType='organization'
          entityData={{
            id: organization.id,
            heroImage: organization.profile_picture || null,
            title: organization.name,
            logoUrl: organization.profile_picture,
          }}
          variant='icon'
        />
      </div>

      <Separator />

      {/* Main Content */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Column - Main Info */}
        <div className='md:col-span-2 space-y-6'>
          {/* Basic Information */}
          <FmCommonCard className='p-6'>
            <FmFormSectionHeader
              title={t('organization.basicInfo')}
              icon={Building2}
            />
            <FmCommonCardContent className='space-y-4 pt-6 px-0 pb-0'>
              {organization.profile_picture && (
                <div>
                  <img
                    src={organization.profile_picture}
                    alt={organization.name}
                    className='w-32 h-32 object-cover rounded-none border-2 border-fm-gold/30'
                  />
                </div>
              )}

              <div>
                <p className='text-lg font-medium'>{organization.name}</p>
                <label className='text-xs uppercase tracking-wider text-muted-foreground'>{t('labels.name')}</label>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>

        {/* Right Column - Metadata */}
        <div className='space-y-6'>
          <FmCommonCard className='p-6'>
            <FmFormSectionHeader
              title={t('organization.metadata')}
              icon={Calendar}
            />
            <FmCommonCardContent className='space-y-3 pt-6 px-0 pb-0'>
              <div>
                <p className='font-mono text-sm'>{organization.id}</p>
                <label className='text-xs uppercase tracking-wider text-muted-foreground'>{t('organization.organizationId')}</label>
              </div>

              <div>
                <p className='text-sm'>
                  {format(new Date(organization.created_at), 'PPP')}
                </p>
                <label className='text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-3 w-3' />
                  {t('labels.created')}
                </label>
              </div>

              <div>
                <p className='text-sm'>
                  {format(new Date(organization.updated_at), 'PPP')}
                </p>
                <label className='text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-3 w-3' />
                  {t('labels.lastUpdated')}
                </label>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>

          <FmCommonCard className='p-6'>
            <FmFormSectionHeader
              title={t('labels.actions')}
              icon={Settings}
              showDivider={false}
            />
            <FmCommonCardContent className='space-y-2 pt-4 px-0 pb-0'>
              <Button
                variant='outline'
                className='w-full border-white/20 hover:bg-white/10'
                onClick={() => navigate(`/admin/organizations`)}
              >
                {t('organization.backToList')}
              </Button>
              <EntityDeletionActions
                entityType='organization'
                entityId={organization.id}
                entityName={organization.name}
                onDeleted={() => navigate('/admin/organizations')}
              />
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </div>
    </div>
    </Layout>
  );
}
