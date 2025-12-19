import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Timer, Users, Clock, Info, RotateCcw } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmI18nCommon } from '@/components/common/i18n';
import { Card } from '@/components/common/shadcn/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/common/shadcn/tooltip';
import { toast } from 'sonner';
import { logger } from '@/shared';
import { DEFAULT_QUEUE_CONFIG, fetchQueueConfiguration, upsertQueueConfiguration, deleteQueueConfiguration, } from '@/services/queueConfigurationService';
import { useCheckoutTimerDefault } from '@/hooks/useAppSettings';
export const EventQueueConfigForm = ({ eventId }) => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const [config, setConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    // Local form state
    const [enableQueue, setEnableQueue] = useState(true);
    const [maxConcurrentUsers, setMaxConcurrentUsers] = useState('50');
    const [checkoutTimeoutMinutes, setCheckoutTimeoutMinutes] = useState('');
    const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');
    // Get global default for display
    const { data: globalDefaultMinutes } = useCheckoutTimerDefault();
    // Fetch existing configuration
    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true);
            try {
                const data = await fetchQueueConfiguration(eventId);
                setConfig(data);
                // Populate form with existing values
                setEnableQueue(data.enable_queue);
                setMaxConcurrentUsers(data.max_concurrent_users.toString());
                // Only set if it's not the default (i.e., there's a custom config)
                if (data.id) {
                    setCheckoutTimeoutMinutes(data.checkout_timeout_minutes.toString());
                }
                else {
                    // No custom config - leave empty to use global default
                    setCheckoutTimeoutMinutes('');
                }
                setSessionTimeoutMinutes(data.session_timeout_minutes.toString());
            }
            catch (error) {
                logger.error('Failed to load queue configuration', {
                    error: error instanceof Error ? error.message : 'Unknown',
                    eventId,
                });
                toast.error(tToast('queue.loadFailed'));
            }
            finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, [eventId]);
    const hasCustomConfig = config?.id !== '';
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const checkoutMinutes = checkoutTimeoutMinutes
                ? parseInt(checkoutTimeoutMinutes, 10)
                : undefined;
            await upsertQueueConfiguration({
                event_id: eventId,
                enable_queue: enableQueue,
                max_concurrent_users: parseInt(maxConcurrentUsers, 10) || DEFAULT_QUEUE_CONFIG.max_concurrent_users,
                checkout_timeout_minutes: checkoutMinutes || DEFAULT_QUEUE_CONFIG.checkout_timeout_minutes,
                session_timeout_minutes: parseInt(sessionTimeoutMinutes, 10) || DEFAULT_QUEUE_CONFIG.session_timeout_minutes,
            });
            toast.success(tToast('queue.saved'));
            // Reload config to get the new values
            const updatedConfig = await fetchQueueConfiguration(eventId);
            setConfig(updatedConfig);
        }
        catch (error) {
            logger.error('Failed to save queue configuration', {
                error: error instanceof Error ? error.message : 'Unknown',
                eventId,
            });
            toast.error(tToast('queue.saveFailed'));
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleResetToDefaults = async () => {
        if (!hasCustomConfig) {
            toast.info(tToast('queue.alreadyDefault'));
            return;
        }
        const confirmed = window.confirm(t('queue.resetConfirm'));
        if (!confirmed)
            return;
        setIsSaving(true);
        try {
            await deleteQueueConfiguration(eventId);
            toast.success(tToast('queue.resetSuccess'));
            // Reload to get defaults
            const defaultConfig = await fetchQueueConfiguration(eventId);
            setConfig(defaultConfig);
            setEnableQueue(defaultConfig.enable_queue);
            setMaxConcurrentUsers(defaultConfig.max_concurrent_users.toString());
            setCheckoutTimeoutMinutes(''); // Clear to show placeholder
            setSessionTimeoutMinutes(defaultConfig.session_timeout_minutes.toString());
        }
        catch (error) {
            logger.error('Failed to reset queue configuration', {
                error: error instanceof Error ? error.message : 'Unknown',
                eventId,
            });
            toast.error(tToast('queue.resetFailed'));
        }
        finally {
            setIsSaving(false);
        }
    };
    if (isLoading) {
        return (_jsx(Card, { className: 'p-6', children: _jsx(FmI18nCommon, { i18nKey: 'queue.loading', as: 'div', className: 'text-muted-foreground text-sm' }) }));
    }
    return (_jsxs(Card, { className: 'p-6 space-y-6', children: [_jsxs("div", { className: 'flex items-start justify-between', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Timer, { className: 'h-5 w-5 text-fm-gold' }), _jsxs("div", { children: [_jsx(FmI18nCommon, { i18nKey: 'queue.title', as: 'h3', className: 'text-lg font-canela font-semibold' }), _jsx(FmI18nCommon, { i18nKey: 'queue.description', as: 'p', className: 'text-sm text-muted-foreground' })] })] }), hasCustomConfig && (_jsx(FmCommonButton, { variant: 'secondary', size: 'sm', icon: RotateCcw, onClick: handleResetToDefaults, disabled: isSaving, children: t('queue.resetToDefaults') }))] }), _jsxs("div", { className: 'flex items-center gap-2 text-xs', children: [_jsxs("span", { className: 'text-muted-foreground', children: [t('queue.configurationLabel'), ":"] }), _jsx("span", { className: `px-2 py-0.5 rounded-none ${hasCustomConfig
                            ? 'bg-fm-gold/20 text-fm-gold'
                            : 'bg-muted text-muted-foreground'}`, children: hasCustomConfig ? t('queue.customConfig') : t('queue.usingDefaults') })] }), _jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { className: 'flex items-center justify-between p-4 bg-muted/20 rounded-none border border-border', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [_jsx(Users, { className: 'h-5 w-5 text-muted-foreground' }), _jsxs("div", { children: [_jsx("span", { className: 'font-medium', children: t('queue.enableQueueSystem') }), _jsx(FmI18nCommon, { i18nKey: 'queue.enableQueueDescription', as: 'p', className: 'text-xs text-muted-foreground' })] })] }), _jsx(FmCommonToggle, { id: 'enable-queue', label: t('queue.enableQueueSystem'), checked: enableQueue, onCheckedChange: setEnableQueue })] }), _jsxs("div", { className: 'p-4 bg-muted/20 rounded-none border border-border space-y-3', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Users, { className: 'h-4 w-4 text-muted-foreground' }), _jsx("span", { className: 'font-medium', children: t('queue.maxConcurrentUsers') }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { delayDuration: 300, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Info, { className: 'h-4 w-4 text-muted-foreground cursor-help' }) }), _jsx(TooltipContent, { side: 'right', className: 'max-w-xs bg-black/95 border-white/20', children: _jsx("p", { className: 'text-sm text-white', children: t('queue.maxConcurrentUsersTooltip') }) })] }) })] }), _jsx(FmCommonTextField, { type: 'number', value: maxConcurrentUsers, onChange: e => setMaxConcurrentUsers(e.target.value), placeholder: DEFAULT_QUEUE_CONFIG.max_concurrent_users.toString(), min: 1, max: 1000 })] }), _jsxs("div", { className: 'p-4 bg-muted/20 rounded-none border border-border space-y-3', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Clock, { className: 'h-4 w-4 text-muted-foreground' }), _jsx("span", { className: 'font-medium', children: t('queue.checkoutTimer') }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { delayDuration: 300, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Info, { className: 'h-4 w-4 text-muted-foreground cursor-help' }) }), _jsx(TooltipContent, { side: 'right', className: 'max-w-xs bg-black/95 border-white/20', children: _jsx("p", { className: 'text-sm text-white', children: t('queue.checkoutTimerTooltip', { minutes: globalDefaultMinutes || 10 }) }) })] }) })] }), _jsx(FmCommonTextField, { type: 'number', value: checkoutTimeoutMinutes, onChange: e => setCheckoutTimeoutMinutes(e.target.value), placeholder: t('queue.globalDefaultPlaceholder', { minutes: globalDefaultMinutes || 10 }), min: 1, max: 60 })] }), _jsxs("div", { className: 'p-4 bg-muted/20 rounded-none border border-border space-y-3', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Timer, { className: 'h-4 w-4 text-muted-foreground' }), _jsx("span", { className: 'font-medium', children: t('queue.sessionTimeout') }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { delayDuration: 300, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Info, { className: 'h-4 w-4 text-muted-foreground cursor-help' }) }), _jsx(TooltipContent, { side: 'right', className: 'max-w-xs bg-black/95 border-white/20', children: _jsx("p", { className: 'text-sm text-white', children: t('queue.sessionTimeoutTooltip') }) })] }) })] }), _jsx(FmCommonTextField, { type: 'number', value: sessionTimeoutMinutes, onChange: e => setSessionTimeoutMinutes(e.target.value), placeholder: DEFAULT_QUEUE_CONFIG.session_timeout_minutes.toString(), min: 1, max: 120 })] })] }), _jsx("div", { className: 'pt-4 border-t border-border', children: _jsx(FmCommonButton, { onClick: handleSave, loading: isSaving, className: 'bg-fm-gold hover:bg-fm-gold/90 text-black', children: t('queue.saveConfiguration') }) })] }));
};
