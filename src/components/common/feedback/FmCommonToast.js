import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toast as sonnerToast } from 'sonner';
import { X } from 'lucide-react';
const getToastStyles = () => {
    return {
        className: 'group bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl hover:border-fm-gold/50 hover:shadow-[0_0_16px_rgba(207,173,118,0.3)] hover:scale-[1.02] transition-all duration-300 cursor-pointer',
        descriptionClassName: 'text-white/70',
    };
};
const createToast = (type, message, options) => {
    const { title, description, className: customClassName, ...rest } = options || {};
    const styles = getToastStyles();
    // Override styles for error toasts
    const errorStyles = type === 'error'
        ? 'bg-[hsl(348,60%,20%)]/90 backdrop-blur-md border-[hsl(348,60%,30%)] hover:border-[hsl(348,70%,40%)]'
        : '';
    const content = (_jsxs("div", { className: 'flex items-start justify-between gap-3 w-full', onClick: e => {
            // Find the toast element and trigger close
            const toastEl = e.target.closest('[data-sonner-toast]');
            if (toastEl) {
                toastEl.classList.add('opacity-0', 'scale-95', 'transition-all', 'duration-300');
                setTimeout(() => {
                    sonnerToast.dismiss(toastEl.getAttribute('data-toast-id') || undefined);
                }, 300);
            }
        }, children: [_jsxs("div", { className: 'flex-1', children: [title && _jsx("div", { className: 'font-canela font-semibold mb-1', children: title }), _jsx("div", { className: 'text-sm', children: description || message })] }), _jsx("button", { onClick: e => {
                    e.stopPropagation();
                    const toastEl = e.target.closest('[data-sonner-toast]');
                    if (toastEl) {
                        toastEl.classList.add('opacity-0', 'scale-95', 'transition-all', 'duration-300');
                        setTimeout(() => {
                            sonnerToast.dismiss(toastEl.getAttribute('data-toast-id') || undefined);
                        }, 300);
                    }
                }, className: 'text-white/50 hover:text-white transition-colors', "aria-label": 'Close', children: _jsx(X, { className: 'h-4 w-4' }) })] }));
    // Map type to sonnerToast method
    if (type === 'message') {
        return sonnerToast(content, {
            className: `${styles.className} ${errorStyles} ${customClassName || ''}`,
            descriptionClassName: styles.descriptionClassName,
            ...rest,
        });
    }
    return sonnerToast[type](content, {
        className: `${styles.className} ${errorStyles} ${customClassName || ''}`,
        descriptionClassName: styles.descriptionClassName,
        ...rest,
    });
};
export const toast = {
    success: (message, options) => createToast('success', message, options),
    error: (message, options) => createToast('error', message, options),
    info: (message, options) => createToast('info', message, options),
    message: (message, options) => createToast('message', message, options),
};
