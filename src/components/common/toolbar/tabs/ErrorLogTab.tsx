/**
 * ErrorLogTab
 *
 * Developer toolbar tab for monitoring client-side errors.
 * Shows recent errors logged via the error logging service.
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
  Clock,
  Filter,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import {
  FmResponsiveGroupLayout,
  ResponsiveGroup,
} from '@/components/common/layout/FmResponsiveGroupLayout';
import { supabase, cn } from '@/shared';
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

// ============================================================================
// Helper Components
// ============================================================================

function ErrorLevelIcon({ level }: { level: ErrorLogLevel }) {
  const config = ERROR_LEVEL_CONFIG[level];
  const iconMap = {
    debug: Bug,
    info: Info,
    warn: AlertTriangle,
    error: XCircle,
    fatal: XCircle,
  };
  const Icon = iconMap[level] || Info;

  return (
    <FmPortalTooltip content={config.label} side="right">
      <Icon className={cn('h-4 w-4', config.color)} />
    </FmPortalTooltip>
  );
}

function ErrorLogItem({ log, onCopy }: { log: ErrorLogRow; onCopy: (text: string) => void }) {
  const levelConfig = ERROR_LEVEL_CONFIG[log.level];
  const sourceConfig = ERROR_SOURCE_CONFIG[log.source];
  const timeAgo = getTimeAgo(log.created_at);

  return (
    <div className="group p-3 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-start gap-3">
        <ErrorLevelIcon level={log.level} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={cn('text-xs border-white/20', levelConfig.color)}
            >
              {levelConfig.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs border-white/20', sourceConfig.color)}
            >
              {sourceConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>
          <p className="text-sm text-white/90 line-clamp-2 mb-2">{log.message}</p>
          {(log.endpoint || log.method || log.status_code) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {log.method && (
                <span className="font-mono bg-white/5 px-1.5 py-0.5">{log.method}</span>
              )}
              {log.endpoint && (
                <span className="font-mono truncate">{log.endpoint}</span>
              )}
              {log.status_code && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    log.status_code >= 500 ? 'text-red-400 border-red-400/30' :
                    log.status_code >= 400 ? 'text-yellow-400 border-yellow-400/30' :
                    'text-green-400 border-green-400/30'
                  )}
                >
                  {log.status_code}
                </Badge>
              )}
            </div>
          )}
        </div>
        <FmPortalTooltip content="Copy error details" side="left">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onCopy(JSON.stringify(log, null, 2))}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </FmPortalTooltip>
      </div>
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// ============================================================================
// Main Components
// ============================================================================

export function ErrorLogTabContent() {
  const { t } = useTranslation('common');
  const [levelFilter, setLevelFilter] = useState<ErrorLogLevel | 'all'>('all');
  const [copied, setCopied] = useState(false);

  // Fetch recent error logs
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['error-logs', levelFilter],
    queryFn: async () => {
      // Note: error_logs table exists but may not be in generated types yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('error_logs')
        .select('id, level, source, message, endpoint, method, status_code, details, user_id, page_url, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      return (data || []) as ErrorLogRow[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group logs by level for summary
  const summary = useMemo(() => {
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

  const groups: ResponsiveGroup[] = useMemo(() => [
    {
      id: 'summary',
      title: t('errorLog.summary'),
      icon: AlertTriangle,
      defaultExpanded: true,
      children: (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {(['error', 'warn', 'info', 'debug'] as ErrorLogLevel[]).map(level => {
              const config = ERROR_LEVEL_CONFIG[level];
              const count = summary[level];
              const isActive = levelFilter === level;
              return (
                <button
                  key={level}
                  onClick={() => setLevelFilter(isActive ? 'all' : level)}
                  className={cn(
                    'p-2 text-center transition-colors border',
                    isActive
                      ? 'bg-white/10 border-fm-gold/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  )}
                >
                  <div className={cn('text-lg font-mono', config.color)}>{count}</div>
                  <div className="text-xs text-muted-foreground">{config.label}</div>
                </button>
              );
            })}
          </div>
          {levelFilter !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-white/20"
              onClick={() => setLevelFilter('all')}
            >
              <Filter className="h-3 w-3 mr-2" />
              {t('errorLog.clearFilter')}
            </Button>
          )}
        </div>
      ),
    },
    {
      id: 'logs',
      title: t('errorLog.recentErrors'),
      icon: XCircle,
      defaultExpanded: true,
      children: (
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              {t('errorLog.loading')}
            </div>
          ) : error ? (
            <div className="text-sm text-red-400 text-center py-8">
              {t('errorLog.fetchError')}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              {t('errorLog.noErrors')}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {logs.map(log => (
                <ErrorLogItem key={log.id} log={log} onCopy={handleCopy} />
              ))}
            </div>
          )}
        </div>
      ),
    },
  ], [t, logs, isLoading, error, summary, levelFilter, handleCopy]);

  return (
    <div className="space-y-4">
      <Separator className="bg-white/10" />
      <FmResponsiveGroupLayout groups={groups} />
      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-500/90 text-white px-4 py-2 text-sm flex items-center gap-2 z-50">
          <Check className="h-4 w-4" />
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

    // Note: error_logs table exists but may not be in generated types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('error_logs')
      .delete()
      .lt('created_at', sevenDaysAgo.toISOString());

    if (error) {
      console.error('Failed to clear old logs:', error);
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
