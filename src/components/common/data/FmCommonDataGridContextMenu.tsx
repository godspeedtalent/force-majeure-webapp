import { ReactNode } from 'react';
import { FmCommonContextMenu, ContextMenuAction } from '../modals/FmCommonContextMenu';

interface FmCommonDataGridContextMenuProps<T = any> {
  children: ReactNode;
  row: T;
  actions: ContextMenuAction<T>[];
  onOpenChange?: (open: boolean) => void;
}

export function FmCommonDataGridContextMenu<T = any>({
  children,
  row,
  actions,
  onOpenChange,
}: FmCommonDataGridContextMenuProps<T>) {
  return (
    <FmCommonContextMenu
      actions={actions}
      data={row}
      onOpenChange={onOpenChange}
    >
      {children}
    </FmCommonContextMenu>
  );
}
