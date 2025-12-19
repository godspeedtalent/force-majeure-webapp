import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { X, Copy, Check, AlertTriangle } from 'lucide-react';
import { logger } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
import { FmI18nCommon } from '@/components/common/i18n';
/**
 * FmErrorOverlay - Modal overlay for displaying detailed error information
 *
 * Features:
 * - Full-screen modal overlay
 * - Stack trace display (always expanded)
 * - Copy to clipboard functionality
 * - Error context and endpoint information
 *
 * Usage:
 * ```tsx
 * <FmErrorOverlay
 *   error={error}
 *   title="Sign in failed"
 *   description="Unable to sign in to your account"
 *   context="User authentication"
 *   endpoint="/auth/signin"
 *   method="POST"
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
export const FmErrorOverlay = ({ error, title, description, context, endpoint, method, isOpen, onClose, }) => {
    const [copied, setCopied] = useState(false);
    const handleCopyStackTrace = async () => {
        const details = [
            `Title: ${title}`,
            description && `Description: ${description}`,
            `Error: ${error.message}`,
            context && `Context: ${context}`,
            endpoint && `Endpoint: ${endpoint}`,
            method && `Method: ${method}`,
            '',
            'Stack Trace:',
            error.stack || 'No stack trace available',
        ]
            .filter(Boolean)
            .join('\n');
        try {
            await navigator.clipboard.writeText(details);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (err) {
            logger.error('Failed to copy error details:', { context: err });
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: cn('fixed inset-0 z-[200] flex items-center justify-center', 'bg-black/90 backdrop-blur-md', 'animate-in fade-in duration-200'), onClick: onClose, children: _jsxs("div", { className: cn('relative w-full max-w-4xl max-h-[90vh]', 'bg-black/95 backdrop-blur-xl', 'border-2 border-fm-danger', 'shadow-2xl shadow-fm-danger/20', 'flex flex-col', 'animate-in zoom-in-95 duration-200'), onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: 'flex items-start justify-between p-6 border-b border-fm-danger/30', children: [_jsxs("div", { className: 'flex items-start gap-4 flex-1', children: [_jsx(AlertTriangle, { className: 'h-6 w-6 text-fm-danger flex-shrink-0 mt-1' }), _jsxs("div", { className: 'flex-1 space-y-1', children: [_jsx("h2", { className: 'text-2xl font-canela text-fm-danger', children: title }), description && (_jsx("p", { className: 'text-sm text-muted-foreground', children: description }))] })] }), _jsx(Button, { variant: 'ghost', size: 'icon', onClick: onClose, className: 'h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0', children: _jsx(X, { className: 'h-4 w-4' }) })] }), _jsxs("div", { className: 'flex-1 overflow-y-auto p-6 space-y-6', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx(FmI18nCommon, { i18nKey: 'errorOverlay.errorMessage', as: 'h3', className: 'text-sm font-semibold text-fm-gold uppercase tracking-wide' }), _jsx("div", { className: 'p-4 bg-fm-danger/10 border border-fm-danger/30 rounded-none', children: _jsx("p", { className: 'text-sm font-mono text-fm-danger break-words', children: error.message }) })] }), (context || endpoint || method) && (_jsxs("div", { className: 'space-y-2', children: [_jsx(FmI18nCommon, { i18nKey: 'errorOverlay.context', as: 'h3', className: 'text-sm font-semibold text-fm-gold uppercase tracking-wide' }), _jsxs("div", { className: 'space-y-2', children: [context && (_jsxs("div", { className: 'flex gap-2', children: [_jsx(FmI18nCommon, { i18nKey: 'errorOverlay.contextLabel', as: 'span', className: 'text-sm text-muted-foreground w-24' }), _jsx("span", { className: 'text-sm text-foreground', children: context })] })), endpoint && (_jsxs("div", { className: 'flex gap-2', children: [_jsx(FmI18nCommon, { i18nKey: 'errorOverlay.endpoint', as: 'span', className: 'text-sm text-muted-foreground w-24' }), _jsx("span", { className: 'text-sm text-foreground font-mono', children: endpoint })] })), method && (_jsxs("div", { className: 'flex gap-2', children: [_jsx(FmI18nCommon, { i18nKey: 'errorOverlay.method', as: 'span', className: 'text-sm text-muted-foreground w-24' }), _jsx("span", { className: 'text-sm text-foreground font-mono', children: method })] }))] })] })), error.stack && (_jsxs("div", { className: 'space-y-2', children: [_jsx(FmI18nCommon, { i18nKey: 'errors.stackTrace', as: 'h3', className: 'text-sm font-semibold text-fm-gold uppercase tracking-wide' }), _jsx("div", { className: 'p-4 bg-black/60 border border-white/20 rounded-none overflow-auto max-h-96', children: _jsx("pre", { className: 'text-xs font-mono text-fm-danger whitespace-pre-wrap break-words', children: error.stack }) })] }))] }), _jsxs("div", { className: 'p-6 border-t border-white/10 flex justify-end gap-3', children: [_jsx(Button, { variant: 'outline', onClick: handleCopyStackTrace, className: 'border-fm-gold text-fm-gold hover:bg-fm-gold/10', children: copied ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: 'h-4 w-4 mr-2' }), _jsx(FmI18nCommon, { i18nKey: 'errors.copied' })] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: 'h-4 w-4 mr-2' }), _jsx(FmI18nCommon, { i18nKey: 'errorOverlay.copyDetails' })] })) }), _jsx(Button, { variant: 'default', onClick: onClose, className: 'bg-fm-gold hover:bg-fm-gold/90 text-black', children: _jsx(FmI18nCommon, { i18nKey: 'dialogs.close' }) })] })] }) }));
};
