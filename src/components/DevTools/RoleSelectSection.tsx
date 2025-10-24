import { User, UserCog, Shield, UserX, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FmCommonDropdown, DropdownItem } from '@/components/ui/FmCommonDropdown';
import { Button } from '@/components/ui/button';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';
import type { DevRole } from '@/contexts/DevToolsContext';

interface RoleSelectSectionProps {
  currentRole: DevRole | null;
  onRoleChange: (role: DevRole) => void;
}

const roleConfig: Record<DevRole, { label: string; icon: typeof User }> = {
  unauthenticated: { label: 'Unauthenticated', icon: UserX },
  fan: { label: 'Fan (User)', icon: User },
  developer: { label: 'Developer', icon: UserCog },
  admin: { label: 'Admin', icon: Shield },
};

export const RoleSelectSection = ({ currentRole, onRoleChange }: RoleSelectSectionProps) => {
  const navigate = useNavigate();
  
  const roleItems: DropdownItem[] = (Object.keys(roleConfig) as DevRole[]).map((role) => ({
    label: roleConfig[role].label,
    onClick: () => onRoleChange(role),
    icon: roleConfig[role].icon,
  }));

  const effectiveRole = currentRole || 'fan';
  const CurrentIcon = roleConfig[effectiveRole].icon;

  return (
    <FmCommonToggleHeader title="Role Select">
      <div className="space-y-3">
        <Button
          onClick={() => navigate('/demo')}
          variant="outline"
          className="w-full bg-fm-gold/10 border-fm-gold/30 hover:bg-fm-gold/20 hover:border-fm-gold text-white"
        >
          <Compass className="h-4 w-4 mr-2" />
          Go to Demos
        </Button>
        
        <div>
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
                  {roleConfig[effectiveRole].label}
                </span>
              </Button>
            }
            items={roleItems}
            align="start"
          />
        </div>
      </div>
    </FmCommonToggleHeader>
  );
};
