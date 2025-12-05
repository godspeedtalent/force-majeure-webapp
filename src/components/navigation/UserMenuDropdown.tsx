import { LogOut, User as UserIcon, Building2, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/shadcn/button';
import {
  FmCommonDropdown,
  DropdownItem,
} from '@/components/common/forms/FmCommonDropdown';
import { FmUserAvatar } from '@/components/common/display/FmUserAvatar';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AdminLockIndicator } from '@/components/common/indicators';

/**
 * User menu dropdown component for authenticated users
 */
export function UserMenuDropdown() {
  const { user, profile, signOut } = useAuth();
  const { hasPermission } = useUserPermissions();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Org tools access: manage_organization permission
  const hasOrgToolsAccess = hasPermission(PERMISSIONS.MANAGE_ORGANIZATION);
  // Scanning access: scan_tickets permission
  const hasScanningAccess = hasPermission(PERMISSIONS.SCAN_TICKETS);

  const dropdownItems: DropdownItem[] = [
    {
      label: 'Profile',
      icon: UserIcon,
      onClick: () => navigate('/profile'),
    },
    // Organization tools for admins, developers, and org admins
    ...(hasOrgToolsAccess
      ? [
          {
            label: 'Org Tools',
            icon: Building2,
            onClick: () => navigate('/organization/tools'),
            separator: true,
            badge: <AdminLockIndicator position="inline" size="xs" tooltipText="Requires admin permissions" />,
          },
        ]
      : []),
    // Scanning for all org members, developers, and admins
    ...(hasScanningAccess
      ? [
          {
            label: 'Scanning',
            icon: Scan,
            onClick: () => navigate('/organization/scanning'),
            separator: !hasOrgToolsAccess, // Add separator if it's the first org item
            badge: <AdminLockIndicator position="inline" size="xs" tooltipText="Requires scanning permissions" />,
          },
        ]
      : []),
    {
      label: 'Sign Out',
      icon: LogOut,
      onClick: handleSignOut,
      variant: 'muted' as const,
      separator: true,
    },
  ];

  return (
    <FmCommonDropdown
      trigger={
        <Button variant='ghost' className='relative h-8 w-8 p-0'>
          <FmUserAvatar
            avatarUrl={profile?.avatar_url}
            displayName={profile?.display_name || user?.user_metadata?.display_name}
            size='sm'
          />
        </Button>
      }
      items={dropdownItems}
      hideChevron
    />
  );
}
