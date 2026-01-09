import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import type { ImportResult } from '../types';

interface CompleteStepProps {
  importResults: ImportResult[];
  onReset: () => void;
  onViewHistory: () => void;
}

export function CompleteStep({
  importResults,
  onReset,
  onViewHistory,
}: CompleteStepProps) {
  const [showErrors, setShowErrors] = useState(true);

  const successResults = importResults.filter(r => r.status === 'success' && !r.error);
  const partialResults = importResults.filter(r => r.status === 'success' && r.error);
  const failedResults = importResults.filter(r => r.status === 'failed');

  const totalTickets = importResults.reduce((sum, r) => sum + r.ticketCount, 0);
  const hasErrors = failedResults.length > 0 || partialResults.length > 0;
  const allFailed = successResults.length === 0 && partialResults.length === 0;

  return (
    <div className='space-y-6'>
      <FmCommonCard hoverable={false}>
        <FmCommonCardContent className='p-6 text-center'>
          {allFailed ? (
            <XCircle className='h-16 w-16 text-red-400 mx-auto mb-4' />
          ) : hasErrors ? (
            <AlertTriangle className='h-16 w-16 text-yellow-400 mx-auto mb-4' />
          ) : (
            <CheckCircle className='h-16 w-16 text-green-400 mx-auto mb-4' />
          )}

          <h3 className='text-2xl font-medium mb-2'>
            {allFailed ? 'Import Failed' : hasErrors ? 'Import Completed with Errors' : 'Import Complete!'}
          </h3>

          <div className='text-muted-foreground mb-6 space-y-1'>
            {successResults.length > 0 && (
              <p className='text-green-400'>
                {successResults.length} order{successResults.length !== 1 ? 's' : ''} imported successfully
              </p>
            )}
            {partialResults.length > 0 && (
              <p className='text-yellow-400'>
                {partialResults.length} order{partialResults.length !== 1 ? 's' : ''} with partial errors
              </p>
            )}
            {failedResults.length > 0 && (
              <p className='text-red-400'>
                {failedResults.length} order{failedResults.length !== 1 ? 's' : ''} failed
              </p>
            )}
            <p className='text-muted-foreground mt-2'>
              {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} created
            </p>
          </div>

          <div className='flex justify-center gap-4'>
            <FmCommonButton variant='default' onClick={onReset}>
              Start New Import
            </FmCommonButton>
            <FmCommonButton variant='gold' onClick={onViewHistory}>
              View History
            </FmCommonButton>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>

      {/* Error Details */}
      {hasErrors && (
        <FmCommonCard hoverable={false}>
          <FmCommonCardContent className='p-4'>
            <button
              onClick={() => setShowErrors(!showErrors)}
              className='w-full flex items-center justify-between text-left'
            >
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-5 w-5 text-yellow-400' />
                <h3 className='font-medium'>
                  Error Details ({failedResults.length + partialResults.length} issue{failedResults.length + partialResults.length !== 1 ? 's' : ''})
                </h3>
              </div>
              {showErrors ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
            </button>

            {showErrors && (
              <div className='mt-4 space-y-2 max-h-64 overflow-y-auto'>
                {failedResults.map(result => (
                  <div
                    key={result.rowIndex}
                    className='p-3 bg-red-500/10 border border-red-500/30 rounded-sm'
                  >
                    <div className='flex items-start gap-2'>
                      <XCircle className='h-4 w-4 text-red-400 mt-0.5 flex-shrink-0' />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 text-sm'>
                          <span className='text-red-400 font-medium'>Row {result.rowIndex}</span>
                          <span className='text-muted-foreground truncate'>{result.email}</span>
                        </div>
                        <p className='text-xs text-red-300 mt-1'>{result.error}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {partialResults.map(result => (
                  <div
                    key={result.rowIndex}
                    className='p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-sm'
                  >
                    <div className='flex items-start gap-2'>
                      <AlertTriangle className='h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0' />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 text-sm'>
                          <span className='text-yellow-400 font-medium'>Row {result.rowIndex}</span>
                          <span className='text-muted-foreground truncate'>{result.email}</span>
                          {result.orderId && (
                            <span className='text-xs text-muted-foreground font-mono'>
                              Order: {result.orderId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        <p className='text-xs text-yellow-300 mt-1'>{result.error}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FmCommonCardContent>
        </FmCommonCard>
      )}

      {/* Import Results Table */}
      <FmCommonCard hoverable={false}>
        <FmCommonCardContent className='p-0'>
          <div className='p-4 border-b border-white/10'>
            <h3 className='font-medium'>Import Results</h3>
          </div>
          <div className='overflow-x-auto max-h-80'>
            <table className='w-full text-sm'>
              <thead className='bg-white/5 sticky top-0'>
                <tr>
                  <th className='p-2 text-left'>Status</th>
                  <th className='p-2 text-left'>Row</th>
                  <th className='p-2 text-left'>Email</th>
                  <th className='p-2 text-left'>Tickets</th>
                  <th className='p-2 text-left'>Order ID</th>
                </tr>
              </thead>
              <tbody>
                {importResults.map(result => (
                  <tr
                    key={result.rowIndex}
                    className={cn(
                      'border-b border-white/5',
                      result.status === 'failed' && 'bg-red-500/5',
                      result.status === 'success' && result.error && 'bg-yellow-500/5',
                      result.status === 'success' && !result.error && 'bg-green-500/5'
                    )}
                  >
                    <td className='p-2'>
                      {result.status === 'failed' ? (
                        <XCircle className='h-4 w-4 text-red-400' />
                      ) : result.error ? (
                        <AlertTriangle className='h-4 w-4 text-yellow-400' />
                      ) : (
                        <CheckCircle className='h-4 w-4 text-green-400' />
                      )}
                    </td>
                    <td className='p-2'>{result.rowIndex}</td>
                    <td className='p-2 truncate max-w-48'>{result.email}</td>
                    <td className='p-2'>{result.ticketCount}</td>
                    <td className='p-2 font-mono text-xs'>
                      {result.orderId ? `${result.orderId.slice(0, 8)}...` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>
    </div>
  );
}
