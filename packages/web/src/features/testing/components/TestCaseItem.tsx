import { TestResult } from '../types/testing';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { Badge } from '@/components/common/shadcn/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@force-majeure/shared';

interface TestCaseItemProps {
  result: TestResult;
}

export function TestCaseItem({ result }: TestCaseItemProps) {
  const getStatusIcon = () => {
    switch (result.status) {
      case 'passed':
        return <CheckCircle2 className='h-5 w-5 text-green-500' />;
      case 'failed':
        return <XCircle className='h-5 w-5 text-red-500' />;
      case 'skipped':
        return <AlertCircle className='h-5 w-5 text-yellow-500' />;
      default:
        return <Clock className='h-5 w-5 text-muted-foreground' />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, any> = {
      passed: 'default',
      failed: 'destructive',
      skipped: 'secondary',
    };

    return (
      <Badge variant={variants[result.status] || 'outline'}>
        {result.status}
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        'p-4 border rounded-lg transition-colors',
        result.status === 'passed' && 'border-green-500/30 bg-green-500/5',
        result.status === 'failed' && 'border-red-500/30 bg-red-500/5',
        result.status === 'skipped' && 'border-yellow-500/30 bg-yellow-500/5',
        !['passed', 'failed', 'skipped'].includes(result.status) &&
          'border-border bg-card'
      )}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          {getStatusIcon()}
          <div className='flex-1 min-w-0'>
            <h4 className='font-medium truncate'>{result.testName}</h4>
            <div className='flex items-center gap-3 mt-1 text-sm text-muted-foreground'>
              <span>{result.executionTime}ms</span>
              {result.retryCount !== undefined && result.retryCount > 0 && (
                <span>({result.retryCount} retries)</span>
              )}
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Error Details */}
      {result.error && (
        <div className='mt-4'>
          <FmCommonCollapsibleSection
            title='Error Details'
            defaultExpanded={false}
          >
            <div className='space-y-2'>
              <div>
                <p className='text-sm font-medium text-red-500'>
                  Error Message:
                </p>
                <p className='text-sm text-muted-foreground mt-1 p-3 bg-background rounded border border-border'>
                  {result.error.message}
                </p>
              </div>
              {result.error.stack && (
                <div>
                  <p className='text-sm font-medium text-red-500'>
                    Stack Trace:
                  </p>
                  <pre className='text-xs text-muted-foreground mt-1 p-3 bg-background rounded border border-border overflow-x-auto'>
                    {result.error.stack}
                  </pre>
                </div>
              )}
            </div>
          </FmCommonCollapsibleSection>
        </div>
      )}

      {/* Logs */}
      {result.logs.length > 0 && (
        <div className='mt-4'>
          <FmCommonCollapsibleSection title='Test Logs' defaultExpanded={false}>
            <div className='space-y-1'>
              {result.logs.map((log, index) => (
                <div
                  key={index}
                  className={cn(
                    'text-xs p-2 rounded font-mono',
                    log.level === 'error' && 'text-red-500 bg-red-500/10',
                    log.level === 'warn' && 'text-yellow-500 bg-yellow-500/10',
                    log.level === 'info' && 'text-blue-500 bg-blue-500/10',
                    log.level === 'debug' && 'text-muted-foreground bg-muted'
                  )}
                >
                  <span className='opacity-70'>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>{' '}
                  <span className='font-semibold'>
                    [{log.level.toUpperCase()}]
                  </span>{' '}
                  {log.message}
                </div>
              ))}
            </div>
          </FmCommonCollapsibleSection>
        </div>
      )}
    </div>
  );
}
