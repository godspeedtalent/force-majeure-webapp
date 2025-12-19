import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, TrendingUp, Settings } from 'lucide-react';

import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonPageLayout } from '@/components/common/layout';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS } from '@/shared';

/**
 * OrganizationTools - Main dashboard for organization admins
 *
 * Features:
 * - Sales reports
 * - Venue management
 * - Staff management
 * - Organization profile
 */
const OrganizationTools = () => {
  const { t } = useTranslation('common');
  const { hasAnyPermission, roles } = useUserPermissions();
  const navigate = useNavigate();
  const isLoading = !roles;

  // Check for organization access permission
  const hasAccess = hasAnyPermission(
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.VIEW_ORGANIZATION
  );

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate('/');
    }
  }, [isLoading, navigate, hasAccess]);

  if (isLoading) {
    return (
      <FmCommonPageLayout title={t('organization.dashboard.title')}>
        <div className='flex items-center justify-center min-h-[400px]'>
          <p className='text-muted-foreground'>{t('status.loading')}</p>
        </div>
      </FmCommonPageLayout>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <FmCommonPageLayout
      title={t('organization.dashboard.title')}
      subtitle={t('organization.dashboard.subtitle')}
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Sales Reports Card */}
        <FmCommonCard variant='outline' className='p-6'>
          <div className='flex items-start gap-4'>
            <div className='p-3 rounded-none bg-fm-gold/10 border border-fm-gold/20'>
              <TrendingUp className='h-6 w-6 text-fm-gold' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-canela mb-2'>{t('organization.dashboard.salesReports')}</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                {t('organization.dashboard.salesReportsDescription')}
              </p>
              <FmCommonButton
                variant='secondary'
                size='sm'
                onClick={() => navigate('/organization/sales')}
              >
                {t('organization.dashboard.viewReports')}
              </FmCommonButton>
            </div>
          </div>
        </FmCommonCard>

        {/* Venue Management Card */}
        <FmCommonCard variant='outline' className='p-6'>
          <div className='flex items-start gap-4'>
            <div className='p-3 rounded-none bg-fm-gold/10 border border-fm-gold/20'>
              <Building2 className='h-6 w-6 text-fm-gold' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-canela mb-2'>{t('organization.dashboard.venueInfo')}</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                {t('organization.dashboard.venueInfoDescription')}
              </p>
              <FmCommonButton
                variant='secondary'
                size='sm'
                onClick={() => navigate('/organization/venue')}
              >
                {t('organization.dashboard.manageVenue')}
              </FmCommonButton>
            </div>
          </div>
        </FmCommonCard>

        {/* Staff Management Card */}
        <FmCommonCard variant='outline' className='p-6'>
          <div className='flex items-start gap-4'>
            <div className='p-3 rounded-none bg-fm-gold/10 border border-fm-gold/20'>
              <Users className='h-6 w-6 text-fm-gold' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-canela mb-2'>{t('organization.dashboard.staffManagement')}</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                {t('organization.dashboard.staffManagementDescription')}
              </p>
              <FmCommonButton
                variant='secondary'
                size='sm'
                onClick={() => navigate('/organization/staff')}
              >
                {t('organization.dashboard.manageStaff')}
              </FmCommonButton>
            </div>
          </div>
        </FmCommonCard>

        {/* Organization Profile Card */}
        <FmCommonCard variant='outline' className='p-6'>
          <div className='flex items-start gap-4'>
            <div className='p-3 rounded-none bg-fm-gold/10 border border-fm-gold/20'>
              <Settings className='h-6 w-6 text-fm-gold' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-canela mb-2'>{t('organization.dashboard.organizationProfile')}</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                {t('organization.dashboard.organizationProfileDescription')}
              </p>
              <FmCommonButton
                variant='secondary'
                size='sm'
                onClick={() => navigate('/organization/profile')}
              >
                {t('organization.dashboard.editProfile')}
              </FmCommonButton>
            </div>
          </div>
        </FmCommonCard>
      </div>
    </FmCommonPageLayout>
  );
};

export default OrganizationTools;
