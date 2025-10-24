import { User, UserCog, Shield, UserX, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { FmCommonDropdown, DropdownItem } from '@/components/ui/FmCommonDropdown';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/shared/utils/utils';

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
  const [isOpen, setIsOpen] = useState(true);

  const roleItems: DropdownItem[] = (Object.keys(roleConfig) as DevRole[]).map((role) => ({
    label: roleConfig[role].label,
    onClick: () => onRoleChange(role),
    icon: roleConfig[role].icon,
  }));

  const CurrentIcon = roleConfig[currentRole].icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 hover:bg-white/5 transition-colors">
        <span className="font-screamer text-sm text-fm-gold">Role Select</span>
        <ChevronDown
          className={cn('h-4 w-4 text-fm-gold transition-transform', isOpen && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <p className="text-xs text-muted-foreground mb-3">
          Select a role to simulate during your session
        </p>
        <FmCommonDropdown
          trigger={
            <Button
              variant="outline"
              className="w-full justify-between bg-background/50 border-fm-gold/30 hover:bg-fm-gold/10"
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
      </CollapsibleContent>
    </Collapsible>
  );
};
