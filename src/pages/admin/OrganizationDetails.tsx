import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { ArrowLeft, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { FmInstagramStoryButton } from '@/components/common/sharing';

import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  if (error || !organization) {
    toast.error(t('organization.loadFailed'));
    return (
      <Layout>
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>{t('organization.notFound')}</p>
          <Button onClick={() => navigate(-1)} className='mt-4'>
            {t('buttons.goBack')}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto py-8 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate(-1)}
            className='border-white/20 hover:bg-white/10'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            {t('buttons.back')}
          </Button>
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-3'>
              <Building2 className='h-8 w-8 text-fm-gold' />
              {organization.name}
            </h1>
            <p className='text-muted-foreground mt-1'>{t('organization.details')}</p>
          </div>
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
          <FmCommonCard>
            <FmCommonCardHeader>
              <FmCommonCardTitle>{t('organization.basicInfo')}</FmCommonCardTitle>
            </FmCommonCardHeader>
            <FmCommonCardContent className='space-y-4'>
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
                <label className='text-sm text-muted-foreground'>{t('labels.name')}</label>
                <p className='text-lg font-medium'>{organization.name}</p>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>

        {/* Right Column - Metadata */}
        <div className='space-y-6'>
          <FmCommonCard>
            <FmCommonCardHeader>
              <FmCommonCardTitle>{t('organization.metadata')}</FmCommonCardTitle>
            </FmCommonCardHeader>
            <FmCommonCardContent className='space-y-3'>
              <div>
                <label className='text-sm text-muted-foreground'>{t('organization.organizationId')}</label>
                <p className='font-mono text-sm'>{organization.id}</p>
              </div>

              <div>
                <label className='text-sm text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  {t('labels.created')}
                </label>
                <p className='text-sm'>
                  {format(new Date(organization.created_at), 'PPP')}
                </p>
              </div>

              <div>
                <label className='text-sm text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  {t('labels.lastUpdated')}
                </label>
                <p className='text-sm'>
                  {format(new Date(organization.updated_at), 'PPP')}
                </p>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>

          <FmCommonCard>
            <FmCommonCardHeader>
              <FmCommonCardTitle>{t('labels.actions')}</FmCommonCardTitle>
            </FmCommonCardHeader>
            <FmCommonCardContent className='space-y-2'>
              <Button
                variant='outline'
                className='w-full border-white/20 hover:bg-white/10'
                onClick={() => navigate(`/admin/organizations`)}
              >
                {t('organization.backToList')}
              </Button>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </div>
    </div>
    </Layout>
  );
}
