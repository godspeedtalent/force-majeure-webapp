import { useTranslation } from 'react-i18next';
import {
  User,
  UserCog,
  Key,
  UserX,
  BarChart3,
  Settings,
  FlaskConical,
  Package,
} from 'lucide-react';
import {
  FmCommonDropdown,
  DropdownItem,
} from '@/components/common/forms/FmCommonDropdown';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonToggleHeader } from '@/components/common/forms/FmCommonToggleHeader';
import { FmCommonNavigationButton } from '@/components/common/buttons/FmCommonNavigationButton';

export type DevRole = 'unauthenticated' | 'fan' | 'developer' | 'admin';

interface RoleSelectSectionProps {
  currentRole: DevRole | null;
  onRoleChange: (role: DevRole) => void;
}

const roleIcons: Record<DevRole, typeof User> = {
  unauthenticated: UserX,
  fan: User,
  developer: UserCog,
  admin: Key,
};

export const RoleSelectSection = ({
  currentRole,
  onRoleChange,
}: RoleSelectSectionProps) => {
  const { t } = useTranslation('common');

  const getRoleLabel = (role: DevRole) => t(`roleSelect.roles.${role}`);

  const roleItems: DropdownItem[] = (Object.keys(roleIcons) as DevRole[]).map(
    role => ({
      label: getRoleLabel(role),
      onClick: () => onRoleChange(role),
      icon: roleIcons[role],
    })
  );

  const effectiveRole = currentRole || 'fan';
  const CurrentIcon = roleIcons[effectiveRole];

  return (
    <div className='space-y-6'>
      <FmCommonToggleHeader title={t('roleSelect.quickNavigation')} defaultOpen={true}>
        <div className='space-y-2'>
          <p className='text-xs text-white/50 mb-3'>
            {t('roleSelect.quickNavigationDescription')}
          </p>
          <FmCommonNavigationButton
            to='/developer'
            label={t('roleSelect.nav.developerTools')}
            icon={Package}
            description={t('roleSelect.nav.developerToolsDescription')}
            variant='outline'
          />
          <FmCommonNavigationButton
            to='/testing'
            label={t('roleSelect.nav.testingDashboard')}
            icon={FlaskConical}
            description={t('roleSelect.nav.testingDashboardDescription')}
            variant='outline'
          />
          <FmCommonNavigationButton
            to='/admin/statistics'
            label={t('roleSelect.nav.statistics')}
            icon={BarChart3}
            description={t('roleSelect.nav.statisticsDescription')}
            variant='outline'
          />
          <FmCommonNavigationButton
            to='/admin/controls'
            label={t('roleSelect.nav.adminControls')}
            icon={Settings}
            description={t('roleSelect.nav.adminControlsDescription')}
            variant='outline'
          />
        </div>
      </FmCommonToggleHeader>

      <FmCommonToggleHeader title={t('roleSelect.title')} defaultOpen={true}>
        <div>
          <p className='text-xs text-white/50 mb-3'>
            {t('roleSelect.description')}
          </p>
          <FmCommonDropdown
            trigger={
              <Button
                variant='outline'
                className='w-full justify-between bg-white/5 border-white/30 hover:bg-white/10 text-white pr-10'
              >
                <span className='flex items-center gap-2'>
                  <CurrentIcon className='h-4 w-4' />
                  {getRoleLabel(effectiveRole)}
                </span>
              </Button>
            }
            items={roleItems}
            align='start'
          />
        </div>
      </FmCommonToggleHeader>
    </div>
  );
};
