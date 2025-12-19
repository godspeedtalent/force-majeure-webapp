import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { Clock } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
export const FmTimerToast = ({ duration, title, message, onExpire, onAction, actionLabel, id = 'fm-timer-toast', }) => {
    const { t } = useTranslation('common');
    const resolvedTitle = title ?? t('timerToast.ticketsReserved');
    const resolvedActionLabel = actionLabel ?? t('timerToast.extendTime');
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isExecuting, setIsExecuting] = useState(false);
    const intervalRef = useRef(null);
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (intervalRef.current)
                        clearInterval(intervalRef.current);
                    onExpire();
                    sonnerToast.dismiss(id);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
        };
    }, [duration, onExpire, id]);
    useEffect(() => {
        if (timeLeft <= 0)
            return;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const progress = ((duration - timeLeft) / duration) * 100;
        // Calculate progress bar color and clock icon color
        let barColor = 'bg-fm-gold';
        let iconColor = 'text-fm-gold';
        if (progress > 80) {
            barColor =
                progress > 95
                    ? 'bg-[hsl(348,60%,50%)]'
                    : 'bg-gradient-to-r from-white to-[hsl(348,60%,50%)]';
            iconColor = progress > 95 ? 'text-[hsl(348,60%,50%)]' : 'text-white';
        }
        else if (progress > 0) {
            barColor =
                progress < 20 ? 'bg-fm-gold' : 'bg-gradient-to-r from-fm-gold to-white';
            iconColor = progress < 20 ? 'text-fm-gold' : 'text-white';
        }
        const content = (_jsxs("div", { className: 'relative w-full', children: [_jsxs("div", { className: 'flex items-center gap-3 pb-3', children: [_jsx(Clock, { className: `h-4 w-4 flex-shrink-0 transition-colors duration-1000 ${iconColor}` }), _jsxs("div", { className: 'flex-1', children: [_jsx("div", { className: 'font-canela font-semibold', children: resolvedTitle }), _jsx("div", { className: 'text-xs text-muted-foreground', children: message || t('timerToast.remaining', { time: timeString }) })] }), onAction && (_jsx("button", { onClick: async (e) => {
                                e.stopPropagation();
                                setIsExecuting(true);
                                try {
                                    await onAction();
                                    sonnerToast.dismiss(id);
                                }
                                catch (error) {
                                    logger.error('Action failed:', { error: error instanceof Error ? error.message : 'Unknown' });
                                }
                                finally {
                                    setIsExecuting(false);
                                }
                            }, disabled: isExecuting, className: 'text-xs text-fm-gold hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1', children: isExecuting ? (_jsxs(_Fragment, { children: [_jsx("div", { className: 'h-3 w-3 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' }), _jsx("span", { children: t('labels.loading') })] })) : (resolvedActionLabel) }))] }), _jsx("div", { className: 'absolute bottom-0 left-0 right-0 h-[2px] bg-border/30', children: _jsx("div", { className: `h-full transition-all duration-1000 ease-linear ${barColor}`, style: { width: `${progress}%` } }) })] }));
        sonnerToast(content, {
            id,
            duration: Infinity,
            position: 'bottom-left',
            dismissible: false,
            className: 'bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl',
            style: {
                paddingBottom: '0.75rem',
            },
        });
    }, [timeLeft, duration, title, message, onAction, actionLabel, id]);
    return null;
};
