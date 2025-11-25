import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface JsonCellProps {
  data: Record<string, any> | null;
  className?: string;
  maxHeight?: string;
  formatValue?: (key: string, value: any) => string;
}

/**
 * JsonCell - Displays JSONB data as expandable key-value pairs
 * 
 * Features:
 * - Expandable/collapsible view
 * - Shows summary count when collapsed
 * - Custom value formatting via formatValue prop
 * - Handles nested objects (flattens one level)
 */
export const JsonCell = ({ 
  data, 
  className,
  maxHeight = '200px',
  formatValue
}: JsonCellProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return (
      <span className="text-muted-foreground text-sm italic">
        No data
      </span>
    );
  }

  const entries = Object.entries(data);
  const itemCount = entries.length;

  const defaultFormatValue = (_key: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatter = formatValue || defaultFormatValue;

  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span className="font-medium">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </button>

      {isExpanded && (
        <div 
          className="flex flex-col gap-0.5 text-xs overflow-y-auto"
          style={{ maxHeight }}
        >
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 py-0.5">
              <span className="font-medium text-muted-foreground min-w-[100px]">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
              </span>
              <span className="text-foreground break-all">
                {formatter(key, value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
