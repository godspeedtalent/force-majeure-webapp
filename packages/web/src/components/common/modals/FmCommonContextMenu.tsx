import { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/common/shadcn/context-menu';
import { cn } from '@force-majeure/shared/utils/utils';
import { getListItemClasses, getDepthClasses } from '@force-majeure/shared/utils/styleUtils';

export interface ContextMenuAction<T = any> {
  label: string;
  icon?: ReactNode;
  onClick?: (data: T) => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  iconPosition?: 'left' | 'right'; // Position of the icon
  separator?: boolean; // Add a separator after this item
  submenu?: ContextMenuAction<T>[]; // Nested submenu items
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
      <ContextMenuContent
        className={cn(
          'w-56',
          getDepthClasses(3),
          'border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50',
          'animate-in fade-in zoom-in-95 duration-200',
          'p-1'
        )}
      >
        {actions.map((action, idx) => {
          const iconOnRight = action.iconPosition === 'right';

          // If action has submenu, render as ContextMenuSub
          if (action.submenu && action.submenu.length > 0) {
            return (
              <div key={idx}>
                <ContextMenuSub>
                  <ContextMenuSubTrigger
                    disabled={action.disabled}
                    className={cn(
                      'group cursor-pointer rounded-md my-0.5 relative',
                      getListItemClasses(idx),
                      'data-[state=open]:bg-fm-gold/15 data-[state=open]:text-white',
                      action.disabled &&
                        'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-transparent'
                    )}
                  >
                    {action.icon && (
                      <span className='mr-2 transition-transform duration-300 group-hover:scale-110'>
                        {action.icon}
                      </span>
                    )}
                    <span className='font-medium'>{action.label}</span>
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent
                    className={cn(
                      'w-48',
                      getDepthClasses(3),
                      'border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50',
                      'p-1'
                    )}
                  >
                    {action.submenu.map((subAction, subIdx) => {
                      const subIconOnRight = subAction.iconPosition === 'right';
                      return (
                        <div key={subIdx}>
                          <ContextMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              subAction.onClick?.(data);
                            }}
                            disabled={subAction.disabled}
                            className={cn(
                              'group cursor-pointer rounded-md my-0.5 relative',
                              getListItemClasses(subIdx),
                              subAction.variant === 'destructive' &&
                                'text-destructive hover:bg-destructive/15 hover:shadow-destructive/20 focus:bg-destructive/20 focus:shadow-destructive/20 hover:text-destructive',
                              subIconOnRight &&
                                'flex justify-between items-center',
                              subAction.disabled &&
                                'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-transparent'
                            )}
                          >
                            {!subIconOnRight && subAction.icon && (
                              <span className='mr-2 transition-transform duration-300 group-hover:scale-110'>
                                {subAction.icon}
                              </span>
                            )}
                            <span className='font-medium'>
                              {subAction.label}
                            </span>
                            {subIconOnRight && subAction.icon && (
                              <span className='ml-auto transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5'>
                                {subAction.icon}
                              </span>
                            )}
                            {subIdx < action.submenu!.length - 1 && (
                              <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent' />
                            )}
                          </ContextMenuItem>
                          {subAction.separator &&
                            subIdx < action.submenu!.length - 1 && (
                              <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1' />
                            )}
                        </div>
                      );
                    })}
                  </ContextMenuSubContent>
                </ContextMenuSub>
                {action.separator && idx < actions.length - 1 && (
                  <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1' />
                )}
              </div>
            );
          }

          // Regular menu item
          return (
            <div key={idx}>
              <ContextMenuItem
                onClick={e => {
                  e.stopPropagation();
                  action.onClick?.(data);
                }}
                disabled={action.disabled}
                className={cn(
                  'group cursor-pointer rounded-md my-0.5 relative',
                  getListItemClasses(idx),
                  action.variant === 'destructive' &&
                    'text-destructive hover:bg-destructive/15 hover:shadow-destructive/20 focus:bg-destructive/20 focus:shadow-destructive/20 hover:text-destructive',
                  iconOnRight && 'flex justify-between items-center',
                  action.disabled &&
                    'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-transparent'
                )}
              >
                {!iconOnRight && action.icon && (
                  <span className='mr-2 transition-transform duration-300 group-hover:scale-110'>
                    {action.icon}
                  </span>
                )}
                <span className='font-medium'>{action.label}</span>
                {iconOnRight && action.icon && (
                  <span className='ml-auto transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5'>
                    {action.icon}
                  </span>
                )}
                {/* Horizontal divider after each item */}
                {idx < actions.length - 1 && (
                  <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent' />
                )}
              </ContextMenuItem>
              {action.separator && idx < actions.length - 1 && (
                <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1' />
              )}
            </div>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}
