import { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/common/shadcn/context-menu';
import { cn } from '@/shared/utils/utils';

export interface ContextMenuAction<T = any> {
  label: string;
  icon?: ReactNode;
  onClick: (data: T) => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  iconPosition?: 'left' | 'right'; // Position of the icon
  separator?: boolean; // Add a separator after this item
}

interface FmCommonContextMenuProps<T = any> {
  children: ReactNode;
  actions: ContextMenuAction<T>[];
  data: T;
  onOpenChange?: (open: boolean) => void;
}

export function FmCommonContextMenu<T = any>({
  children,
  actions,
  data,
  onOpenChange,
}: FmCommonContextMenuProps<T>) {
  if (actions.length === 0) {
    return <>{children}</>;
  }

  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-popover border-border">
        {actions.map((action, idx) => {
          const iconOnRight = action.iconPosition === 'right';
          return (
            <div key={idx}>
              <ContextMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(data);
                }}
                disabled={action.disabled}
                className={cn(
                  'cursor-pointer transition-colors duration-200',
                  action.variant === 'destructive' && 'text-destructive focus:text-destructive focus:bg-destructive/10',
                  iconOnRight && 'flex justify-between items-center'
                )}
              >
                {!iconOnRight && action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
                {iconOnRight && action.icon && <span className="ml-auto">{action.icon}</span>}
              </ContextMenuItem>
              {action.separator && idx < actions.length - 1 && <ContextMenuSeparator />}
            </div>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}
