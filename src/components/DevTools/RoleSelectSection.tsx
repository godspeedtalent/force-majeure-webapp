import { User, UserCog, Shield, UserX, BarChart3, Settings, FlaskConical, Package } from 'lucide-react';
import { FmCommonDropdown, DropdownItem } from '@/components/common/forms/FmCommonDropdown';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonToggleHeader } from '@/components/common/forms/FmCommonToggleHeader';
import { FmCommonNavigationButton } from '@/components/common/buttons/FmCommonNavigationButton';
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
  const roleItems: DropdownItem[] = (Object.keys(roleConfig) as DevRole[]).map((role) => ({
    label: roleConfig[role].label,
    onClick: () => onRoleChange(role),
    icon: roleConfig[role].icon,
  }));

  const effectiveRole = currentRole || 'fan';
  const CurrentIcon = roleConfig[effectiveRole].icon;

  return (
    <div className="space-y-6">
      <FmCommonToggleHeader title="Quick Navigation" defaultOpen={true}>
        <div className="space-y-2">
          <p className="text-xs text-white/50 mb-3">
            Quick navigation to developer-only pages and tools
          </p>
          <FmCommonNavigationButton
            to="/developer"
            label="Developer Tools"
            icon={Package}
            description="Component catalog and developer resources"
            variant="outline"
          />
          <FmCommonNavigationButton
            to="/testing"
            label="Testing Dashboard"
            icon={FlaskConical}
            description="Run smoke tests and validations"
            variant="outline"
          />
          <FmCommonNavigationButton
            to="/admin/statistics"
            label="Statistics"
            icon={BarChart3}
            description="View application metrics"
            variant="outline"
          />
          <FmCommonNavigationButton
            to="/admin/controls"
            label="Admin Controls"
            icon={Settings}
            description="Manage users and settings"
            variant="outline"
          />
        </div>
      </FmCommonToggleHeader>

      <FmCommonToggleHeader title="Role Select" defaultOpen={true}>
        <div>
          <p className="text-xs text-white/50 mb-3">
            Simulate different user roles to test permissions and access control
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
      </FmCommonToggleHeader>
    </div>
  );
};
