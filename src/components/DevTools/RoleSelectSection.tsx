import { User, UserCog, Shield, UserX } from 'lucide-react';
import { FmCommonDropdown, DropdownItem } from '@/components/ui/FmCommonDropdown';
import { Button } from '@/components/ui/button';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';

export type DevRole = 'unauthenticated' | 'fan' | 'admin' | 'developer';

interface RoleSelectSectionProps {
  currentRole: DevRole;
  onRoleChange: (role: DevRole) => void;
}

const roleConfig: Record<DevRole, { label: string; icon: typeof User }> = {
  unauthenticated: { label: 'Unauthenticated', icon: UserX },
  fan: { label: 'Fan (User)', icon: User },
  developer: { label: 'Developer', icon: UserCog },
  admin: { label: 'Admin', icon: Shield },
};

export const RoleSelectSection = ({ currentRole, onRoleChange }: RoleSelectSectionProps) => {
  const roleItems: DropdownItem[] = (Object.keys(roleConfig) as DevRole[]).map((role) => ({
    label: roleConfig[role].label,
    onClick: () => onRoleChange(role),
    icon: roleConfig[role].icon,
  }));

  const CurrentIcon = roleConfig[currentRole].icon;

  return (
    <FmCommonToggleHeader title="Role Select">
      <p className="text-xs text-white/60 mb-3">
        Select a role to simulate during your session
      </p>
      <FmCommonDropdown
        trigger={
          <Button
            variant="outline"
            className="w-full justify-between bg-white/5 border-white/30 hover:bg-white/10 text-white pr-10"
          >
            <span className="flex items-center gap-2">
              <CurrentIcon className="h-4 w-4" />
              {roleConfig[currentRole].label}
            </span>
          </Button>
        }
        items={roleItems}
        align="start"
      />
    </FmCommonToggleHeader>
  );
};
