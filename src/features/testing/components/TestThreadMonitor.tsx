import { ThreadInfo } from '../types/testing';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Badge } from '@/components/common/shadcn/badge';
import { Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TestThreadMonitorProps {
  activeThreads: ThreadInfo[];
  maxConcurrency: number;
  queuedCount: number;
}

export function TestThreadMonitor({ activeThreads, maxConcurrency, queuedCount }: TestThreadMonitorProps) {
  const completedThreads = activeThreads.filter(t => t.status === 'completed');
  const runningThreads = activeThreads.filter(t => t.status === 'active');

  return (
    <div className="space-y-4">
      {/* Thread Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-fm-gold/20 text-fm-gold border-fm-gold/30">
            {runningThreads.length} / {maxConcurrency}
          </Badge>
          <span className="text-sm text-muted-foreground">Active Threads</span>
        </div>
        
        {queuedCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {queuedCount}
            </Badge>
            <span className="text-sm text-muted-foreground">Queued</span>
          </div>
        )}
      </div>

      {/* Active Threads */}
      {runningThreads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Running Tests</h4>
          <div className="space-y-2">
            {runningThreads.map(thread => (
              <div
                key={thread.threadId}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
              >
                <FmCommonLoadingSpinner size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{thread.testName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>Started {formatDistanceToNow(thread.startTime, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {completedThreads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Recently Completed</h4>
          <div className="space-y-2">
            {completedThreads.slice(0, 3).map(thread => (
              <div
                key={thread.threadId}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg opacity-50"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{thread.testName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
