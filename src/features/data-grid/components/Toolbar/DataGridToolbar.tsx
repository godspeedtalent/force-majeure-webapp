import { Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import { useDataGridContext } from '../../context/DataGridContext';

/**
 * Toolbar component with search, filters, and actions
 */
export function DataGridToolbar() {
  const { toolbar, filtering, creation, selection, bulkActions } = useDataGridContext();

  if (!toolbar) return null;

  const hasActiveFilters = filtering.searchQuery || Object.keys(filtering.columnFilters).length > 0;
  const hasSelectedRows = selection.selectedRows.size > 0;

  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b">
      <div className="flex items-center gap-4 flex-1">
        {toolbar.title && (
          <h3 className="text-lg font-semibold">{toolbar.title}</h3>
        )}
        
        {toolbar.search && (
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={toolbar.searchPlaceholder || 'Search...'}
              value={filtering.searchQuery}
              onChange={(e) => filtering.setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {filtering.searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => filtering.setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={filtering.clearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Bulk actions when rows are selected */}
        {hasSelectedRows && bulkActions && bulkActions.length > 0 && (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-muted-foreground">
              {selection.selectedRows.size} selected
            </span>
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant === 'danger' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => {
                  const selectedData = selection.getSelectedData(useDataGridContext().originalData);
                  action.onClick(selectedData);
                }}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Custom toolbar actions */}
        {toolbar.actions}

        {/* Create button */}
        {creation && (
          <Button
            size="sm"
            onClick={creation.startCreate}
            className="bg-fm-gold hover:bg-fm-gold/90"
            disabled={creation.isCreating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        )}
      </div>
    </div>
  );
}
