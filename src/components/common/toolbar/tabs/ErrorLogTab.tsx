/**
 * ErrorLogTab
 *
 * Developer toolbar tab for monitoring client-side errors.
 * Shows recent errors logged via the error logging service.
 * Compact single-row layout with multi-select filters.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  XCircle,
  Info,
  Bug,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Separator } from '@/components/common/shadcn/separator';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { supabase, cn, logger } from '@/shared';
import type { ErrorLogLevel, ErrorLogSource } from '@/features/error-logging';
import { ERROR_LEVEL_CONFIG, ERROR_SOURCE_CONFIG } from '@/features/error-logging';

// ============================================================================
// Types
// ============================================================================

interface ErrorLogRow {
  id: string;
  level: ErrorLogLevel;
  source: ErrorLogSource;
  message: string;
  endpoint: string | null;
  method: string | null;
  status_code: number | null;
  details: Record<string, unknown> | null;
  user_id: string | null;
  page_url: string | null;
  created_at: string;
}

// Filter levels (excluding fatal as it's rare)
const FILTER_LEVELS: ErrorLogLevel[] = ['error', 'warn', 'info', 'debug'];

// ============================================================================
// Helper Components
// ============================================================================

const LEVEL_ICONS = {
  debug: Bug,
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
  fatal: XCircle,
};

interface ErrorLogItemProps {
  log: ErrorLogRow;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCopy: (text: string) => void;
}

function ErrorLogItem({ log, isExpanded, onToggleExpand, onCopy }: ErrorLogItemProps) {
  const { t } = useTranslation('common');
  const levelConfig = ERROR_LEVEL_CONFIG[log.level];
  const sourceConfig = ERROR_SOURCE_CONFIG[log.source];
  const Icon = LEVEL_ICONS[log.level] || Info;

  // Compact time format
  const compactTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  return (
    <div
      className={cn(
        'cursor-pointer transition-all duration-150 group',
        'border-l-2 hover:bg-white/5',
        isExpanded ? 'bg-white/5 border-fm-gold' : 'border-transparent hover:border-fm-gold/50'
      )}
      onClick={onToggleExpand}
    >
      {/* Compact Row */}
      <div className='flex items-center gap-1.5 px-1.5 py-1'>
        {/* Level Icon */}
        <FmPortalTooltip content={levelConfig.label} side="right">
          <div className={cn('w-5 h-5 flex items-center justify-center flex-shrink-0', levelConfig.color)}>
            <Icon className='h-3 w-3' />
          </div>
        </FmPortalTooltip>

        {/* Source Badge */}
        <span className={cn('text-[9px] font-medium flex-shrink-0 px-1', sourceConfig.color)}>
          {log.source.slice(0, 3).toUpperCase()}
        </span>

        {/* Status Code (if present) */}
        {log.status_code && (
          <span className={cn(
            'text-[9px] font-mono flex-shrink-0 w-6 text-center',
            log.status_code >= 500 ? 'text-red-400' :
            log.status_code >= 400 ? 'text-yellow-400' : 'text-green-400'
          )}>
            {log.status_code}
          </span>
        )}

        {/* Message */}
        <span className='flex-1 min-w-0 text-[11px] text-white/90 truncate'>
          {log.message}
        </span>

        {/* Time */}
        <span className='text-[9px] text-muted-foreground flex-shrink-0 w-6 text-right'>
          {compactTime(log.created_at)}
        </span>

        {/* Menu Button - visible on hover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FmCommonIconButton
              icon={MoreVertical}
              variant='secondary'
              size='sm'
              className='h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-fm-gold flex-shrink-0'
              onClick={e => e.stopPropagation()}
              aria-label={t('errorLog.openMenu')}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className='bg-card border-border rounded-none w-40'>
            <DropdownMenuItem
              onSelect={() => onCopy(JSON.stringify(log, null, 2))}
              className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
            >
              <Copy className='h-3 w-3 mr-2' />
              {t('errorLog.copyDetails')}
            </DropdownMenuItem>
            {log.endpoint && (
              <DropdownMenuItem
                onSelect={() => onCopy(log.endpoint || '')}
                className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
              >
                <Copy className='h-3 w-3 mr-2' />
                {t('errorLog.copyEndpoint')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className='px-1.5 pb-2 pl-[30px] space-y-1'>
          {log.endpoint && (
            <div className='text-[10px]'>
              <span className='text-muted-foreground'>{log.method || 'GET'} </span>
              <span className='text-white/70 font-mono'>{log.endpoint}</span>
            </div>
          )}
          {log.page_url && (
            <div className='text-[10px] text-white/50 truncate'>
              {log.page_url}
            </div>
          )}
          {log.details && Object.keys(log.details).length > 0 && (
            <pre className='text-[9px] text-white/50 bg-black/30 p-1 overflow-x-auto max-h-20'>
              {JSON.stringify(log.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Components
// ============================================================================

export function ErrorLogTabContent() {
  const { t } = useTranslation('common');
  // Multi-select: all levels enabled by default
  const [enabledLevels, setEnabledLevels] = useState<Set<ErrorLogLevel>>(
    new Set(FILTER_LEVELS)
  );
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Toggle a level filter
  const toggleLevel = (level: ErrorLogLevel) => {
    setEnabledLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        // Don't allow removing all filters
        if (next.size > 1) {
          next.delete(level);
        }
      } else {
        next.add(level);
      }
      return next;
    });
  };

  // Fetch recent error logs
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['error-logs'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('error_logs')
        .select('id, level, source, message, endpoint, method, status_code, details, user_id, page_url, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (queryError) throw queryError;
      return (data || []) as ErrorLogRow[];
    },
    refetchInterval: 30000,
  });

  // Filter logs by enabled levels
  const filteredLogs = useMemo(() => {
    return logs.filter(log => enabledLevels.has(log.level));
  }, [logs, enabledLevels]);

  // Count by level
  const levelCounts = useMemo(() => {
    const counts: Record<ErrorLogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };
    logs.forEach(log => {
      if (counts[log.level] !== undefined) {
        counts[log.level]++;
      }
    });
    return counts;
  }, [logs]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='space-y-3'>
      <Separator className='bg-white/10' />

      {/* Filter Buttons - Multi-select with gold/grayscale toggle */}
      <div className='flex gap-1'>
        {FILTER_LEVELS.map(level => {
          const config = ERROR_LEVEL_CONFIG[level];
          const Icon = LEVEL_ICONS[level];
          const count = levelCounts[level];
          const isEnabled = enabledLevels.has(level);

          return (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-1.5 px-2 transition-all border',
                isEnabled
                  ? 'border-fm-gold bg-white/5'
                  : 'border-white/10 bg-white/[0.02] grayscale opacity-50 hover:opacity-70'
              )}
            >
              <Icon className={cn('h-3 w-3', isEnabled ? config.color : 'text-muted-foreground')} />
              <span className={cn(
                'text-[10px] font-mono',
                isEnabled ? config.color : 'text-muted-foreground'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Count */}
      <div className='flex items-center justify-between text-[10px] text-muted-foreground'>
        <span>{t('errorLog.showing', { count: filteredLogs.length, total: logs.length })}</span>
      </div>

      {/* Logs List */}
      <ScrollArea className='h-[calc(100vh-280px)] min-h-[300px]'>
        {isLoading ? (
          <div className='text-center py-8 text-muted-foreground text-sm'>
            {t('errorLog.loading')}
          </div>
        ) : error ? (
          <div className='text-center py-8 text-red-400 text-sm'>
            {t('errorLog.fetchError')}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground text-sm'>
            {t('errorLog.noErrors')}
          </div>
        ) : (
          <div className='divide-y divide-border/30'>
            {filteredLogs.map(log => (
              <ErrorLogItem
                key={log.id}
                log={log}
                isExpanded={expandedLogId === log.id}
                onToggleExpand={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                onCopy={handleCopy}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Copy Toast */}
      {copied && (
        <div className='fixed bottom-4 right-4 bg-green-500/90 text-white px-4 py-2 text-sm flex items-center gap-2 z-50'>
          <Check className='h-4 w-4' />
          {t('errorLog.copied')}
        </div>
      )}
    </div>
  );
}

export function ErrorLogTabFooter() {
  const { t } = useTranslation('common');

  const handleOpenSupabase = () => {
    // Open Supabase dashboard to error_logs table
    const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_REF || 'dashboard';
    window.open(`https://supabase.com/dashboard/project/${projectRef}/editor/error_logs`, '_blank');
  };

  const handleClearOldLogs = async () => {
    // Delete logs older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error } = await supabase
      .from('error_logs')
      .delete()
      .lt('created_at', sevenDaysAgo.toISOString());

    if (error) {
      logger.error('Failed to clear old logs', {
        error: error.message,
        context: 'ErrorLogTab.handleClearOldLogs',
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 border-white/20 hover:bg-white/10"
        onClick={handleOpenSupabase}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        {t('errorLog.openInSupabase')}
      </Button>
      <FmPortalTooltip content={t('errorLog.clearOldLogsTooltip')} side="top">
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 hover:bg-white/10"
          onClick={handleClearOldLogs}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </FmPortalTooltip>
    </div>
  );
}
