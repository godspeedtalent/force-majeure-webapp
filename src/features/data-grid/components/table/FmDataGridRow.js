import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableRow } from '@/components/common/shadcn/table';
import { Button } from '@/components/common/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/common/shadcn/dropdown-menu';
import { ChevronDown, ChevronUp, MoreVertical, X, Eye } from 'lucide-react';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { FmDataGridContextMenu } from '../FmDataGridContextMenu';
import { FmDataGridCell } from './FmDataGridCell';
import { cn } from '@/shared';
import { isRelationField, getRelationConfig } from '../../utils/dataGridRelations';
import { logger } from '@/shared';
export function FmDataGridRow({ row, rowIndex, globalIndex, columns, actions, contextMenuActions, isSelected, isEvenRow, hasContextMenuOpen, onSelectRow, onMouseDown, onMouseUp, onMouseEnter, setRowRef, editingCell, editValue, onEditValueChange, onStartEdit, onSaveEdit, onCancelEdit, onUpdate, isDragMode, isDragSelected, hoveredColumn, onSetHoveredColumn, onContextMenuOpenChange, isMultipleSelected, onUnselectAll, getFocusableCellProps, columnWidths = {}, }) {
    const navigate = useNavigate();
    // Validate column keys against row data (only in development)
    useMemo(() => {
        if (process.env.NODE_ENV === 'development') {
            const missingKeys = columns
                .filter(col => !(col.key in row) && !col.render)
                .map(col => col.key);
            if (missingKeys.length > 0) {
                logger.warn('Column keys missing in row data', {
                    missingKeys,
                    availableKeys: Object.keys(row),
                    source: 'FmDataGridRow',
                });
            }
        }
    }, [columns, row]);
    // Calculate cumulative left positions for frozen columns
    const frozenColumnPositions = useMemo(() => {
        const positions = {};
        let cumulativeLeft = 48; // Start after checkbox column (w-12 = 48px)
        columns.forEach(column => {
            if (column.frozen) {
                positions[column.key] = cumulativeLeft;
                const width = columnWidths[column.key] || 150; // Default width
                cumulativeLeft += width;
            }
        });
        return positions;
    }, [columns, columnWidths]);
    // Determine context menu actions based on selection
    const currentContextMenuActions = isMultipleSelected && isSelected
        ? contextMenuActions
            .map(action => {
            if (action.label === 'Manage')
                return null;
            if (action.label === 'Delete Event') {
                return { ...action, label: 'Delete Selected' };
            }
            return action;
        })
            .filter(Boolean)
        : contextMenuActions;
    // Build relation detail actions dynamically
    const relationDetailActions = [];
    columns.forEach(column => {
        if (isRelationField(column.key)) {
            const relationConfig = getRelationConfig(column.key);
            const relationId = row[column.key];
            if (relationConfig?.detailRoute &&
                relationConfig?.entityName &&
                relationId) {
                relationDetailActions.push({
                    label: `View ${relationConfig.entityName} details`,
                    icon: _jsx(Eye, { className: 'h-4 w-4' }),
                    onClick: () => navigate(relationConfig.detailRoute(relationId)),
                });
            }
        }
    });
    // Add separator before relation actions if they exist
    let actionsWithRelations = currentContextMenuActions;
    if (relationDetailActions.length > 0) {
        actionsWithRelations = [
            ...currentContextMenuActions,
            ...(currentContextMenuActions.length > 0
                ? [{ separator: true }]
                : []),
            ...relationDetailActions,
        ];
    }
    // Add "Unselect All" if multiple selected
    const finalContextMenuActions = isMultipleSelected && isSelected
        ? [
            ...actionsWithRelations,
            {
                label: 'Unselect All',
                icon: _jsx(X, { className: 'h-4 w-4' }),
                onClick: onUnselectAll,
                separator: true,
            },
        ]
        : actionsWithRelations;
    return (_jsx(FmDataGridContextMenu, { row: row, actions: finalContextMenuActions, onOpenChange: onContextMenuOpenChange, children: _jsxs(TableRow, { ref: setRowRef, className: cn('border-border/50 transition-all duration-200 group', isEvenRow && 'bg-muted/20', isSelected && 'bg-fm-gold/10 border-fm-gold/30', hasContextMenuOpen && 'bg-fm-gold/20 border-fm-gold/50', !hasContextMenuOpen && 'hover:bg-fm-gold/5', isDragSelected && 'bg-fm-gold/15'), onMouseDown: onMouseDown, onMouseUp: onMouseUp, onMouseEnter: onMouseEnter, children: [_jsx(TableCell, { className: cn('transition-colors duration-200 border-l border-r border-border/60', !isDragMode && hoveredColumn === '__checkbox' && 'bg-muted/40'), onMouseEnter: () => !isDragMode && onSetHoveredColumn('__checkbox'), onMouseLeave: () => !isDragMode && onSetHoveredColumn(null), children: _jsx(FmCommonCheckbox, { checked: isSelected, onCheckedChange: (checked) => onSelectRow(!!checked, false), "aria-label": `Select row ${globalIndex + 1}` }) }), columns.map(column => {
                    const isEditing = editingCell?.rowIndex === globalIndex &&
                        editingCell?.columnKey === column.key;
                    const cellValue = row[column.key];
                    return (_jsx(FmDataGridCell, { row: row, column: column, value: cellValue, isEditing: isEditing, editValue: editValue, onEditValueChange: onEditValueChange, onStartEdit: () => onStartEdit(globalIndex, column.key, cellValue), onSaveEdit: overrideValue => onSaveEdit(row, column.key, overrideValue), onCancelEdit: onCancelEdit, onUpdate: onUpdate, hoveredColumn: hoveredColumn, isDragMode: isDragMode, focusableProps: column.editable && !column.readonly && onUpdate
                            ? getFocusableCellProps(rowIndex, column.key)
                            : {}, frozenLeft: column.frozen ? frozenColumnPositions[column.key] : undefined, columnWidths: columnWidths }, column.key));
                }), actions.length > 0 && (_jsx(TableCell, { className: cn('text-right transition-colors duration-200 border-l border-r border-border/60', !isDragMode && hoveredColumn === '__actions' && 'bg-muted/40'), onMouseEnter: () => !isDragMode && onSetHoveredColumn('__actions'), onMouseLeave: () => !isDragMode && onSetHoveredColumn(null), children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: 'ghost', size: 'sm', className: 'h-8 w-8 p-0 hover:bg-fm-gold/20 transition-all duration-200', onClick: e => e.stopPropagation(), children: _jsx(MoreVertical, { className: 'h-4 w-4' }) }) }), _jsx(DropdownMenuContent, { align: 'end', children: actions.map((action, idx) => (_jsxs(DropdownMenuItem, { onClick: e => {
                                        e.stopPropagation();
                                        action.onClick?.(row);
                                    }, className: cn('cursor-pointer transition-colors duration-200', action.variant === 'destructive' &&
                                        'text-destructive focus:text-destructive'), children: [action.icon && _jsx("span", { className: 'mr-2', children: action.icon }), action.label] }, idx))) })] }) }))] }) }));
}
export function FmDataGridGroupRow({ groupData, columns, hasActions, isExpanded, onToggle, }) {
    return (_jsx(TableRow, { className: 'bg-muted/40 hover:bg-muted/60 cursor-pointer border-b-2 border-border font-medium', onClick: onToggle, children: _jsx(TableCell, { colSpan: columns.length + 1 + (hasActions ? 1 : 0), children: _jsxs("div", { className: 'flex items-center gap-3 py-1', children: [isExpanded ? (_jsx(ChevronDown, { className: 'h-5 w-5 text-fm-gold' })) : (_jsx(ChevronUp, { className: 'h-5 w-5 text-muted-foreground' })), _jsx("span", { className: 'text-base', children: groupData.groupValue || '(Empty)' }), _jsxs("span", { className: 'text-sm text-muted-foreground', children: ["(", groupData.count, " row", groupData.count !== 1 ? 's' : '', ")"] }), groupData.aggregations && Object.keys(groupData.aggregations).length > 0 && (_jsx("div", { className: 'ml-4 flex gap-4 text-sm text-muted-foreground', children: Object.entries(groupData.aggregations).map(([key, value]) => {
                            const [colKey, aggType] = key.split('_');
                            const column = columns.find(c => c.key === colKey);
                            return (_jsxs("span", { children: [aggType, ":", ' ', _jsx("span", { className: 'text-foreground font-medium', children: value }), column && ` (${column.label})`] }, key));
                        }) }))] }) }) }));
}
