import { Key, User, Building2, Code } from 'lucide-react';
import { Badge } from '@/components/common/shadcn/badge';

export interface RoleCellProps {
  roles:
    | Array<{
        role_name: string;
        display_name?: string;
      }>
    | null
    | undefined;
  onClick?: () => void;
  emptyText?: string;
}

const ROLE_ICONS = {
  admin: Key,
  developer: Code,
  org_admin: Building2,
  org_staff: User,
  user: User,
} as const;

const ROLE_COLORS = {
  admin: 'text-fm-danger',
  developer: 'text-fm-gold',
  org_admin: 'text-fm-navy',
  org_staff: 'text-muted-foreground',
  user: 'text-muted-foreground',
} as const;

/**
 * RoleCell - Displays user roles as badges
 *
 * Features:
 * - Role-specific icons and colors
 * - Click to manage roles (if onClick provided)
 * - Graceful handling of empty roles
 */
export function RoleCell({ roles, onClick, emptyText = 'No roles' }: RoleCellProps) {
  if (!roles || roles.length === 0) {
    return <span className='text-muted-foreground text-sm'>{emptyText}</span>;
  }

  return (
    <div
      className={`flex flex-wrap gap-1 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      {roles.map(role => {
        const roleName = role.role_name.toLowerCase();
        const Icon =
          ROLE_ICONS[roleName as keyof typeof ROLE_ICONS] || User;
        const colorClass =
          ROLE_COLORS[roleName as keyof typeof ROLE_COLORS] ||
          'text-muted-foreground';

        return (
          <Badge key={role.role_name} variant='outline' className='gap-1'>
            <Icon className={`h-3 w-3 ${colorClass}`} />
            <span className='text-xs'>
              {role.display_name || role.role_name}
            </span>
          </Badge>
        );
      })}
    </div>
  );
}
