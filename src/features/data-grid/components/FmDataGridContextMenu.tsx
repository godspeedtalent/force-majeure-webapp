import { ReactNode } from 'react';
import { FmCommonContextMenu, ContextMenuAction } from '@/components/common/modals/FmCommonContextMenu';

interface FmDataGridContextMenuProps<T = any> {
  children: ReactNode;
  row: T;
  actions: ContextMenuAction<T>[];
  onOpenChange?: (open: boolean) => void;
}

export function FmDataGridContextMenu<T = any>({
  children,
  row,
  actions,
  onOpenChange,
}: FmDataGridContextMenuProps<T>) {
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
