/**
 * Enhanced Column Configuration Modal
 *
 * Provides comprehensive column management:
 * - Show/hide all columns (including hidden ones)
 * - Rename column display labels
 * - Reorder columns
 * - Freeze/unfreeze columns
 * - Reset to defaults
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { DataGridColumn } from '../FmDataGrid';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Pin,
  PinOff,
  Save,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface ColumnConfig {
  key: string;
  visible: boolean;
  order: number;
  width?: number;
  frozen?: boolean;
  customLabel?: string;
}

export interface FmColumnConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseColumns: DataGridColumn[];
  columnConfigs: ColumnConfig[];
  onSaveConfiguration: (configs: ColumnConfig[]) => void;
  onResetConfiguration: () => void;
}

export function FmColumnConfigModal({
  open,
  onOpenChange,
  baseColumns,
  columnConfigs,
  onSaveConfiguration,
  onResetConfiguration,
}: FmColumnConfigModalProps) {
  // Create a map of current configs
  const configMap = useMemo(() => {
    const map = new Map<string, ColumnConfig>();
    columnConfigs.forEach(config => {
      map.set(config.key, config);
    });
    return map;
  }, [columnConfigs]);

  // Local state for editing
  const [localConfigs, setLocalConfigs] = useState<Map<string, ColumnConfig>>(() => {
    const map = new Map<string, ColumnConfig>();
    baseColumns.forEach((col, index) => {
      const existing = configMap.get(col.key);
      map.set(col.key, {
        key: col.key,
        visible: existing?.visible ?? true,
        order: existing?.order ?? index,
        width: existing?.width,
        frozen: existing?.frozen ?? false,
        customLabel: existing?.customLabel,
      });
    });
    return map;
  });

  // Track which columns are being edited
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Get all columns with their configs
  const columnsWithConfigs = useMemo(() => {
    return baseColumns.map(col => {
      const config = localConfigs.get(col.key) || {
        key: col.key,
        visible: true,
        order: 0,
        frozen: false,
      };
      return {
        column: col,
        config,
        originalLabel: col.label,
        displayLabel: config.customLabel || col.label,
      };
    }).sort((a, b) => a.config.order - b.config.order);
  }, [baseColumns, localConfigs]);

  // Statistics
  const stats = useMemo(() => {
    const visible = Array.from(localConfigs.values()).filter(c => c.visible).length;
    const frozen = Array.from(localConfigs.values()).filter(c => c.frozen).length;
    const renamed = Array.from(localConfigs.values()).filter(c => c.customLabel).length;
    return { total: baseColumns.length, visible, hidden: baseColumns.length - visible, frozen, renamed };
  }, [localConfigs, baseColumns.length]);

  // Toggle visibility
  const toggleVisibility = (key: string) => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      const config = newMap.get(key);
      if (config) {
        newMap.set(key, { ...config, visible: !config.visible });
      }
      return newMap;
    });
  };

  // Toggle frozen
  const toggleFrozen = (key: string) => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      const config = newMap.get(key);
      if (config) {
        newMap.set(key, { ...config, frozen: !config.frozen });
      }
      return newMap;
    });
  };

  // Start editing label
  const startEditing = (key: string, currentLabel: string) => {
    setEditingKey(key);
    setEditValue(currentLabel);
  };

  // Save edited label
  const saveEdit = (key: string) => {
    if (editValue.trim()) {
      setLocalConfigs(prev => {
        const newMap = new Map(prev);
        const config = newMap.get(key);
        const col = baseColumns.find(c => c.key === key);
        if (config && col) {
          // Only save as custom label if different from original
          const customLabel = editValue.trim() !== col.label ? editValue.trim() : undefined;
          newMap.set(key, { ...config, customLabel });
        }
        return newMap;
      });
    }
    setEditingKey(null);
    setEditValue('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  // Show all columns
  const showAll = () => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      newMap.forEach((config, key) => {
        newMap.set(key, { ...config, visible: true });
      });
      return newMap;
    });
  };

  // Hide all columns
  const hideAll = () => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      newMap.forEach((config, key) => {
        newMap.set(key, { ...config, visible: false });
      });
      return newMap;
    });
  };

  // Unfreeze all
  const unfreezeAll = () => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      newMap.forEach((config, key) => {
        newMap.set(key, { ...config, frozen: false });
      });
      return newMap;
    });
  };

  // Reset all labels
  const resetLabels = () => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      newMap.forEach((config, key) => {
        newMap.set(key, { ...config, customLabel: undefined });
      });
      return newMap;
    });
  };

  // Save changes
  const handleSave = () => {
    const configs = Array.from(localConfigs.values());
    onSaveConfiguration(configs);
    onOpenChange(false);
  };

  // Reset to defaults
  const handleReset = () => {
    onResetConfiguration();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Configure Columns</DialogTitle>
          <DialogDescription>
            Manage column visibility, labels, and freezing
          </DialogDescription>
        </DialogHeader>

        {/* Statistics */}
        <div className='flex gap-4 text-sm border-b border-border pb-4'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>Total:</span>
            <span className='font-semibold'>{stats.total}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Eye className='h-4 w-4 text-green-500' />
            <span className='text-muted-foreground'>Visible:</span>
            <span className='font-semibold'>{stats.visible}</span>
          </div>
          <div className='flex items-center gap-2'>
            <EyeOff className='h-4 w-4 text-muted-foreground' />
            <span className='text-muted-foreground'>Hidden:</span>
            <span className='font-semibold'>{stats.hidden}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Pin className='h-4 w-4 text-fm-gold' />
            <span className='text-muted-foreground'>Frozen:</span>
            <span className='font-semibold'>{stats.frozen}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Edit2 className='h-4 w-4 text-blue-500' />
            <span className='text-muted-foreground'>Renamed:</span>
            <span className='font-semibold'>{stats.renamed}</span>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={showAll}>
            <Eye className='h-4 w-4 mr-2' />
            Show All
          </Button>
          <Button variant='outline' size='sm' onClick={hideAll}>
            <EyeOff className='h-4 w-4 mr-2' />
            Hide All
          </Button>
          <Button variant='outline' size='sm' onClick={unfreezeAll}>
            <PinOff className='h-4 w-4 mr-2' />
            Unfreeze All
          </Button>
          <Button variant='outline' size='sm' onClick={resetLabels}>
            <RotateCcw className='h-4 w-4 mr-2' />
            Reset Labels
          </Button>
        </div>

        {/* Column List */}
        <div className='flex-1 overflow-y-auto border border-border rounded-md'>
          <div className='divide-y divide-border'>
            {columnsWithConfigs.map(({ column, config, originalLabel, displayLabel }) => {
              const isEditing = editingKey === column.key;
              const isRenamed = config.customLabel !== undefined;

              return (
                <div
                  key={column.key}
                  className={cn(
                    'flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors',
                    config.frozen && 'bg-fm-gold/5 border-l-2 border-l-fm-gold',
                    !config.visible && 'opacity-50'
                  )}
                >
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => toggleVisibility(column.key)}
                    className='p-1 hover:bg-muted rounded transition-colors'
                    title={config.visible ? 'Hide column' : 'Show column'}
                  >
                    {config.visible ? (
                      <Eye className='h-4 w-4 text-green-500' />
                    ) : (
                      <EyeOff className='h-4 w-4 text-muted-foreground' />
                    )}
                  </button>

                  {/* Freeze Toggle */}
                  <button
                    onClick={() => toggleFrozen(column.key)}
                    className='p-1 hover:bg-muted rounded transition-colors'
                    title={config.frozen ? 'Unfreeze column' : 'Freeze column'}
                  >
                    {config.frozen ? (
                      <Pin className='h-4 w-4 text-fm-gold' />
                    ) : (
                      <PinOff className='h-4 w-4 text-muted-foreground' />
                    )}
                  </button>

                  {/* Column Label/Name */}
                  <div className='flex-1 min-w-0'>
                    {isEditing ? (
                      <div className='flex items-center gap-2'>
                        <Input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(column.key);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className='h-8 text-sm'
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(column.key)}
                          className='p-1 hover:bg-green-500/10 rounded transition-colors'
                        >
                          <Check className='h-4 w-4 text-green-500' />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className='p-1 hover:bg-destructive/10 rounded transition-colors'
                        >
                          <X className='h-4 w-4 text-destructive' />
                        </button>
                      </div>
                    ) : (
                      <div className='flex flex-col'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium text-sm truncate'>
                            {displayLabel}
                          </span>
                          {isRenamed && (
                            <span className='text-xs text-blue-500 font-mono'>
                              (renamed)
                            </span>
                          )}
                        </div>
                        {isRenamed && (
                          <span className='text-xs text-muted-foreground truncate'>
                            Original: {originalLabel}
                          </span>
                        )}
                        <span className='text-xs text-muted-foreground font-mono truncate'>
                          {column.key}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Edit Button */}
                  {!isEditing && (
                    <button
                      onClick={() => startEditing(column.key, displayLabel)}
                      className='p-1 hover:bg-muted rounded transition-colors'
                      title='Rename column'
                    >
                      <Edit2 className='h-4 w-4 text-muted-foreground' />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-between pt-4 border-t border-border'>
          <Button variant='outline' onClick={handleReset}>
            <RotateCcw className='h-4 w-4 mr-2' />
            Reset to Default
          </Button>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className='h-4 w-4 mr-2' />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
