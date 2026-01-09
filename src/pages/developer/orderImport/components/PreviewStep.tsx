import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  XCircle,
  AlertCircle,
  Link2,
  Link2Off,
  Package,
  Ticket,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonStatCard } from '@/components/common/display/FmCommonStatCard';
import type { ParsedOrder, ImportResult } from '../types';

type PreviewFilter = 'all' | 'valid' | 'invalid' | 'linked' | 'orphaned';

interface PreviewStats {
  valid: ParsedOrder[];
  invalid: ParsedOrder[];
  withUser: ParsedOrder[];
  orphaned: ParsedOrder[];
  totalTickets: number;
  totalRevenue: number;
}

interface PreviewStepProps {
  parsedOrders: ParsedOrder[];
  filteredOrders: ParsedOrder[];
  stats: PreviewStats;
  previewFilter: PreviewFilter;
  setPreviewFilter: (filter: PreviewFilter) => void;
  isImporting: boolean;
  importResults?: ImportResult[];
  onBack: () => void;
  onImport: () => void;
}

function getOrderStatusDisplay(order: ParsedOrder) {
  if (order.validationErrors.length > 0) {
    return {
      icon: <XCircle className='h-4 w-4' />,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      label: 'Invalid',
    };
  }
  if (order.isDuplicate) {
    return {
      icon: <AlertCircle className='h-4 w-4' />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      label: 'Duplicate',
    };
  }
  if (order.existingUserId) {
    return {
      icon: <Link2 className='h-4 w-4' />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      label: 'Linked',
    };
  }
  return {
    icon: <Link2Off className='h-4 w-4' />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    label: 'Orphaned',
  };
}

