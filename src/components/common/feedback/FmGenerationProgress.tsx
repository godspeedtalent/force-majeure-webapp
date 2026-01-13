/**
 * FmGenerationProgress
 *
 * Visual feedback component for mock data generation progress.
 * Shows step-by-step progress, live counts, and scrolling log feed.
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Users,
  ShoppingCart,
  Ticket,
  Heart,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/shared';
import type { GenerationProgress, GenerationLogEntry } from '@/services/mockOrders/types';

interface FmGenerationProgressProps {
  progress: GenerationProgress | null;
  className?: string;
}

/**
 * Step status icon component
 */
function StepIcon({ status }: { status: 'pending' | 'in_progress' | 'completed' | 'error' }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className='h-4 w-4 text-green-400' />;
    case 'in_progress':
      return <Loader2 className='h-4 w-4 text-fm-purple animate-spin' />;
    case 'error':
      return <XCircle className='h-4 w-4 text-red-400' />;
    default:
      return <Circle className='h-4 w-4 text-muted-foreground/50' />;
  }
}

/**
 * Log entry icon component
 */
function LogIcon({ level }: { level: GenerationLogEntry['level'] }) {
  switch (level) {
    case 'success':
      return <CheckCircle className='h-3 w-3 text-green-400 flex-shrink-0' />;
    case 'warning':
      return <AlertTriangle className='h-3 w-3 text-yellow-400 flex-shrink-0' />;
    case 'error':
      return <XCircle className='h-3 w-3 text-red-400 flex-shrink-0' />;
    default:
      return <Info className='h-3 w-3 text-muted-foreground flex-shrink-0' />;
  }
}

/**
 * Format timestamp to relative time
 */
