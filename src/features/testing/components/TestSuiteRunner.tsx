import { TestSuite, TestRunOptions } from '../types/testing';
import { useTestRunner } from '../hooks/useTestRunner';
import { TestThreadMonitor } from './TestThreadMonitor';
import { TestResultsPanel } from './TestResultsPanel';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { Play, Pause, Square, RotateCcw, Settings } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface TestSuiteRunnerProps {
  suite: TestSuite;
  icon: LucideIcon;
  options?: TestRunOptions;
}

export function TestSuiteRunner({ suite, icon, options }: TestSuiteRunnerProps) {
  const { status, activeThreads, results, runSuite, pauseTests, resumeTests, stopTests, resetTests } =
    useTestRunner(options);

  const queuedCount = status === 'running' ? suite.testCases.length - results.length - activeThreads.length : 0;

  const handleRunTests = () => {
    runSuite(suite);
  };

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      idle: { label: 'Ready', variant: 'outline' },
      running: { label: 'Running', variant: 'default' },
      paused: { label: 'Paused', variant: 'secondary' },
      completed: { label: 'Completed', variant: 'default' },
      stopped: { label: 'Stopped', variant: 'destructive' },
    };

    const config = statusConfig[status] || statusConfig.idle;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DemoLayout
      title={suite.name}
      description={suite.description}
      icon={icon}
      condensed={false}
    >
      <div className="space-y-6">
        {/* Control Panel */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Badge variant="outline">
              {suite.testCases.length} tests
            </Badge>
          </div>

          <div className="flex gap-2 ml-auto">
            {status === 'idle' || status === 'completed' || status === 'stopped' ? (
              <Button onClick={handleRunTests} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Run Tests
              </Button>
            ) : null}

            {status === 'running' && (
              <Button onClick={pauseTests} variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}

            {status === 'paused' && (
              <Button onClick={resumeTests} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}

            {(status === 'running' || status === 'paused') && (
              <Button onClick={stopTests} variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}

            {(status === 'completed' || status === 'stopped') && results.length > 0 && (
              <Button onClick={resetTests} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}

            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thread Monitor */}
        {(status === 'running' || status === 'paused') && (
          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-canela text-lg mb-4">Thread Monitor</h3>
            <TestThreadMonitor
              activeThreads={activeThreads}
              maxConcurrency={options?.maxConcurrency || 3}
              queuedCount={queuedCount}
            />
          </div>
        )}

        {/* Results Panel */}
        <div className="p-4 bg-card border border-border rounded-lg">
          <h3 className="font-canela text-lg mb-4">Test Results</h3>
          <TestResultsPanel results={results} />
        </div>
      </div>
    </DemoLayout>
  );
}
