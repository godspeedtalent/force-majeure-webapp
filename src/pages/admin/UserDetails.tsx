import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { User, Mail, Calendar, Shield, Building2, ExternalLink } from 'lucide-react';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface UserDetails {
  id: string;
  email: string;
  display_name: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  organization_id?: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
  roles?: Array<{
    role_name: string;
    display_name: string;
    permissions: string[];
  }>;
  show_on_leaderboard: boolean;
}

export default function UserDetails() {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useQuery<UserDetails>({
    queryKey: ['user-details', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');

      // Get session for auth
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function to get user details
      const { data, error } = await supabase.functions.invoke('get-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Find the specific user
      const users = data.users || [];
      const foundUser = users.find((u: any) => u.id === id);

      if (!foundUser) throw new Error('User not found');

      return foundUser as UserDetails;
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

  if (error || !user) {
    toast.error(tToast('admin.userNotFound'));
    return (
      <Layout showBackButton onBack={handleBack} backButtonLabel={t('buttons.back')}>
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>{t('empty.noResults')}</p>
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
            <User className='h-8 w-8 text-fm-gold' />
            {user.display_name}
          </h1>
          <p className='text-muted-foreground mt-1'>{t('pageTitles.userDetails')}</p>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Column - Main Info */}
        <div className='md:col-span-2 space-y-6'>
          {/* Basic Information */}
          <FmCommonCard className='p-6'>
            <FmFormSectionHeader
              title={t('sections.basicInformation')}
              icon={User}
            />
            <FmCommonCardContent className='space-y-4 pt-6 px-0 pb-0'>
              {user.avatar_url && (
                <div>
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className='w-24 h-24 rounded-full border-2 border-fm-gold/30'
                  />
                </div>
              )}

              <div>
                <p className='text-lg font-medium'>{user.display_name}</p>
                <label className='text-xs uppercase tracking-wider text-muted-foreground'>{t('labels.username')}</label>
              </div>

              {user.full_name && (
                <div>
                  <p>{user.full_name}</p>
                  <label className='text-xs uppercase tracking-wider text-muted-foreground'>{t('labels.fullName')}</label>
                </div>
              )}

              <div>
                <p className='font-mono'>{user.email}</p>
                <label className='text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                  <Mail className='h-3 w-3' />
                  {t('labels.email')}
                </label>
              </div>

              <div>
                <p>{user.show_on_leaderboard ? t('labels.yes') : t('labels.no')}</p>
                <label className='text-xs uppercase tracking-wider text-muted-foreground'>{t('labels.showOnLeaderboard')}</label>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>

          {/* Organization */}
          {user.organization && (
            <FmCommonCard className='p-6'>
              <FmFormSectionHeader
                title={t('sections.organization')}
                icon={Building2}
              />
              <FmCommonCardContent className='pt-6 px-0 pb-0'>
                <p className='font-medium mb-3'>{user.organization.name}</p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => navigate(`/admin/organizations/${user.organization?.id}`)}
                  className='border-white/20 hover:bg-white/10'
                >
                  {t('buttons.viewOrganizationDetails')}
                </Button>
              </FmCommonCardContent>
            </FmCommonCard>
          )}

          {/* Roles & Permissions */}
          {user.roles && user.roles.length > 0 && (
            <FmCommonCard className='p-6'>
              <FmFormSectionHeader
                title={t('sections.rolesAndPermissions')}
                icon={Shield}
              />
              <FmCommonCardContent className='space-y-4 pt-6 px-0 pb-0'>
                {user.roles.map(role => (
                  <div key={role.role_name} className='space-y-2'>
                    <Badge variant='secondary' className='bg-fm-gold/20 text-fm-gold'>
                      {role.display_name}
                    </Badge>
                    <div className='ml-4 text-sm text-muted-foreground'>
                      {role.permissions.length === 1
                        ? t('sections.permissionCount', { count: role.permissions.length })
                        : t('sections.permissionCountPlural', { count: role.permissions.length })}
                      {role.permissions.length > 0 && (
                        <ul className='mt-2 space-y-1'>
                          {role.permissions.slice(0, 5).map((perm, idx) => (
                            <li key={idx}>• {perm}</li>
                          ))}
                          {role.permissions.length > 5 && (
                            <li>{t('sections.andMore', { count: role.permissions.length - 5 })}</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </FmCommonCardContent>
            </FmCommonCard>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className='space-y-6'>
          <FmCommonCard className='p-6'>
            <FmFormSectionHeader
              title={t('sections.metadata')}
              icon={Calendar}
            />
            <FmCommonCardContent className='space-y-3 pt-6 px-0 pb-0'>
              <div>
                <p className='font-mono text-sm'>{user.id}</p>
                <label className='text-xs uppercase tracking-wider text-muted-foreground'>{t('labels.userId')}</label>
              </div>

              <div>
                <p className='text-sm'>
                  {format(new Date(user.created_at), 'PPP')}
                </p>
                <label className='text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-3 w-3' />
                  {t('labels.created')}
                </label>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>

          <FmCommonCard className='p-6'>
            <FmFormSectionHeader
              title={t('sections.actions')}
              showDivider={false}
            />
            <FmCommonCardContent className='space-y-2 pt-4 px-0 pb-0'>
              <Button
                variant='outline'
                className='w-full border-white/20 hover:bg-white/10'
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <ExternalLink className='h-4 w-4 mr-2' />
                {t('buttons.viewPublicProfile')}
              </Button>
              <Button
                variant='outline'
                className='w-full border-white/20 hover:bg-white/10'
                onClick={() => navigate(`/admin/users`)}
              >
                {t('buttons.backToUsersList')}
              </Button>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </div>
    </div>
    </Layout>
  );
}
