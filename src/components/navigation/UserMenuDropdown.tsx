import { LogOut, User as UserIcon, Building2, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/common/shadcn/avatar';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonDropdown, DropdownItem } from '@/components/common/forms/FmCommonDropdown';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserRole } from '@/shared/hooks/useUserRole';

/**
 * User menu dropdown component for authenticated users
 */
export function UserMenuDropdown() {
  const { user, signOut } = useAuth();
  const { data: role } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isOrgAdmin = role === ('organization_admin' as any);
  const isOrgStaffer = role === ('organization_staffer' as any);
  const isDeveloper = role === ('developer' as any);
  const isAdmin = role === ('admin' as any);
  
  // Org tools access: organization_admin, developer, or admin
  const hasOrgToolsAccess = isOrgAdmin || isDeveloper || isAdmin;
  // Scanning access: all org members, developers, and admins
  const hasScanningAccess = isOrgAdmin || isOrgStaffer || isDeveloper || isAdmin;

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
