import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { Label } from '@/components/common/shadcn/label';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { DataGridColumn } from './FmDataGrid';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/common/shadcn/radio-group';

export type ExportFormat = 'csv' | 'tsv' | 'json';

interface FmDataGridExportDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataGridColumn<T>[];
  data: T[];
  filename?: string;
  onExport: (selectedColumns: string[], format: ExportFormat) => void;
}

export function FmDataGridExportDialog<T = any>({
  open,
  onOpenChange,
  columns,
  data,
  onExport,
}: FmDataGridExportDialogProps<T>) {
  const { t } = useTranslation('common');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map(col => col.key)
  );
  const [format, setFormat] = useState<ExportFormat>('csv');

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const toggleAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map(col => col.key));
    }
  };

  const handleExport = () => {
    onExport(selectedColumns, format);
    onOpenChange(false);
  };

  const isAllSelected = selectedColumns.length === columns.length;

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('dialogs.exportData')}
      description={t('dialogs.exportDescription', { count: data.length })}
      className='max-w-md'
    >
      <div className='space-y-4 py-4'>
        {/* Format Selection */}
        <div className='space-y-3'>
          <Label>{t('dialogs.exportFormat')}</Label>
          <RadioGroup
            value={format}
            onValueChange={value => setFormat(value as ExportFormat)}
          >
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='csv' id='csv' />
              <Label
                htmlFor='csv'
                className='flex items-center gap-2 cursor-pointer'
              >
                <FileSpreadsheet className='h-4 w-4' />
                <span>{t('dialogs.csvFormat')}</span>
              </Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='tsv' id='tsv' />
              <Label
                htmlFor='tsv'
                className='flex items-center gap-2 cursor-pointer'
              >
                <FileText className='h-4 w-4' />
                <span>{t('dialogs.tsvFormat')}</span>
              </Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='json' id='json' />
              <Label
                htmlFor='json'
                className='flex items-center gap-2 cursor-pointer'
              >
                <FileText className='h-4 w-4' />
                <span>{t('dialogs.jsonFormat')}</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Column Selection */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Label>{t('dialogs.selectColumns')}</Label>
            <FmCommonButton
              variant='secondary'
              size='sm'
              onClick={toggleAll}
              className='h-8 text-xs'
            >
              {isAllSelected ? t('table.deselectAll') : t('table.selectAll')}
            </FmCommonButton>
          </div>

          <div className='max-h-60 overflow-y-auto space-y-2 border border-border/50 rounded-none p-3 bg-muted/20'>
            {columns.map(column => (
              <div key={column.key} className='flex items-center space-x-2'>
                <FmCommonCheckbox
                  id={`export-col-${column.key}`}
                  checked={selectedColumns.includes(column.key)}
                  onCheckedChange={() => toggleColumn(column.key)}
                />
                <Label
                  htmlFor={`export-col-${column.key}`}
                  className='text-sm cursor-pointer flex-1'
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>

          <div className='text-xs text-muted-foreground'>
            {t('table.columnsSelected', { selected: selectedColumns.length, total: columns.length })}
          </div>
        </div>
      </div>

      <div className='flex justify-end gap-2 pt-4 border-t'>
        <FmCommonButton variant='secondary' onClick={() => onOpenChange(false)}>
          {t('buttons.cancel')}
        </FmCommonButton>
        <FmCommonButton
          variant='gold'
          onClick={handleExport}
          disabled={selectedColumns.length === 0}
          icon={Download}
        >
          {t('dialogs.exportButton', { format: format.toUpperCase() })}
        </FmCommonButton>
      </div>
    </FmCommonModal>
  );
}
