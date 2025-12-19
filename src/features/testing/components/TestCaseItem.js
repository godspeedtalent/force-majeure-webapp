import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { Badge } from '@/components/common/shadcn/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/shared';
export function TestCaseItem({ result }) {
    const getStatusIcon = () => {
        switch (result.status) {
            case 'passed':
                return _jsx(CheckCircle2, { className: 'h-5 w-5 text-green-500' });
            case 'failed':
                return _jsx(XCircle, { className: 'h-5 w-5 text-red-500' });
            case 'skipped':
                return _jsx(AlertCircle, { className: 'h-5 w-5 text-yellow-500' });
            default:
                return _jsx(Clock, { className: 'h-5 w-5 text-muted-foreground' });
        }
    };
    const getStatusBadge = () => {
        const variants = {
            passed: 'default',
            failed: 'destructive',
            skipped: 'secondary',
        };
        return (_jsx(Badge, { variant: variants[result.status] || 'outline', children: result.status }));
    };
    return (_jsxs("div", { className: cn('p-4 border rounded-lg transition-colors', result.status === 'passed' && 'border-green-500/30 bg-green-500/5', result.status === 'failed' && 'border-red-500/30 bg-red-500/5', result.status === 'skipped' && 'border-yellow-500/30 bg-yellow-500/5', !['passed', 'failed', 'skipped'].includes(result.status) &&
            'border-border bg-card'), children: [_jsxs("div", { className: 'flex items-start justify-between gap-4', children: [_jsxs("div", { className: 'flex items-start gap-3 flex-1 min-w-0', children: [getStatusIcon(), _jsxs("div", { className: 'flex-1 min-w-0', children: [_jsx("h4", { className: 'font-medium truncate', children: result.testName }), _jsxs("div", { className: 'flex items-center gap-3 mt-1 text-sm text-muted-foreground', children: [_jsxs("span", { children: [result.executionTime, "ms"] }), result.retryCount !== undefined && result.retryCount > 0 && (_jsxs("span", { children: ["(", result.retryCount, " retries)"] }))] })] })] }), getStatusBadge()] }), result.error && (_jsx("div", { className: 'mt-4', children: _jsx(FmCommonCollapsibleSection, { title: 'Error Details', defaultExpanded: false, children: _jsxs("div", { className: 'space-y-2', children: [_jsxs("div", { children: [_jsx("p", { className: 'text-sm font-medium text-red-500', children: "Error Message:" }), _jsx("p", { className: 'text-sm text-muted-foreground mt-1 p-3 bg-background rounded border border-border', children: result.error.message })] }), result.error.stack && (_jsxs("div", { children: [_jsx("p", { className: 'text-sm font-medium text-red-500', children: "Stack Trace:" }), _jsx("pre", { className: 'text-xs text-muted-foreground mt-1 p-3 bg-background rounded border border-border overflow-x-auto', children: result.error.stack })] }))] }) }) })), result.logs.length > 0 && (_jsx("div", { className: 'mt-4', children: _jsx(FmCommonCollapsibleSection, { title: 'Test Logs', defaultExpanded: false, children: _jsx("div", { className: 'space-y-1', children: result.logs.map((log, index) => (_jsxs("div", { className: cn('text-xs p-2 rounded font-mono', log.level === 'error' && 'text-red-500 bg-red-500/10', log.level === 'warn' && 'text-yellow-500 bg-yellow-500/10', log.level === 'info' && 'text-blue-500 bg-blue-500/10', log.level === 'debug' && 'text-muted-foreground bg-muted'), children: [_jsx("span", { className: 'opacity-70', children: new Date(log.timestamp).toLocaleTimeString() }), ' ', _jsxs("span", { className: 'font-semibold', children: ["[", log.level.toUpperCase(), "]"] }), ' ', log.message] }, index))) }) }) }))] }));
}
