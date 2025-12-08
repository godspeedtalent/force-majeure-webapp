import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, TrendingUp, Settings } from 'lucide-react';

import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonPageLayout } from '@/components/common/layout';
import { useUserPermissions } from '@force-majeure/shared/hooks/useUserRole';
import { PERMISSIONS } from '@force-majeure/shared/auth/permissions';

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
      <FmCommonPageLayout title='Org Dashboard'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </FmCommonPageLayout>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <FmCommonPageLayout
      title='Org Dashboard'
      subtitle='Manage your organization, staff, and view analytics'
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Sales Reports Card */}
        <FmCommonCard variant='outline' className='p-6'>
          <div className='flex items-start gap-4'>
            <div className='p-3 rounded-none bg-fm-gold/10 border border-fm-gold/20'>
              <TrendingUp className='h-6 w-6 text-fm-gold' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-canela mb-2'>Sales Reports</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                View event sales, revenue analytics, and ticket performance
              </p>
              <FmCommonButton
                variant='secondary'
                size='sm'
                onClick={() => navigate('/organization/sales')}
              >
                View Reports
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
              <h3 className='text-lg font-canela mb-2'>Venue Information</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Update venue details, capacity, and location information
              </p>
              <FmCommonButton
                variant='secondary'
                size='sm'
                onClick={() => navigate('/organization/venue')}
              >
                Manage Venue
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
              <h3 className='text-lg font-canela mb-2'>Staff Management</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Add, remove, and manage your organization's staff members
              </p>
              <FmCommonButton
                variant='secondary'
                size='sm'
                onClick={() => navigate('/organization/staff')}
              >
                Manage Staff
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
              <h3 className='text-lg font-canela mb-2'>Organization Profile</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Edit your organization's public profile and settings
              </p>
              <FmCommonButton
                variant='secondary'
                size='sm'
                onClick={() => navigate('/organization/profile')}
              >
                Edit Profile
              </FmCommonButton>
            </div>
          </div>
        </FmCommonCard>
      </div>
    </FmCommonPageLayout>
  );
};

export default OrganizationTools;
