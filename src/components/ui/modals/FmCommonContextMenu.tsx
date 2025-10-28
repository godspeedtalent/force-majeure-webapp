import { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/shadcn/context-menu';
import { cn } from '@/shared/utils/utils';

export interface ContextMenuAction<T = any> {
  label: string;
  icon?: ReactNode;
  onClick: (data: T) => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

interface FmCommonContextMenuProps<T = any> {
  children: ReactNode;
  actions: ContextMenuAction<T>[];
  data: T;
}

export function FmCommonContextMenu<T = any>({
  children,
  actions,
  data,
}: FmCommonContextMenuProps<T>) {
  if (actions.length === 0) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-popover border-border">
        {actions.map((action, idx) => (
          <ContextMenuItem
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(data);
            }}
            disabled={action.disabled}
            className={cn(
              'cursor-pointer transition-colors duration-200',
              action.variant === 'destructive' && 'text-destructive focus:text-destructive focus:bg-destructive/10'
            )}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
