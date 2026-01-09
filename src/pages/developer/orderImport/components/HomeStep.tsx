import { useState } from 'react';
import { Plus, History, RotateCcw, Calendar, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import type { ProcessRecord } from '../types';

interface ProcessError {
  rowIndex: number;
  error: string;
}

interface HomeStepProps {
  onStartNew: () => void;
  onRefetchHistory: () => void;
  onRollback: (process: ProcessRecord) => Promise<void>;
  historyLoading: boolean;
  importHistory: ProcessRecord[] | undefined;
  isRollingBack: string | null;
}

export function HomeStep({
  onStartNew,
  onRefetchHistory,
  onRollback,
  historyLoading,
  importHistory,
  isRollingBack,
}: HomeStepProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const toggleErrors = (processId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  };

  return (
    <div className='space-y-6'>
      <FmCommonCard hoverable={false}>
        <FmCommonCardContent className='p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Plus className='h-5 w-5 text-fm-gold' />
            <h3 className='font-medium text-lg'>New Import</h3>
          </div>
          <p className='text-sm text-muted-foreground mb-6'>
            Start a new order import from a CSV file. Orders will be validated before import.
          </p>
          <FmCommonButton variant='gold' onClick={onStartNew}>
            <Plus className='h-4 w-4 mr-2' />
            Start New Import
          </FmCommonButton>
        </FmCommonCardContent>
      </FmCommonCard>

      <FmCommonCard hoverable={false}>
        <FmCommonCardContent className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <History className='h-5 w-5 text-fm-gold' />
              <h3 className='font-medium text-lg'>Import History</h3>
            </div>
            <FmCommonButton
              variant='secondary'
              size='sm'
              onClick={onRefetchHistory}
              disabled={historyLoading}
            >
              <RotateCcw className={cn('h-4 w-4', historyLoading && 'animate-spin')} />
            </FmCommonButton>
          </div>

          {historyLoading ? (
            <div className='flex items-center justify-center py-8'>
              <FmCommonLoadingSpinner size='md' />
            </div>
          ) : !importHistory || importHistory.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <History className='h-12 w-12 mx-auto mb-2 opacity-30' />
              <p>No import history yet</p>
              <p className='text-xs'>Import processes will appear here</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {importHistory.map((process) => {
                const metadata = process.metadata as {
                  event_title?: string;
                  ticket_tier_name?: string;
                  errors?: ProcessError[];
                };
                const rollbackData = process.rollback_data as {
                  order_ids?: string[];
                };
                const canRollback = process.status === 'completed' && rollbackData?.order_ids?.length;
                const hasErrors = metadata.errors && metadata.errors.length > 0;
                const isErrorsExpanded = expandedErrors.has(process.id);

                return (
                  <div
                    key={process.id}
                    className={cn(
                      'p-4 border rounded-sm',
                      process.status === 'completed' && !hasErrors && 'border-green-500/30 bg-green-500/5',
                      process.status === 'completed' && hasErrors && 'border-yellow-500/30 bg-yellow-500/5',
                      process.status === 'failed' && 'border-red-500/30 bg-red-500/5',
                      process.status === 'rolled_back' && 'border-gray-500/30 bg-gray-500/5',
                      process.status === 'running' && 'border-blue-500/30 bg-blue-500/5'
                    )}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>{metadata.event_title || 'Unknown Event'}</span>
                          <span className={cn(
                            'px-2 py-0.5 text-xs rounded-sm',
                            process.status === 'completed' && !hasErrors && 'bg-green-500/20 text-green-400',
                            process.status === 'completed' && hasErrors && 'bg-yellow-500/20 text-yellow-400',
                            process.status === 'failed' && 'bg-red-500/20 text-red-400',
                            process.status === 'rolled_back' && 'bg-gray-500/20 text-gray-400',
                            process.status === 'running' && 'bg-blue-500/20 text-blue-400'
                          )}>
                            {process.status === 'completed' && hasErrors ? 'completed with errors' : process.status}
                          </span>
                        </div>
                        <div className='text-sm text-muted-foreground mt-1'>
                          {metadata.ticket_tier_name && (
                            <span>{metadata.ticket_tier_name} &bull; </span>
                          )}
                          <span className='text-green-400'>{process.successful_items} imported</span>
                          {process.failed_items > 0 && (
                            <span className='text-red-400'> &bull; {process.failed_items} failed</span>
                          )}
                        </div>
                        <div className='flex items-center gap-4 text-xs text-muted-foreground mt-2'>
                          <span className='flex items-center gap-1'>
                            <Calendar className='h-3 w-3' />
                            {new Date(process.created_at).toLocaleDateString()}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {new Date(process.created_at).toLocaleTimeString()}
                          </span>
                          <span className='font-mono'>{process.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                      {canRollback && (
                        <FmCommonButton
                          variant='destructive-outline'
                          size='sm'
                          onClick={() => onRollback(process)}
                          disabled={isRollingBack === process.id}
                        >
                          {isRollingBack === process.id ? (
                            <FmCommonLoadingSpinner size='sm' />
                          ) : (
                            <>
                              <RotateCcw className='h-3 w-3 mr-1' />
                              Rollback
                            </>
                          )}
                        </FmCommonButton>
                      )}
                    </div>

                    {/* General error message */}
                    {process.error_message && (
                      <div className='mt-2 p-2 bg-red-500/10 text-red-400 text-xs rounded-sm'>
                        {process.error_message}
                      </div>
                    )}

                    {/* Detailed error list */}
                    {hasErrors && (
                      <div className='mt-3'>
                        <button
                          onClick={() => toggleErrors(process.id)}
                          className='flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300'
                        >
                          <AlertTriangle className='h-4 w-4' />
                          <span>{metadata.errors!.length} error{metadata.errors!.length !== 1 ? 's' : ''} during import</span>
                          {isErrorsExpanded ? <ChevronUp className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />}
                        </button>

                        {isErrorsExpanded && (
                          <div className='mt-2 max-h-48 overflow-y-auto space-y-1'>
                            {metadata.errors!.map((err, idx) => (
                              <div
                                key={idx}
                                className='p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-sm text-xs'
                              >
                                <span className='text-yellow-400 font-medium'>Row {err.rowIndex}:</span>
                                <span className='text-yellow-300 ml-2'>{err.error}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </FmCommonCardContent>
      </FmCommonCard>
    </div>
  );
}
