import type { DataGridColumn } from '../components/FmDataGrid';

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: DataGridColumn<T>[],
  selectedColumnKeys: string[],
  filename: string = 'export'
): void {
  const separator = ',';
  exportDelimited(
    data,
    columns,
    selectedColumnKeys,
    separator,
    filename,
    'csv'
  );
}

/**
 * Export data to TSV format
 */
export function exportToTSV<T extends Record<string, any>>(
  data: T[],
  columns: DataGridColumn<T>[],
  selectedColumnKeys: string[],
  filename: string = 'export'
): void {
  const separator = '\t';
  exportDelimited(
    data,
    columns,
    selectedColumnKeys,
    separator,
    filename,
    'tsv'
  );
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T extends Record<string, any>>(
  data: T[],
  columns: DataGridColumn<T>[],
  selectedColumnKeys: string[],
  filename: string = 'export'
): void {
  // Filter data to only include selected columns
  const selectedColumns = columns.filter(col =>
    selectedColumnKeys.includes(col.key)
  );

  const exportData = data.map(row => {
    const obj: Record<string, any> = {};
    selectedColumns.forEach(col => {
      obj[col.label] = getCellValue(row, col);
    });
    return obj;
  });

  const jsonStr = JSON.stringify(exportData, null, 2);
  downloadFile(jsonStr, `${filename}.json`, 'application/json');
}

/**
 * Helper function to export delimited formats (CSV/TSV)
 */
function exportDelimited<T extends Record<string, any>>(
  data: T[],
  columns: DataGridColumn<T>[],
  selectedColumnKeys: string[],
  separator: string,
  filename: string,
  extension: string
): void {
  const selectedColumns = columns.filter(col =>
    selectedColumnKeys.includes(col.key)
  );

  // Create header row
  const headers = selectedColumns.map(col =>
    escapeDelimited(col.label, separator)
  );
  const headerRow = headers.join(separator);

  // Create data rows
  const dataRows = data.map(row => {
    const values = selectedColumns.map(col => {
      const value = getCellValue(row, col);
      return escapeDelimited(String(value ?? ''), separator);
    });
    return values.join(separator);
  });

  // Combine header and data
  const content = [headerRow, ...dataRows].join('\n');

  // Download file
  const mimeType =
    extension === 'csv' ? 'text/csv' : 'text/tab-separated-values';
  downloadFile(content, `${filename}.${extension}`, mimeType);
}

/**
 * Get cell value, handling custom render functions
 */
function getCellValue<T extends Record<string, any>>(
  row: T,
  column: DataGridColumn<T>
): any {
  const value = row[column.key];

  // Handle dates
  if (column.type === 'date' || column.type === 'created_date') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return value;
    }
  }

  // Handle booleans
  if (column.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle relations - try to get display value
  if (column.isRelation && typeof value === 'object' && value !== null) {
    return value.name || value.title || value.id || String(value);
  }

  return value;
}

/**
 * Escape special characters for delimited formats
 */
function escapeDelimited(value: string, separator: string): string {
  // If value contains separator, newline, or quote, wrap in quotes
  if (
    value.includes(separator) ||
    value.includes('\n') ||
    value.includes('"')
  ) {
    // Escape quotes by doubling them
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Trigger file download in browser
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main export function that handles format selection
 */
export function exportData<T extends Record<string, any>>(
  data: T[],
  columns: DataGridColumn<T>[],
  selectedColumnKeys: string[],
  format: 'csv' | 'tsv' | 'json',
  filename: string = 'export'
): void {
  switch (format) {
    case 'csv':
      exportToCSV(data, columns, selectedColumnKeys, filename);
      break;
    case 'tsv':
      exportToTSV(data, columns, selectedColumnKeys, filename);
      break;
    case 'json':
      exportToJSON(data, columns, selectedColumnKeys, filename);
      break;
  }
}
