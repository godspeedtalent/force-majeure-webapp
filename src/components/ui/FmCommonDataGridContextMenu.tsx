import { ReactNode } from 'react';
import { FmCommonContextMenu, ContextMenuAction } from './FmCommonContextMenu';

interface FmCommonDataGridContextMenuProps<T = any> {
  children: ReactNode;
  row: T;
  actions: ContextMenuAction<T>[];
}

export function FmCommonDataGridContextMenu<T = any>({
  children,
  row,
  actions,
}: FmCommonDataGridContextMenuProps<T>) {
  return (
    <FmCommonContextMenu
      actions={actions}
      data={row}
    >
      {children}
    </FmCommonContextMenu>
  );
}