function formatTimestamp(timestamp: number, startedAt: number): string {
  const elapsed = Math.round((timestamp - startedAt) / 1000);
  if (elapsed < 60) return `${elapsed}s`;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${mins}m ${secs}s`;
}

export function FmGenerationProgress({ progress, className }: FmGenerationProgressProps) {
  const { t } = useTranslation('common');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [progress?.logs.length]);

  if (!progress) return null;

  const { phase, overallProgress, steps, counts, logs, isComplete, error, startedAt, completedAt } = progress;

  // Calculate elapsed time
  const elapsedMs = (completedAt || Date.now()) - startedAt;
  const elapsedSecs = (elapsedMs / 1000).toFixed(1);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Progress Bar */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-xs'>
          <span className='text-muted-foreground uppercase tracking-wide'>
            {t('mockProgress.overallProgress')}
          </span>
          <span className={cn(
            'font-medium',
            isComplete && !error ? 'text-green-400' : 'text-fm-purple'
          )}>
            {overallProgress}%
          </span>
        </div>
        <div className='h-2 bg-background/50 border border-border overflow-hidden'>
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out',
              error ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-fm-purple'
            )}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            {isComplete
              ? error
                ? t('mockProgress.failed')
                : t('mockProgress.complete')
              : t(`mockProgress.phases.${phase}`)}
          </span>
          <span>{elapsedSecs}s</span>
        </div>
      </div>

      {/* Steps */}
      <div className='space-y-1'>
        {steps.map((step) => {
          const progressPct = step.total > 0 ? Math.round((step.current / step.total) * 100) : 0;
          const isActive = step.status === 'in_progress';

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 py-1.5 px-2 transition-colors',
                isActive && 'bg-fm-purple/10 border-l-2 border-fm-purple'
              )}
            >
              <StepIcon status={step.status} />
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between gap-2'>
                  <span className={cn(
                    'text-xs truncate',
                    step.status === 'completed' && 'text-green-400',
                    step.status === 'error' && 'text-red-400',
                    step.status === 'pending' && 'text-muted-foreground/50'
                  )}>
                    {step.label}
                  </span>
                  {step.total > 0 && (
                    <span className='text-xs text-muted-foreground flex-shrink-0'>
                      {step.current}/{step.total}
                    </span>
                  )}
                </div>
                {isActive && step.total > 0 && (
                  <div className='h-1 bg-background/50 mt-1 overflow-hidden'>
                    <div
                      className='h-full bg-fm-purple/60 transition-all duration-150'
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Stats */}
      <div className='grid grid-cols-3 gap-2 p-3 bg-background/30 border border-border'>
        <div className='text-center'>
          <div className='flex items-center justify-center gap-1 text-muted-foreground'>
            <Users className='h-3 w-3' />
            <span className='text-[10px] uppercase'>{t('mockProgress.stats.users')}</span>
          </div>
          <div className='text-lg font-medium text-fm-purple'>{counts.usersCreated}</div>
        </div>
        <div className='text-center'>
          <div className='flex items-center justify-center gap-1 text-muted-foreground'>
            <ShoppingCart className='h-3 w-3' />
            <span className='text-[10px] uppercase'>{t('mockProgress.stats.orders')}</span>
          </div>
          <div className='text-lg font-medium text-fm-purple'>{counts.ordersCreated}</div>
        </div>
        <div className='text-center'>
          <div className='flex items-center justify-center gap-1 text-muted-foreground'>
            <Ticket className='h-3 w-3' />
            <span className='text-[10px] uppercase'>{t('mockProgress.stats.tickets')}</span>
          </div>
          <div className='text-lg font-medium text-fm-purple'>{counts.ticketsCreated}</div>
        </div>
        {(counts.rsvpsCreated > 0 || counts.interestsCreated > 0) && (
          <>
            <div className='text-center'>
              <div className='flex items-center justify-center gap-1 text-muted-foreground'>
                <Calendar className='h-3 w-3' />
                <span className='text-[10px] uppercase'>{t('mockProgress.stats.rsvps')}</span>
              </div>
              <div className='text-lg font-medium text-fm-purple'>{counts.rsvpsCreated}</div>
            </div>
            <div className='text-center'>
              <div className='flex items-center justify-center gap-1 text-muted-foreground'>
                <Heart className='h-3 w-3' />
                <span className='text-[10px] uppercase'>{t('mockProgress.stats.interests')}</span>
              </div>
              <div className='text-lg font-medium text-fm-purple'>{counts.interestsCreated}</div>
            </div>
            <div className='text-center'>
              <div className='flex items-center justify-center gap-1 text-muted-foreground'>
                <Users className='h-3 w-3' />
                <span className='text-[10px] uppercase'>{t('mockProgress.stats.guests')}</span>
              </div>
              <div className='text-lg font-medium text-fm-purple'>{counts.guestsCreated}</div>
            </div>
          </>
        )}
      </div>

      {/* Log Feed */}
      <div className='space-y-1'>
        <div className='flex items-center justify-between'>
          <span className='text-xs text-muted-foreground uppercase tracking-wide'>
            {t('mockProgress.activityLog')}
          </span>
          <span className='text-[10px] text-muted-foreground'>
            {logs.length} {t('mockProgress.entries')}
          </span>
        </div>
        <div
          ref={logContainerRef}
          className='h-32 overflow-y-auto bg-background/20 border border-border p-2 font-mono text-[11px] space-y-0.5'
        >
          {logs.length === 0 ? (
            <div className='text-muted-foreground/50 italic'>
              {t('mockProgress.waitingForLogs')}
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  'flex items-start gap-1.5 py-0.5',
                  log.level === 'error' && 'text-red-400',
                  log.level === 'warning' && 'text-yellow-400',
                  log.level === 'success' && 'text-green-400'
                )}
              >
                <LogIcon level={log.level} />
                <span className='text-muted-foreground/60 flex-shrink-0'>
                  [{formatTimestamp(log.timestamp, startedAt)}]
                </span>
                <span className='break-all'>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className='flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm'>
          <XCircle className='h-4 w-4 flex-shrink-0 mt-0.5' />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
