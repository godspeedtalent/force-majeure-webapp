import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTestRunner } from '../hooks/useTestRunner';
import { TestThreadMonitor } from './TestThreadMonitor';
import { TestResultsPanel } from './TestResultsPanel';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { Button } from '@/components/common/shadcn/button';
import { Badge } from '@/components/common/shadcn/badge';
import { Play, Pause, Square, RotateCcw, Keyboard, XCircle, } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared';
export function TestSuiteRunner({ suite, icon, options, }) {
    const { t } = useTranslation('common');
    const { status, activeThreads, results, error, runSuite, pauseTests, resumeTests, stopTests, resetTests, } = useTestRunner(options);
    const { toast } = useToast();
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const queuedCount = status === 'running'
        ? suite.testCases.length - results.length - activeThreads.length
        : 0;
    const handleRunTests = () => {
        runSuite(suite);
    };
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle shortcuts when not typing in an input
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement) {
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
                    }
                    else if (status === 'paused') {
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
                    if ((status === 'idle' ||
                        status === 'completed' ||
                        status === 'stopped') &&
                        e.ctrlKey) {
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
        const statusConfig = {
            idle: { label: t('testSuiteRunner.status.ready'), variant: 'outline' },
            running: { label: t('testSuiteRunner.status.running'), variant: 'default' },
            paused: { label: t('testSuiteRunner.status.paused'), variant: 'secondary' },
            completed: { label: t('testSuiteRunner.status.completed'), variant: 'default' },
            stopped: { label: t('testSuiteRunner.status.stopped'), variant: 'destructive' },
        };
        const config = statusConfig[status] || statusConfig.idle;
        return _jsx(Badge, { variant: config.variant, children: config.label });
    };
    return (_jsx(DemoLayout, { title: suite.name, description: suite.description, icon: icon, condensed: false, children: _jsxs("div", { className: 'space-y-6', children: [(status === 'idle' || status === 'stopped') && (_jsxs("div", { className: 'p-6 bg-card border border-border rounded-lg', children: [_jsx("h3", { className: 'font-canela text-xl mb-4 flex items-center gap-2', children: t('testSuiteRunner.suiteOverview') }), _jsx("div", { className: 'space-y-4', children: suite.testCases.map((testCase, index) => (_jsx("div", { className: 'p-4 bg-muted/50 rounded-lg border border-border', children: _jsxs("div", { className: 'flex items-start gap-3 mb-2', children: [_jsxs("span", { className: 'font-semibold text-fm-gold', children: ["#", index + 1] }), _jsxs("div", { className: 'flex-1', children: [_jsx("h4", { className: 'font-semibold mb-1', children: testCase.name }), testCase.category && (_jsx(Badge, { variant: 'outline', className: 'mb-2', children: testCase.category })), testCase.description && (_jsx("div", { className: 'text-sm text-muted-foreground whitespace-pre-line mt-2', children: testCase.description }))] })] }) }, testCase.id))) }), _jsx("div", { className: 'mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg', children: _jsx("p", { className: 'text-sm text-blue-300', dangerouslySetInnerHTML: { __html: t('testSuiteRunner.consoleTip') } }) })] })), _jsxs("div", { className: 'flex flex-wrap items-center gap-4 p-4 bg-card border border-border rounded-lg', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [getStatusBadge(), _jsx(Badge, { variant: 'outline', children: t('testSuiteRunner.testsCount', { count: suite.testCases.length }) })] }), _jsxs("div", { className: 'flex gap-2 ml-auto', children: [status === 'idle' ||
                                    status === 'completed' ||
                                    status === 'stopped' ? (_jsxs(Button, { onClick: handleRunTests, size: 'sm', children: [_jsx(Play, { className: 'h-4 w-4 mr-2' }), t('testSuiteRunner.runTests')] })) : null, status === 'running' && (_jsxs(Button, { onClick: pauseTests, variant: 'outline', size: 'sm', children: [_jsx(Pause, { className: 'h-4 w-4 mr-2' }), t('testSuiteRunner.pause')] })), status === 'paused' && (_jsxs(Button, { onClick: resumeTests, size: 'sm', children: [_jsx(Play, { className: 'h-4 w-4 mr-2' }), t('testSuiteRunner.resume')] })), (status === 'running' || status === 'paused') && (_jsxs(Button, { onClick: stopTests, variant: 'destructive', size: 'sm', children: [_jsx(Square, { className: 'h-4 w-4 mr-2' }), t('testSuiteRunner.stop')] })), (status === 'completed' || status === 'stopped') &&
                                    results.length > 0 && (_jsxs(Button, { onClick: resetTests, variant: 'outline', size: 'sm', children: [_jsx(RotateCcw, { className: 'h-4 w-4 mr-2' }), t('testSuiteRunner.reset')] })), _jsx(Button, { variant: 'ghost', size: 'sm', onClick: () => setShowKeyboardHelp(!showKeyboardHelp), title: t('testSuiteRunner.keyboardShortcuts'), children: _jsx(Keyboard, { className: 'h-4 w-4' }) })] })] }), error && (_jsx("div", { className: 'p-4 bg-red-500/10 border border-red-500/30 rounded-lg', children: _jsxs("div", { className: 'flex items-start gap-3', children: [_jsx(XCircle, { className: 'h-5 w-5 text-red-500 mt-0.5 flex-shrink-0' }), _jsxs("div", { className: 'flex-1 min-w-0', children: [_jsx("h4", { className: 'font-semibold text-red-500 mb-2', children: t('testSuiteRunner.testSuiteError') }), _jsx("p", { className: 'text-sm text-red-300 whitespace-pre-wrap break-words', children: error }), _jsx("p", { className: 'text-xs text-red-400 mt-3', children: t('testSuiteRunner.checkConsoleForDetails') })] })] }) })), showKeyboardHelp && (_jsxs("div", { className: 'mt-4 p-4 bg-muted/50 rounded-lg border border-border', children: [_jsxs("h4", { className: 'font-semibold mb-3 flex items-center gap-2', children: [_jsx(Keyboard, { className: 'h-4 w-4' }), t('testSuiteRunner.keyboardShortcutsTitle')] }), _jsxs("div", { className: 'grid grid-cols-2 gap-2 text-sm', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("kbd", { className: 'px-2 py-1 bg-background border rounded text-xs', children: "Space" }), _jsx("span", { className: 'text-muted-foreground', children: t('testSuiteRunner.pauseResumeTests') })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("kbd", { className: 'px-2 py-1 bg-background border rounded text-xs', children: "Esc" }), _jsx("span", { className: 'text-muted-foreground', children: t('testSuiteRunner.stopTests') })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("kbd", { className: 'px-2 py-1 bg-background border rounded text-xs', children: "Ctrl+R" }), _jsx("span", { className: 'text-muted-foreground', children: t('testSuiteRunner.runTestsShortcut') })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("kbd", { className: 'px-2 py-1 bg-background border rounded text-xs', children: "?" }), _jsx("span", { className: 'text-muted-foreground', children: t('testSuiteRunner.toggleHelp') })] })] })] })), (status === 'running' || status === 'paused') && (_jsxs("div", { className: 'space-y-2', children: [_jsxs("div", { className: 'flex items-center justify-between text-sm', children: [_jsx("span", { className: 'text-muted-foreground', children: t('testSuiteRunner.progress', { completed: results.length, total: suite.testCases.length }) }), _jsxs("span", { className: 'text-muted-foreground', children: [Math.round((results.length / suite.testCases.length) * 100), "%"] })] }), _jsx("div", { className: 'h-2 bg-muted rounded-full overflow-hidden', children: _jsx("div", { className: 'h-full bg-fm-gold transition-all duration-300', style: {
                                    width: `${(results.length / suite.testCases.length) * 100}%`,
                                } }) })] })), (status === 'running' || status === 'paused') && (_jsxs("div", { className: 'p-4 bg-card border border-border rounded-lg', children: [_jsx("h3", { className: 'font-canela text-lg mb-4', children: t('testSuiteRunner.threadMonitor') }), _jsx(TestThreadMonitor, { activeThreads: activeThreads, maxConcurrency: options?.maxConcurrency || 3, queuedCount: queuedCount })] })), _jsxs("div", { className: 'p-4 bg-card border border-border rounded-lg', children: [_jsx("h3", { className: 'font-canela text-lg mb-4', children: t('testSuiteRunner.testResults') }), _jsx(TestResultsPanel, { results: results })] })] }) }));
}
