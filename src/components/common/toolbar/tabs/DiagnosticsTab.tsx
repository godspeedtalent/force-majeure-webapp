import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Info,
  Activity,
} from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { Button } from '@/components/common/shadcn/button';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import { cn } from '@/shared';
import { useDiagnostics, getMetricDuration, getTimingColor } from '@/shared/hooks/useDiagnostics';
import type { DiagnosticEvent } from '@/shared/services/initDiagnostics';

// Status banner component
function StatusBanner({ status }: { status: 'healthy' | 'warning' | 'error' | 'incomplete' }) {
  const { t } = useTranslation('common');

  const config = {
    healthy: {
      icon: CheckCircle2,
      label: t('diagnostics.status.healthy'),
      className: 'bg-green-500/20 border-green-500/50 text-green-400',
    },
    warning: {
      icon: AlertTriangle,
      label: t('diagnostics.status.warning'),
      className: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    },
    error: {
      icon: XCircle,
      label: t('diagnostics.status.error'),
      className: 'bg-red-500/20 border-red-500/50 text-red-400',
    },
    incomplete: {
      icon: Clock,
      label: t('diagnostics.status.incomplete'),
      className: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    },
  }[status];

  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2 p-3 border', config.className)}>
      <Icon className='h-5 w-5' />
      <span className='font-medium'>{config.label}</span>
    </div>
  );
}

