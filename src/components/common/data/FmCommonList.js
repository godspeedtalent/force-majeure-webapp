import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared';
export function FmCommonList({ items, columns, striped = true, dense = false, className, rowClassName, emptyMessage = 'No items to display', onRowClick, }) {
    if (items.length === 0) {
        return (_jsx("div", { className: 'text-center py-6 text-muted-foreground text-sm', children: emptyMessage }));
    }
    const getAlignment = (align) => {
        switch (align) {
            case 'center':
                return 'text-center justify-center';
            case 'right':
                return 'text-right justify-end';
            default:
                return 'text-left justify-start';
        }
    };
    return (_jsx("div", { className: cn('space-y-0 overflow-hidden rounded-none', className), children: items.map((item, index) => {
            const isStriped = striped && index % 2 === 1;
            const computedRowClassName = typeof rowClassName === 'function'
                ? rowClassName(item, index)
                : rowClassName;
            return (_jsx("div", { className: cn('grid grid-cols-1 gap-2 transition-colors', dense ? 'px-3 py-2' : 'px-4 py-3', isStriped && 'bg-white/5', onRowClick && 'cursor-pointer', computedRowClassName), style: {
                    gridTemplateColumns: columns.map(() => '1fr').join(' '),
                }, onClick: () => onRowClick?.(item, index), children: columns.map((column, colIndex) => {
                    const value = item[column.key];
                    const content = column.render
                        ? column.render(value, item, index)
                        : value?.toString() || '-';
                    return (_jsx("div", { className: cn('flex items-center', getAlignment(column.align), dense ? 'text-xs' : 'text-sm', column.className), children: content }, colIndex));
                }) }, index));
        }) }));
}
