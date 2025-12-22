import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { AlertTriangle, Copy, ChevronDown, ChevronUp, Check, MessageCircle, } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmI18nCommon } from '@/components/common/i18n';
/**
 * FmErrorDisplay - A comprehensive error display component
 *
 * Features:
 * - Dual-state display: Developer/Admin vs Member/Unauthenticated
 * - Collapsible stacktrace with copy functionality
 * - Professional error messaging
 * - Actionable buttons (Reload, Go Back)
 *
 * Usage:
 * ```tsx
 * <FmErrorDisplay
 *   error={error}
 *   errorInfo={errorInfo}
 *   onReset={() => window.location.reload()}
 *   onGoBack={() => window.history.back()}
 * />
 * ```
 */
export const FmErrorDisplay = ({ error, errorInfo, onReset, onGoBack, }) => {
    const [isStackTraceExpanded, setIsStackTraceExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    // Keep t() for FmInfoCard title prop which requires a string
    const { t } = useTranslation('common');
    // In development mode, always show detailed errors
    // In production, we'd need to check user roles, but that requires AuthProvider
    // which may not be available in error boundary context
    // For now, just use dev mode as the indicator
    const isDeveloper = import.meta.env.DEV;
    const handleCopyStackTrace = async () => {
        const stackTrace = errorInfo?.componentStack || error.stack || 'No stack trace available';
        try {
            await navigator.clipboard.writeText(`${error.message}\n\n${stackTrace}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (err) {
            logger.error('Failed to copy stack trace:', { context: err });
        }
    };
    const handleReset = () => {
        if (onReset) {
            onReset();
        }
        else {
            window.location.reload();
        }
    };
    const handleGoBack = () => {
        if (onGoBack) {
            onGoBack();
        }
        else {
            window.history.back();
        }
    };
    return (_jsxs("div", { className: 'min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.35 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs("div", { className: 'max-w-2xl w-full text-center space-y-6 relative z-10', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx(FmI18nCommon, { i18nKey: 'errors.somethingWentWrong', as: 'h1', className: 'text-3xl font-canela text-foreground' }), isDeveloper ? (_jsx(FmI18nCommon, { i18nKey: 'errors.debugDetails', as: 'p', className: 'text-muted-foreground' })) : (_jsx(FmI18nCommon, { i18nKey: 'errors.apologize', as: 'p', className: 'text-muted-foreground' }))] }), isDeveloper ? (_jsxs(FmInfoCard, { icon: AlertTriangle, title: t('errors.errorDetails'), className: 'text-left', children: [_jsx("p", { className: 'text-sm font-mono text-destructive break-words', children: error.message }), (errorInfo?.componentStack || error.stack) && (_jsxs("div", { className: 'mt-4', children: [_jsxs(Button, { variant: 'ghost', size: 'sm', onClick: () => setIsStackTraceExpanded(!isStackTraceExpanded), className: 'w-full justify-between text-xs', children: [_jsx(FmI18nCommon, { i18nKey: 'errors.stackTrace' }), isStackTraceExpanded ? (_jsx(ChevronUp, { className: 'h-4 w-4' })) : (_jsx(ChevronDown, { className: 'h-4 w-4' }))] }), isStackTraceExpanded && (_jsxs("div", { className: 'mt-2 space-y-2', children: [_jsx("div", { className: 'p-3 bg-black/40 border border-destructive rounded-md max-h-64 overflow-auto', children: _jsx("pre", { className: 'text-xs font-mono text-destructive whitespace-pre-wrap break-words', children: errorInfo?.componentStack || error.stack }) }), _jsx(Button, { variant: 'outline', size: 'sm', onClick: handleCopyStackTrace, className: 'w-full text-xs border-destructive text-destructive hover:bg-destructive/10', children: copied ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: 'h-3 w-3 mr-2' }), _jsx(FmI18nCommon, { i18nKey: 'errors.copied' })] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: 'h-3 w-3 mr-2' }), _jsx(FmI18nCommon, { i18nKey: 'errors.copyStackTrace' })] })) })] }))] }))] })) : (_jsx(FmInfoCard, { icon: MessageCircle, title: t('errors.needHelp'), className: 'text-left', children: _jsxs("p", { className: 'text-sm text-muted-foreground', children: [_jsx(FmI18nCommon, { i18nKey: 'errors.contactUsMessage' }), ' ', _jsx("a", { href: 'https://www.instagram.com/force.majeure.events', target: '_blank', rel: 'noopener noreferrer', className: 'text-fm-gold hover:text-fm-gold/80 transition-colors underline', children: "@force.majeure.events" }), ' ', _jsx(FmI18nCommon, { i18nKey: 'errors.onInstagram' })] }) })), _jsxs("div", { className: 'flex flex-col sm:flex-row gap-3 justify-center', children: [_jsx(Button, { onClick: handleReset, variant: 'default', className: 'bg-fm-gold hover:bg-fm-gold/90 text-black hover:text-black', children: _jsx(FmI18nCommon, { i18nKey: 'errors.reloadPage' }) }), _jsx(Button, { onClick: handleGoBack, variant: 'outline', children: _jsx(FmI18nCommon, { i18nKey: 'errors.goBack' }) })] })] })] }));
};