// Timeline event component
function TimelineEvent({ event }: { event: DiagnosticEvent }) {
  const statusConfig = {
    start: { icon: Play, color: 'text-gray-400' },
    complete: { icon: CheckCircle2, color: 'text-green-400' },
    error: { icon: XCircle, color: 'text-red-400' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400' },
    info: { icon: Info, color: 'text-blue-400' },
  }[event.status];

  const Icon = statusConfig.icon;
  const duration = event.details?.duration as number | undefined;

  return (
    <div className='flex items-center gap-2 py-1 text-xs font-mono'>
      <span className='text-white/50 w-12 text-right'>{event.elapsed.toFixed(0)}ms</span>
      <Icon className={cn('h-3 w-3', statusConfig.color)} />
      <span className='text-white/80 flex-1 truncate'>{event.name}</span>
      {duration && (
        <span className={cn('text-xs', getTimingColorClass(duration))}>
          {duration.toFixed(0)}ms
        </span>
      )}
    </div>
  );
}

// Metric row component
function MetricRow({
  label,
  value,
  maxValue = 2000,
}: {
  label: string;
  value: number | null;
  maxValue?: number;
}) {
  if (value === null) {
    return (
      <div className='flex items-center gap-2 py-1'>
        <span className='text-xs text-white/50 w-24'>{label}</span>
        <span className='text-xs text-white/30'>Not completed</span>
      </div>
    );
  }

  const percentage = Math.min((value / maxValue) * 100, 100);
  const colorClass = getTimingColorClass(value);

  return (
    <div className='flex items-center gap-2 py-1'>
      <span className='text-xs text-white/50 w-24'>{label}</span>
      <div className='flex-1 h-2 bg-white/10 overflow-hidden'>
        <div
          className={cn('h-full transition-all', colorClass.replace('text-', 'bg-'))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-xs w-14 text-right', colorClass)}>{value.toFixed(0)}ms</span>
    </div>
  );
}

function getTimingColorClass(durationMs: number): string {
  const color = getTimingColor(durationMs);
  return {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  }[color];
}

// Health Monitor section component
function HealthMonitorSection({
  healthMonitor,
  onStart,
  onStop,
}: {
  healthMonitor: {
    isRunning: boolean;
    intervalMs: number;
    lastCheckTime: number | null;
    lastCheckResult: 'healthy' | 'issues' | null;
  };
  onStart: () => void;
  onStop: () => void;
}) {
  const { t } = useTranslation('common');
  const [timeSinceLastCheck, setTimeSinceLastCheck] = useState<number | null>(null);

  // Update time since last check every second
  useEffect(() => {
    if (!healthMonitor.lastCheckTime) {
      setTimeSinceLastCheck(null);
      return;
    }

    const updateTime = () => {
      setTimeSinceLastCheck(Date.now() - healthMonitor.lastCheckTime!);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [healthMonitor.lastCheckTime]);

  const formatTimeSince = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s ago`;
  };

  return (
    <div className='bg-white/5 p-3 space-y-2'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Activity className={cn('h-4 w-4', healthMonitor.isRunning ? 'text-green-400' : 'text-white/30')} />
          <span className='text-xs text-white/70'>
            {t('diagnostics.healthMonitor.title', 'Health Monitor')}
          </span>
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='h-6 px-2 text-xs'
          onClick={healthMonitor.isRunning ? onStop : onStart}
        >
          {healthMonitor.isRunning ? (
            <>
              <Pause className='h-3 w-3 mr-1' />
              {t('diagnostics.healthMonitor.stop', 'Stop')}
            </>
          ) : (
            <>
              <Play className='h-3 w-3 mr-1' />
              {t('diagnostics.healthMonitor.start', 'Start')}
            </>
          )}
        </Button>
      </div>

      {healthMonitor.isRunning && (
        <div className='text-xs space-y-1 pl-6'>
          <div className='flex justify-between text-white/50'>
            <span>{t('diagnostics.healthMonitor.interval', 'Interval')}:</span>
            <span>{healthMonitor.intervalMs / 1000}s</span>
          </div>
          {healthMonitor.lastCheckTime && (
            <>
              <div className='flex justify-between text-white/50'>
                <span>{t('diagnostics.healthMonitor.lastCheck', 'Last check')}:</span>
                <span>{timeSinceLastCheck !== null ? formatTimeSince(timeSinceLastCheck) : '-'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-white/50'>{t('diagnostics.healthMonitor.result', 'Result')}:</span>
                <span className={cn(
                  healthMonitor.lastCheckResult === 'healthy' ? 'text-green-400' : 'text-yellow-400'
                )}>
                  {healthMonitor.lastCheckResult === 'healthy' ? '✓ Healthy' : '⚠ Issues'}
                </span>
              </div>
            </>
          )}
          {!healthMonitor.lastCheckTime && (
            <div className='text-white/30 italic'>
              {t('diagnostics.healthMonitor.waiting', 'Waiting for first check...')}
            </div>
          )}
        </div>
      )}

      {!healthMonitor.isRunning && (
        <div className='text-xs text-white/30 pl-6 italic'>
          {t('diagnostics.healthMonitor.notRunning', 'Monitor is not running')}
        </div>
      )}
    </div>
  );
}

export function DiagnosticsTabContent() {
  const { t } = useTranslation('common');
  const diagnostics = useDiagnostics();
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  const authGetSession = getMetricDuration(diagnostics.events, 'auth.getSession');
  const authInitSession = getMetricDuration(diagnostics.events, 'auth.initSession');
  const i18nInit = getMetricDuration(diagnostics.events, 'i18n.init');
  const authBootstrap = getMetricDuration(diagnostics.events, 'auth.bootstrap');
  const imports = getMetricDuration(diagnostics.events, 'imports');

  const hasIssues =
    diagnostics.errors.length > 0 ||
    diagnostics.warnings.length > 0 ||
    diagnostics.pendingOperations.length > 0;

  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />

      {/* Status Banner */}
      <div className='px-4'>
        <StatusBanner status={diagnostics.status} />
      </div>

      {/* Key Metrics */}
      <div className='px-4'>
        <h3 className='text-xs uppercase text-white/50 mb-2'>
          {t('diagnostics.sections.metrics')}
        </h3>
        <div className='space-y-1 bg-white/5 p-3'>
          <MetricRow label={t('diagnostics.metrics.imports')} value={imports} maxValue={500} />
          <MetricRow label={t('diagnostics.metrics.i18nInit')} value={i18nInit} />
          <MetricRow label={t('diagnostics.metrics.authSession')} value={authInitSession ?? authGetSession} />
          <MetricRow label={t('diagnostics.metrics.authBootstrap')} value={authBootstrap} />
          <Separator className='bg-white/10 my-2' />
          <div className='flex items-center justify-between text-xs'>
            <span className='text-white/50'>{t('diagnostics.metrics.totalInit')}</span>
            <span className={cn('font-mono', getTimingColorClass(diagnostics.totalElapsed))}>
              {diagnostics.totalElapsed.toFixed(0)}ms
            </span>
          </div>
        </div>
      </div>

      {/* Health Monitor */}
      <div className='px-4'>
        <h3 className='text-xs uppercase text-white/50 mb-2'>
          {t('diagnostics.sections.healthMonitor', 'Health Monitor')}
        </h3>
        <HealthMonitorSection
          healthMonitor={diagnostics.healthMonitor}
          onStart={diagnostics.startHealthMonitor}
          onStop={diagnostics.stopHealthMonitor}
        />
      </div>

      {/* Active Issues */}
      {hasIssues && (
        <div className='px-4'>
          <h3 className='text-xs uppercase text-white/50 mb-2'>
            {t('diagnostics.sections.issues')}
          </h3>
          <div className='space-y-2'>
            {/* Errors */}
            {diagnostics.errors.length > 0 && (
              <div className='bg-red-500/10 border border-red-500/30 p-3'>
                <div className='flex items-center gap-2 text-red-400 text-xs mb-2'>
                  <XCircle className='h-3 w-3' />
                  <span>
                    {diagnostics.errors.length} {t('diagnostics.errors')}
                  </span>
                </div>
                {diagnostics.errors.map((err, i) => (
                  <div key={i} className='text-xs text-red-300/80 pl-5 truncate'>
                    {err.message}
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {diagnostics.warnings.length > 0 && (
              <div className='bg-yellow-500/10 border border-yellow-500/30 p-3'>
                <div className='flex items-center gap-2 text-yellow-400 text-xs mb-2'>
                  <AlertTriangle className='h-3 w-3' />
                  <span>
                    {diagnostics.warnings.length} {t('diagnostics.warnings')}
                  </span>
                </div>
                {diagnostics.warnings.map((warn, i) => (
                  <div key={i} className='text-xs text-yellow-300/80 pl-5 truncate'>
                    {warn.message}
                  </div>
                ))}
              </div>
            )}

            {/* Pending Operations */}
            {diagnostics.pendingOperations.length > 0 && (
              <div className='bg-blue-500/10 border border-blue-500/30 p-3'>
                <div className='flex items-center gap-2 text-blue-400 text-xs mb-2'>
                  <Clock className='h-3 w-3' />
                  <span>{t('diagnostics.stuckOperations')}</span>
                </div>
                {diagnostics.pendingOperations.map((op, i) => (
                  <div key={i} className='text-xs text-blue-300/80 pl-5 flex justify-between'>
                    <span className='truncate'>{op.name}</span>
                    <span className='text-blue-400 ml-2'>
                      {(op.waitingMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline (Collapsible) */}
      <div className='px-4'>
        <button
          onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          className='flex items-center gap-2 text-xs uppercase text-white/50 hover:text-white/70 w-full'
        >
          {isTimelineExpanded ? (
            <ChevronDown className='h-3 w-3' />
          ) : (
            <ChevronRight className='h-3 w-3' />
          )}
          {t('diagnostics.sections.timeline')} ({diagnostics.events.length})
        </button>

        {isTimelineExpanded && (
          <ScrollArea className='h-48 mt-2 bg-white/5 p-2'>
            <div className='space-y-0.5'>
              {diagnostics.events.map((event, i) => (
                <TimelineEvent key={i} event={event} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* No Issues Message */}
      {!hasIssues && diagnostics.status === 'healthy' && (
        <div className='px-4'>
          <div className='flex items-center gap-2 text-green-400/70 text-xs bg-green-500/5 p-3 border border-green-500/20'>
            <CheckCircle2 className='h-4 w-4' />
            <span>{t('diagnostics.noIssues')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function DiagnosticsTabFooter() {
  const { t } = useTranslation('common');
  const { copyReport, reset, refresh } = useDiagnostics();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    copyReport();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [copyReport]);

  return (
    <div className='flex gap-2'>
      <FmPortalTooltip content={t('diagnostics.actions.copyReport')} side='top'>
        <Button
          variant='outline'
          size='sm'
          className={cn(
            'flex-1 border-white/20 hover:bg-white/10',
            copied && 'bg-green-500/20 border-green-500/50'
          )}
          onClick={handleCopy}
        >
          {copied ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}
          {copied ? t('diagnostics.copied') : t('diagnostics.actions.copyReport')}
        </Button>
      </FmPortalTooltip>

      <FmPortalTooltip content={t('diagnostics.actions.refresh')} side='top'>
        <Button
          variant='outline'
          size='sm'
          className='border-white/20 hover:bg-white/10'
          onClick={refresh}
        >
          <RefreshCw className='h-4 w-4' />
        </Button>
      </FmPortalTooltip>

      <FmPortalTooltip content={t('diagnostics.actions.clear')} side='top'>
        <Button
          variant='outline'
          size='sm'
          className='border-white/20 hover:bg-white/10'
          onClick={reset}
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </FmPortalTooltip>
    </div>
  );
}