export function PreviewStep({
  parsedOrders,
  filteredOrders,
  stats,
  previewFilter,
  setPreviewFilter,
  isImporting,
  importResults = [],
  onBack,
  onImport,
}: PreviewStepProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [expandedLineItems, setExpandedLineItems] = useState<Set<string>>(new Set());

  const toggleOrderExpansion = (rowIndex: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex);
      } else {
        newSet.add(rowIndex);
      }
      return newSet;
    });
  };

  const toggleLineItemExpansion = (key: string) => {
    setExpandedLineItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Calculate import progress
  const importingCount = importResults.filter(r => r.status === 'importing').length;
  const completedCount = importResults.filter(r => r.status === 'success' || r.status === 'failed').length;
  const progressPercent = importResults.length > 0 ? Math.round((completedCount / importResults.length) * 100) : 0;

  // Get import status for a row
  const getImportStatus = (rowIndex: number): ImportResult | undefined => {
    return importResults.find(r => r.rowIndex === rowIndex);
  };

  return (
    <div className='space-y-6'>
      {/* Import Progress Overlay */}
      {isImporting && importResults.length > 0 && (
        <FmCommonCard hoverable={false} className='border-fm-gold/50'>
          <FmCommonCardContent className='p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <FmCommonLoadingSpinner size='sm' />
                <span className='font-medium'>Importing Orders...</span>
              </div>
              <span className='text-sm text-muted-foreground'>
                {completedCount} / {importResults.length} ({progressPercent}%)
              </span>
            </div>
            <div className='w-full bg-white/10 rounded-sm h-2'>
              <div
                className='bg-fm-gold h-full rounded-sm transition-all duration-300'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className='flex gap-4 mt-3 text-sm'>
              <span className='text-green-400'>
                <CheckCircle className='h-3 w-3 inline mr-1' />
                {importResults.filter(r => r.status === 'success').length} Success
              </span>
              <span className='text-red-400'>
                <XCircle className='h-3 w-3 inline mr-1' />
                {importResults.filter(r => r.status === 'failed').length} Failed
              </span>
              {importingCount > 0 && (
                <span className='text-blue-400'>
                  <FmCommonLoadingSpinner size='sm' className='inline mr-1' />
                  Row {importResults.find(r => r.status === 'importing')?.rowIndex}
                </span>
              )}
            </div>
          </FmCommonCardContent>
        </FmCommonCard>
      )}

      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <FmCommonStatCard label='Total Rows' value={parsedOrders.length} icon={FileSpreadsheet} size='sm' />
        <FmCommonStatCard label='Valid Orders' value={stats.valid.length} icon={CheckCircle} size='sm' />
        <FmCommonStatCard label='Total Tickets' value={stats.totalTickets} icon={Ticket} size='sm' />
        <FmCommonStatCard label='Total Revenue' value={`$${(stats.totalRevenue / 100).toFixed(2)}`} icon={DollarSign} size='sm' />
      </div>

      <div className='flex gap-2'>
        {(['all', 'valid', 'invalid', 'linked', 'orphaned'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setPreviewFilter(filter)}
            className={cn(
              'px-3 py-1 text-sm border rounded-sm transition-colors',
              previewFilter === filter
                ? 'bg-fm-gold text-black border-fm-gold'
                : 'border-white/20 text-muted-foreground hover:border-white/40'
            )}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
            {filter === 'all' && ` (${parsedOrders.length})`}
            {filter === 'valid' && ` (${stats.valid.length})`}
            {filter === 'invalid' && ` (${stats.invalid.length})`}
            {filter === 'linked' && ` (${stats.withUser.length})`}
            {filter === 'orphaned' && ` (${stats.orphaned.length})`}
          </button>
        ))}
      </div>

      <FmCommonCard hoverable={false}>
        <FmCommonCardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-white/5'>
                <tr>
                  <th className='p-2 text-left w-8'></th>
                  <th className='p-2 text-left'>Status</th>
                  <th className='p-2 text-left'>Row</th>
                  <th className='p-2 text-left'>Email</th>
                  <th className='p-2 text-left'>Name</th>
                  <th className='p-2 text-left'>Tickets</th>
                  <th className='p-2 text-left'>Total</th>
                  <th className='p-2 text-left'>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 50).map(order => {
                  const statusDisplay = getOrderStatusDisplay(order);
                  const isExpanded = expandedOrders.has(order.rowIndex);
                  const hasLineItems = order.lineItems.length > 0;
                  const importStatus = getImportStatus(order.rowIndex);

                  // Override status display during/after import
                  let displayIcon = statusDisplay.icon;
                  let displayColor = statusDisplay.color;
                  let displayBg = statusDisplay.bg;

                  if (importStatus) {
                    if (importStatus.status === 'importing') {
                      displayIcon = <FmCommonLoadingSpinner size='sm' />;
                      displayColor = 'text-blue-400';
                      displayBg = 'bg-blue-500/10';
                    } else if (importStatus.status === 'success' && !importStatus.error) {
                      displayIcon = <CheckCircle className='h-4 w-4' />;
                      displayColor = 'text-green-400';
                      displayBg = 'bg-green-500/10';
                    } else if (importStatus.status === 'success' && importStatus.error) {
                      displayIcon = <AlertCircle className='h-4 w-4' />;
                      displayColor = 'text-yellow-400';
                      displayBg = 'bg-yellow-500/10';
                    } else if (importStatus.status === 'failed') {
                      displayIcon = <XCircle className='h-4 w-4' />;
                      displayColor = 'text-red-400';
                      displayBg = 'bg-red-500/10';
                    }
                  }

                  return (
                    <React.Fragment key={order.rowIndex}>
                      <tr
                        className={cn(
                          'border-b border-white/5 transition-colors',
                          displayBg,
                          hasLineItems && 'cursor-pointer hover:bg-white/5'
                        )}
                        onClick={() => hasLineItems && toggleOrderExpansion(order.rowIndex)}
                      >
                        <td className='p-2'>
                          {hasLineItems && (
                            <div className='text-muted-foreground'>
                              {isExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                            </div>
                          )}
                        </td>
                        <td className='p-2'>
                          <div className={cn('flex items-center justify-center', displayColor)} title={statusDisplay.label}>
                            {displayIcon}
                          </div>
                        </td>
                        <td className='p-2'>{order.rowIndex}</td>
                        <td className='p-2'>{order.customerEmail}</td>
                        <td className='p-2 truncate max-w-32'>{order.customerName || '-'}</td>
                        <td className='p-2'>
                          {order.lineItems.filter(li => li.type === 'ticket').reduce((sum, li) => sum + li.quantity, 0)}
                        </td>
                        <td className='p-2'>${(order.totalCents / 100).toFixed(2)}</td>
                        <td className='p-2'>
                          {importStatus?.error ? (
                            <span className={cn('text-xs', importStatus.status === 'failed' ? 'text-red-400' : 'text-yellow-400')}>
                              {importStatus.error.length > 50 ? `${importStatus.error.slice(0, 50)}...` : importStatus.error}
                            </span>
                          ) : importStatus?.status === 'success' ? (
                            <span className='text-green-400 text-xs'>Imported</span>
                          ) : importStatus?.status === 'importing' ? (
                            <span className='text-blue-400 text-xs'>Importing...</span>
                          ) : order.validationErrors.length > 0 ? (
                            <span className='text-red-400 text-xs'>{order.validationErrors[0]}</span>
                          ) : order.isDuplicate ? (
                            <span className='text-yellow-400 text-xs'>Duplicate</span>
                          ) : (
                            <span className='text-green-400 text-xs'>Ready</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className='bg-black/40'>
                          <td colSpan={8} className='p-0'>
                            <div className='px-4 py-3 border-l-2 border-fm-gold/30 ml-6'>
                              <div className='text-xs text-muted-foreground uppercase mb-2'>Line Items</div>
                              <div className='space-y-2'>
                                {order.lineItems.map((lineItem, liIdx) => {
                                  const lineItemKey = `${order.rowIndex}-${liIdx}`;
                                  const isLineItemExpanded = expandedLineItems.has(lineItemKey);
                                  const hasSubItems = lineItem.subItems && lineItem.subItems.length > 0;

                                  return (
                                    <div key={liIdx} className='border border-white/10 rounded-sm bg-black/20'>
                                      <div
                                        className={cn(
                                          'flex items-center justify-between p-2',
                                          hasSubItems && 'cursor-pointer hover:bg-white/5'
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (hasSubItems) toggleLineItemExpansion(lineItemKey);
                                        }}
                                      >
                                        <div className='flex items-center gap-3'>
                                          {hasSubItems && (
                                            <div className='text-muted-foreground'>
                                              {isLineItemExpanded ? <ChevronUp className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />}
                                            </div>
                                          )}
                                          <div className='flex items-center gap-2'>
                                            {lineItem.type === 'ticket' ? (
                                              <Ticket className='h-4 w-4 text-blue-400' />
                                            ) : lineItem.type === 'fee' ? (
                                              <DollarSign className='h-4 w-4 text-green-400' />
                                            ) : (
                                              <Package className='h-4 w-4 text-purple-400' />
                                            )}
                                            <span className='text-sm'>{lineItem.name}</span>
                                            <span className='text-xs px-1.5 py-0.5 bg-white/10 text-muted-foreground'>
                                              {lineItem.type}
                                            </span>
                                          </div>
                                        </div>
                                        <div className='flex items-center gap-4 text-sm'>
                                          <span className='text-muted-foreground'>Qty: <span className='text-white'>{lineItem.quantity}</span></span>
                                          <span className='text-muted-foreground'>Unit: <span className='text-white font-mono'>${(lineItem.unitPriceCents / 100).toFixed(2)}</span></span>
                                          {lineItem.unitFeeCents > 0 && (
                                            <span className='text-muted-foreground'>Fee: <span className='text-white font-mono'>${(lineItem.unitFeeCents / 100).toFixed(2)}</span></span>
                                          )}
                                          <span className='font-medium text-fm-gold font-mono'>${(lineItem.totalCents / 100).toFixed(2)}</span>
                                        </div>
                                      </div>

                                      {isLineItemExpanded && hasSubItems && (
                                        <div className='border-t border-white/10 bg-black/30 p-2 pl-8'>
                                          <div className='text-xs text-muted-foreground uppercase mb-1'>Sub-items</div>
                                          <div className='space-y-1'>
                                            {lineItem.subItems.map((subItem, siIdx) => (
                                              <div key={siIdx} className='flex items-center justify-between text-sm py-1 px-2 bg-white/5 rounded-sm'>
                                                <div className='flex items-center gap-2'>
                                                  {subItem.type === 'fee' ? (
                                                    <DollarSign className='h-3 w-3 text-green-400' />
                                                  ) : (
                                                    <Package className='h-3 w-3 text-purple-400' />
                                                  )}
                                                  <span>{subItem.name}</span>
                                                </div>
                                                <div className='flex items-center gap-3 text-xs'>
                                                  <span className='text-muted-foreground'>Qty: <span className='text-white'>{subItem.quantity}</span></span>
                                                  <span className='text-muted-foreground'>Unit: <span className='text-white font-mono'>${(subItem.unitPriceCents / 100).toFixed(2)}</span></span>
                                                  <span className='font-mono text-fm-gold'>${(subItem.totalCents / 100).toFixed(2)}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredOrders.length > 50 && (
            <div className='p-2 text-center text-xs text-muted-foreground'>
              Showing first 50 of {filteredOrders.length} orders
            </div>
          )}
        </FmCommonCardContent>
      </FmCommonCard>

      <div className='flex justify-between'>
        <FmCommonButton variant='secondary' onClick={onBack}>
          Back to Mapping
        </FmCommonButton>
        <FmCommonButton
          variant='gold'
          onClick={onImport}
          disabled={isImporting || stats.valid.length === 0}
        >
          {isImporting ? (
            <>
              <FmCommonLoadingSpinner size='sm' className='mr-2' />
              Importing...
            </>
          ) : (
            `Import ${stats.valid.length} Orders`
          )}
        </FmCommonButton>
      </div>
    </div>
  );
}
