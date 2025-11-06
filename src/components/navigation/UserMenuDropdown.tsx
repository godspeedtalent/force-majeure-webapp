import { LogOut, User as UserIcon, Building2, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/common/shadcn/avatar';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonDropdown, DropdownItem } from '@/components/common/forms/FmCommonDropdown';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';

/**
 * User menu dropdown component for authenticated users
 */
export function UserMenuDropdown() {
  const { user, signOut } = useAuth();
  const { hasRole, hasPermission } = useUserPermissions();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isOrgAdmin = hasRole(ROLES.ORG_ADMIN);
  const isOrgStaffer = hasRole(ROLES.ORG_STAFF);
  const isDeveloper = hasRole(ROLES.DEVELOPER);
  const isAdmin = hasRole(ROLES.ADMIN);
  
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
    ...(hasOrgToolsAccess ? [{
      label: 'Org Tools',
      icon: Building2,
      onClick: () => navigate('/organization/tools'),
      separator: true,
    }] : []),
    // Scanning for all org members, developers, and admins
    ...(hasScanningAccess ? [{
      label: 'Scanning',
      icon: Scan,
      onClick: () => navigate('/organization/scanning'),
      separator: !hasOrgToolsAccess, // Add separator if it's the first org item
    }] : []),
    {
      label: 'Sign Out',
      icon: LogOut,
      onClick: handleSignOut,
      variant: 'destructive' as const,
      separator: true,
    },
  ];

  return (
    <FmCommonDropdown
      trigger={
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback>
              {user?.user_metadata?.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      }
      items={dropdownItems}
    />
  );
}
