import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, Copy, Check, FileText } from 'lucide-react';
import { logger } from '@/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared';
import { FmErrorOverlay } from './FmErrorOverlay';
/**
 * FmErrorToast Component
 *
 * Enhanced error toast with developer-friendly features:
 * - Copy button for developers/admins (copies error details + stack trace)
 * - Generic message for regular users
 * - Dark crimson styling (border, text, icon)
 *
 * Usage:
 * ```tsx
 * import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
 *
 * showErrorToast({
 *   title: 'Upload Failed',
 *   description: 'Image failed to upload',
 *   error: myError,
 *   isDeveloper: true
 * });
 * ```
 */
export const FmErrorToast = ({ title, description, error, isDeveloper = false, context, endpoint, method, }) => {
    const [copied, setCopied] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const handleCopy = async () => {
        const errorDetails = [
            `Title: ${title}`,
            description ? `Description: ${description}` : null,
            error ? `Error: ${error.message}` : null,
            error?.stack ? `\nStack Trace:\n${error.stack}` : null,
        ]
            .filter(Boolean)
            .join('\n');
        try {
            await navigator.clipboard.writeText(errorDetails);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (err) {
            logger.error('Failed to copy to clipboard:', { context: err });
        }
    };
    // For non-developers, show generic message
    const displayDescription = isDeveloper
        ? description
        : 'An error occurred. Please try again.';
    return (_jsxs("div", { className: 'flex items-start gap-3', children: [_jsx(AlertCircle, { className: 'h-5 w-5 text-fm-crimson flex-shrink-0 mt-0.5' }), _jsxs("div", { className: 'flex-1 min-w-0 max-w-[400px]', children: [_jsx("div", { className: 'font-semibold text-fm-crimson', children: title }), displayDescription && (_jsx("div", { className: 'text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words', children: displayDescription })), isDeveloper && error && (_jsx("div", { className: 'text-xs text-muted-foreground/70 mt-1 font-mono break-words', children: error.message }))] }), isDeveloper && (_jsxs("div", { className: 'flex items-center gap-1', children: [_jsx("button", { onClick: () => setShowOverlay(true), className: 'flex-shrink-0 p-1.5 rounded hover:bg-white/10 transition-colors', title: 'View details', children: _jsx(FileText, { className: 'h-4 w-4 text-muted-foreground' }) }), _jsx("button", { onClick: handleCopy, className: cn('flex-shrink-0 p-1.5 rounded hover:bg-white/10 transition-colors', copied && 'bg-white/10'), title: 'Copy error details', children: copied ? (_jsx(Check, { className: 'h-4 w-4 text-fm-gold' })) : (_jsx(Copy, { className: 'h-4 w-4 text-muted-foreground' })) })] })), error && (_jsx(FmErrorOverlay, { error: error, title: title, description: description, context: context, endpoint: endpoint, method: method, isOpen: showOverlay, onClose: () => setShowOverlay(false) }))] }));
};
/**
 * Helper function to show error toast
 */
export const showErrorToast = (props) => {
    toast.custom(() => (_jsx("div", { className: cn('bg-card border-2 border-fm-crimson rounded-lg shadow-lg p-4 max-w-md', 'animate-in slide-in-from-top-5 duration-300'), children: _jsx(FmErrorToast, { ...props }) })), {
        duration: props.isDeveloper ? 8000 : 4000, // Longer duration for developers to copy
    });
};
