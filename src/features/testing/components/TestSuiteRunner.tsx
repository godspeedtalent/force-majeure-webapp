import { TestSuite, TestRunOptions } from '../types/testing';
import { useTestRunner } from '../hooks/useTestRunner';
import { TestThreadMonitor } from './TestThreadMonitor';
import { TestResultsPanel } from './TestResultsPanel';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { Button } from '@/components/common/shadcn/button';
import { Badge } from '@/components/common/shadcn/badge';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Keyboard,
  XCircle,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared';


interface TestSuiteRunnerProps {
  suite: TestSuite;
  icon: LucideIcon;
  options?: TestRunOptions;
}

export function TestSuiteRunner({
  suite,
  icon,
  options,
}: TestSuiteRunnerProps) {
  const { t } = useTranslation('common');
  const {
    status,
    activeThreads,
    results,
    error,
    runSuite,
    pauseTests,
    resumeTests,
    stopTests,
    resetTests,
  } = useTestRunner(options);
  const { toast } = useToast();
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const queuedCount =
    status === 'running'
      ? suite.testCases.length - results.length - activeThreads.length
      : 0;

  const handleRunTests = () => {
    runSuite(suite);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (status === 'running') {
            pauseTests();
            toast({
              title: t('testSuiteRunner.toasts.testsPaused'),
              description: t('testSuiteRunner.toasts.pressSpaceToResume'),
            });
          } else if (status === 'paused') {
            resumeTests();
            toast({
              title: t('testSuiteRunner.toasts.testsResumed'),
              description: t('testSuiteRunner.toasts.pressSpaceToPause'),
            });
          }
          break;
        case 'Escape':
          if (status === 'running' || status === 'paused') {
            stopTests();
            toast({
              title: t('testSuiteRunner.toasts.testsStopped'),
              description: t('testSuiteRunner.toasts.executionStopped'),
              variant: 'destructive',
            });
          }
          break;
        case 'r':
          if (
            (status === 'idle' ||
              status === 'completed' ||
              status === 'stopped') &&
            e.ctrlKey
          ) {
            e.preventDefault();
            handleRunTests();
            toast({
              title: t('testSuiteRunner.toasts.testsStarted'),
              description: t('testSuiteRunner.toasts.runningTests', { count: suite.testCases.length }),
            });
          }
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardHelp(!showKeyboardHelp);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    status,
    pauseTests,
    resumeTests,
    stopTests,
    showKeyboardHelp,
    toast,
    suite.testCases.length,
  ]);

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      idle: { label: t('testSuiteRunner.status.ready'), variant: 'outline' },
      running: { label: t('testSuiteRunner.status.running'), variant: 'default' },
      paused: { label: t('testSuiteRunner.status.paused'), variant: 'secondary' },
      completed: { label: t('testSuiteRunner.status.completed'), variant: 'default' },
      stopped: { label: t('testSuiteRunner.status.stopped'), variant: 'destructive' },
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
      <div className='space-y-6'>
        {/* Test Case Overview - Shows BEFORE tests run */}
        {(status === 'idle' || status === 'stopped') && (
          <div className='p-6 bg-card border border-border rounded-lg'>
            <h3 className='font-canela text-xl mb-4 flex items-center gap-2'>
              {t('testSuiteRunner.suiteOverview')}
            </h3>
            <div className='space-y-4'>
              {suite.testCases.map((testCase, index) => (
                <div
                  key={testCase.id}
                  className='p-4 bg-muted/50 rounded-lg border border-border'
                >
                  <div className='flex items-start gap-3 mb-2'>
                    <span className='font-semibold text-fm-gold'>
                      #{index + 1}
                    </span>
                    <div className='flex-1'>
                      <h4 className='font-semibold mb-1'>{testCase.name}</h4>
                      {testCase.category && (
                        <Badge variant='outline' className='mb-2'>
                          {testCase.category}
                        </Badge>
                      )}
                      {testCase.description && (
                        <div className='text-sm text-muted-foreground whitespace-pre-line mt-2'>
                          {testCase.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className='mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg'>
              <p className='text-sm text-blue-300' dangerouslySetInnerHTML={{ __html: t('testSuiteRunner.consoleTip') }} />
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className='flex flex-wrap items-center gap-4 p-4 bg-card border border-border rounded-lg'>
          <div className='flex items-center gap-2'>
            {getStatusBadge()}
            <Badge variant='outline'>{t('testSuiteRunner.testsCount', { count: suite.testCases.length })}</Badge>
          </div>

          <div className='flex gap-2 ml-auto'>
            {status === 'idle' ||
            status === 'completed' ||
            status === 'stopped' ? (
              <Button onClick={handleRunTests} size='sm'>
                <Play className='h-4 w-4 mr-2' />
                {t('testSuiteRunner.runTests')}
              </Button>
            ) : null}

            {status === 'running' && (
              <Button onClick={pauseTests} variant='outline' size='sm'>
                <Pause className='h-4 w-4 mr-2' />
                {t('testSuiteRunner.pause')}
              </Button>
            )}

            {status === 'paused' && (
              <Button onClick={resumeTests} size='sm'>
                <Play className='h-4 w-4 mr-2' />
                {t('testSuiteRunner.resume')}
              </Button>
            )}

            {(status === 'running' || status === 'paused') && (
              <Button onClick={stopTests} variant='destructive' size='sm'>
                <Square className='h-4 w-4 mr-2' />
                {t('testSuiteRunner.stop')}
              </Button>
            )}

            {(status === 'completed' || status === 'stopped') &&
              results.length > 0 && (
                <Button onClick={resetTests} variant='outline' size='sm'>
                  <RotateCcw className='h-4 w-4 mr-2' />
                  {t('testSuiteRunner.reset')}
                </Button>
              )}

            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              title={t('testSuiteRunner.keyboardShortcuts')}
            >
              <Keyboard className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Suite-level Error Display */}
        {error && (
          <div className='p-4 bg-red-500/10 border border-red-500/30 rounded-lg'>
            <div className='flex items-start gap-3'>
              <XCircle className='h-5 w-5 text-red-500 mt-0.5 flex-shrink-0' />
              <div className='flex-1 min-w-0'>
                <h4 className='font-semibold text-red-500 mb-2'>
                  {t('testSuiteRunner.testSuiteError')}
                </h4>
                <p className='text-sm text-red-300 whitespace-pre-wrap break-words'>
                  {error}
                </p>
                <p className='text-xs text-red-400 mt-3'>
                  {t('testSuiteRunner.checkConsoleForDetails')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Help Panel */}
        {showKeyboardHelp && (
          <div className='mt-4 p-4 bg-muted/50 rounded-lg border border-border'>
            <h4 className='font-semibold mb-3 flex items-center gap-2'>
              <Keyboard className='h-4 w-4' />
              {t('testSuiteRunner.keyboardShortcutsTitle')}
            </h4>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              <div className='flex items-center gap-2'>
                <kbd className='px-2 py-1 bg-background border rounded text-xs'>
                  Space
                </kbd>
                <span className='text-muted-foreground'>
                  {t('testSuiteRunner.pauseResumeTests')}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <kbd className='px-2 py-1 bg-background border rounded text-xs'>
                  Esc
                </kbd>
                <span className='text-muted-foreground'>{t('testSuiteRunner.stopTests')}</span>
              </div>
              <div className='flex items-center gap-2'>
                <kbd className='px-2 py-1 bg-background border rounded text-xs'>
                  Ctrl+R
                </kbd>
                <span className='text-muted-foreground'>{t('testSuiteRunner.runTestsShortcut')}</span>
              </div>
              <div className='flex items-center gap-2'>
                <kbd className='px-2 py-1 bg-background border rounded text-xs'>
                  ?
                </kbd>
                <span className='text-muted-foreground'>{t('testSuiteRunner.toggleHelp')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {(status === 'running' || status === 'paused') && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>
                {t('testSuiteRunner.progress', { completed: results.length, total: suite.testCases.length })}
              </span>
              <span className='text-muted-foreground'>
                {Math.round((results.length / suite.testCases.length) * 100)}%
              </span>
            </div>
            <div className='h-2 bg-muted rounded-full overflow-hidden'>
              <div
                className='h-full bg-fm-gold transition-all duration-300'
                style={{
                  width: `${(results.length / suite.testCases.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Thread Monitor */}
        {(status === 'running' || status === 'paused') && (
          <div className='p-4 bg-card border border-border rounded-lg'>
            <h3 className='font-canela text-lg mb-4'>{t('testSuiteRunner.threadMonitor')}</h3>
            <TestThreadMonitor
              activeThreads={activeThreads}
              maxConcurrency={options?.maxConcurrency || 3}
              queuedCount={queuedCount}
            />
          </div>
        )}

        {/* Results Panel */}
        <div className='p-4 bg-card border border-border rounded-lg'>
          <h3 className='font-canela text-lg mb-4'>{t('testSuiteRunner.testResults')}</h3>
          <TestResultsPanel results={results} />
        </div>
      </div>
    </DemoLayout>
  );
}
