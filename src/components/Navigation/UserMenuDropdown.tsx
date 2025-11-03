import { LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/common/shadcn/avatar';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonDropdown, DropdownItem } from '@/components/common/forms/FmCommonDropdown';
import { useAuth } from '@/features/auth/services/AuthContext';

/**
 * User menu dropdown component for authenticated users
 */
export function UserMenuDropdown() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const dropdownItems: DropdownItem[] = [
    {
      label: 'Profile',
      icon: UserIcon,
      onClick: () => navigate('/profile'),
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      onClick: handleSignOut,
      variant: 'destructive',
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
