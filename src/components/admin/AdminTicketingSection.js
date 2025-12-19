import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Percent, Timer, Info } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Button } from '@/components/common/shadcn/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/common/shadcn/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/common/shadcn/tooltip';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { cn } from '@/shared';
import { logger } from '@/shared';
import { useEnvironmentName, useFeatureFlagHelpers, FEATURE_FLAGS } from '@/shared';
import { APP_SETTING_KEYS, fetchAppSetting, updateAppSetting, } from '@/services/appSettingsService';
export const AdminTicketingSection = () => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const feeLabels = {
        sales_tax: t('admin.ticketing.salesTax'),
        processing_fee: t('admin.ticketing.processingFee'),
        platform_fee: t('admin.ticketing.platformFee'),
    };
    // Fees state
    const [fees, setFees] = useState([]);
    const [localFees, setLocalFees] = useState({});
    // Checkout timer state
    const [checkoutTimerMinutes, setCheckoutTimerMinutes] = useState('10');
    const [originalCheckoutTimerMinutes, setOriginalCheckoutTimerMinutes] = useState('10');
    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const currentEnvName = useEnvironmentName();
    const { isFeatureEnabled } = useFeatureFlagHelpers();
    const isCheckoutTimerEnabled = isFeatureEnabled(FEATURE_FLAGS.EVENT_CHECKOUT_TIMER);
    const fetchFees = async () => {
        try {
            // Get 'all' environment dynamically
            const { data: allEnvData, error: allEnvError } = await supabase
                .from('environments')
                .select('id')
                .eq('name', 'all')
                .single();
            if (allEnvError) {
                logger.error('Failed to fetch "all" environment:', allEnvError);
                throw allEnvError;
            }
            const { data, error } = await supabase
                .from('ticketing_fees')
                .select('*')
                .eq('environment_id', allEnvData.id)
                .order('fee_name', { ascending: true });
            if (error)
                throw error;
            setFees((data || []));
            const initialLocal = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data || []).forEach((fee) => {
                initialLocal[fee.fee_name] = {
                    type: fee.fee_type,
                    value: fee.fee_value.toString(),
                };
            });
            setLocalFees(initialLocal);
        }
        catch (error) {
            logger.error('Failed to fetch fees:', {
                error: error instanceof Error ? error.message : 'Unknown',
            });
            toast.error(tToast('admin.feesLoadFailed'));
        }
    };
    const fetchCheckoutTimerSetting = async () => {
        try {
            const value = await fetchAppSetting(APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES);
            const strValue = value.toString();
            setCheckoutTimerMinutes(strValue);
            setOriginalCheckoutTimerMinutes(strValue);
        }
        catch (error) {
            logger.error('Failed to fetch checkout timer setting:', {
                error: error instanceof Error ? error.message : 'Unknown',
            });
        }
    };
    const fetchAll = async () => {
        setIsLoading(true);
        await Promise.all([fetchFees(), fetchCheckoutTimerSetting()]);
        setIsLoading(false);
    };
    useEffect(() => {
        fetchAll();
    }, []);
    const handleTypeToggle = (feeName) => {
        setLocalFees(prev => ({
            ...prev,
            [feeName]: {
                ...prev[feeName],
                type: prev[feeName].type === 'flat' ? 'percentage' : 'flat',
            },
        }));
    };
    const handleValueChange = (feeName, value) => {
        setLocalFees(prev => ({
            ...prev,
            [feeName]: {
                ...prev[feeName],
                value,
            },
        }));
    };
    const handleSave = async () => {
        setShowConfirmDialog(false);
        try {
            // Update fees
            const feeUpdates = Object.entries(localFees).map(([feeName, feeData]) => {
                const numValue = parseFloat(feeData.value) || 0;
                const fee = fees.find(f => f.fee_name === feeName);
                if (!fee) {
                    logger.warn(`Fee not found: ${feeName}`);
                    return Promise.resolve();
                }
                return supabase
                    .from('ticketing_fees')
                    .update({
                    fee_type: feeData.type,
                    fee_value: numValue,
                })
                    .eq('fee_name', feeName)
                    .eq('environment_id', fee.environment_id);
            });
            // Update checkout timer setting
            const timerMinutes = parseInt(checkoutTimerMinutes, 10) || 10;
            const timerUpdatePromise = updateAppSetting(APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES, timerMinutes);
            await Promise.all([...feeUpdates, timerUpdatePromise]);
            toast.success(tToast('admin.feesUpdated'));
            await fetchAll();
        }
        catch (error) {
            logger.error('Failed to update ticketing settings:', {
                error: error instanceof Error ? error.message : 'Unknown',
            });
            toast.error(tToast('admin.feesUpdateFailed'));
        }
    };
    const hasFeesChanges = fees.some(fee => {
        const local = localFees[fee.fee_name];
        if (!local)
            return false;
        return (local.type !== fee.fee_type || parseFloat(local.value) !== fee.fee_value);
    });
    const hasTimerChanges = checkoutTimerMinutes !== originalCheckoutTimerMinutes;
    const hasChanges = hasFeesChanges || hasTimerChanges;
    if (isLoading) {
        return _jsx("div", { className: 'text-muted-foreground text-sm', children: t('status.loading') });
    }
    return (_jsxs("div", { className: 'space-y-8 max-w-2xl', children: [_jsxs("div", { className: 'pb-3 border-b border-border', children: [_jsx("p", { className: 'text-xs text-muted-foreground mb-2', children: t('admin.ticketing.description') }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("span", { className: 'text-xs text-muted-foreground', children: t('admin.ticketing.currentEnvironment') }), _jsx("span", { className: 'text-xs font-medium text-fm-gold uppercase', children: currentEnvName }), _jsxs("span", { className: 'text-xs text-muted-foreground', children: ["(", t('admin.ticketing.editing'), ": ", _jsx("span", { className: 'text-white/70', children: t('admin.ticketing.allEnvironments') }), ")"] })] })] }), _jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Timer, { className: 'h-5 w-5 text-fm-gold' }), _jsx("h3", { className: 'text-lg font-canela font-semibold', children: t('admin.ticketing.checkoutTimer') }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { delayDuration: 300, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Info, { className: 'h-4 w-4 text-muted-foreground cursor-help' }) }), _jsx(TooltipContent, { side: 'right', className: 'max-w-xs bg-black/95 border-white/20', children: _jsx("p", { className: 'text-sm text-white', children: t('admin.ticketing.checkoutTimerTooltip') }) })] }) })] }), _jsxs("div", { className: cn('p-4 bg-muted/20 rounded-none border border-border space-y-4 transition-opacity', !isCheckoutTimerEnabled && 'opacity-50'), children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [_jsx("span", { className: 'text-foreground font-medium', children: t('admin.ticketing.timerEnabled') }), _jsx("span", { className: cn('text-xs px-2 py-0.5 rounded-none', isCheckoutTimerEnabled
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'), children: isCheckoutTimerEnabled ? t('status.on') : t('status.off') })] }), _jsx("span", { className: 'text-xs text-muted-foreground', children: t('admin.ticketing.toggleInFeatureFlags') })] }), _jsx("div", { className: cn(!isCheckoutTimerEnabled && 'pointer-events-none'), children: _jsx(FmCommonTextField, { label: t('admin.ticketing.defaultDuration'), type: 'number', value: checkoutTimerMinutes, onChange: e => setCheckoutTimerMinutes(e.target.value), placeholder: '10', min: 1, max: 60, disabled: !isCheckoutTimerEnabled }) }), !isCheckoutTimerEnabled && (_jsx("p", { className: 'text-xs text-muted-foreground italic', children: t('admin.ticketing.enableFeatureFlagHint') }))] })] }), _jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(DollarSign, { className: 'h-5 w-5 text-fm-gold' }), _jsx("h3", { className: 'text-lg font-canela font-semibold', children: t('admin.ticketing.ticketingFees') })] }), _jsx("div", { className: 'grid gap-6', children: fees.map(fee => {
                            const local = localFees[fee.fee_name];
                            if (!local)
                                return null;
                            return (_jsxs("div", { className: 'space-y-3 p-4 bg-muted/20 rounded-none border border-border', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsx("span", { className: 'text-foreground font-medium', children: feeLabels[fee.fee_name] || fee.fee_name }), _jsxs("div", { className: 'flex gap-2', children: [_jsxs(Button, { size: 'sm', variant: 'outline', onClick: () => handleTypeToggle(fee.fee_name), className: cn('h-8 px-3 text-xs', local.type === 'flat'
                                                            ? 'bg-fm-gold/20 border-fm-gold text-foreground hover:bg-fm-gold/30'
                                                            : 'bg-background border-border text-muted-foreground hover:bg-muted'), children: [_jsx(DollarSign, { className: 'h-3 w-3 mr-1' }), t('admin.ticketing.flat')] }), _jsxs(Button, { size: 'sm', variant: 'outline', onClick: () => handleTypeToggle(fee.fee_name), className: cn('h-8 px-3 text-xs', local.type === 'percentage'
                                                            ? 'bg-fm-gold/20 border-fm-gold text-foreground hover:bg-fm-gold/30'
                                                            : 'bg-background border-border text-muted-foreground hover:bg-muted'), children: [_jsx(Percent, { className: 'h-3 w-3 mr-1' }), "%"] })] })] }), _jsx(FmCommonTextField, { label: local.type === 'flat' ? t('admin.ticketing.amountDollars') : t('admin.ticketing.percentage'), type: 'number', value: local.value, onChange: e => handleValueChange(fee.fee_name, e.target.value), placeholder: '0', prepend: local.type === 'flat' ? '$' : '%' })] }, fee.id));
                        }) })] }), _jsx("div", { className: 'pt-4', children: _jsx(Button, { onClick: () => setShowConfirmDialog(true), disabled: !hasChanges, className: 'bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed', children: t('admin.ticketing.saveSettings') }) }), _jsx(AlertDialog, { open: showConfirmDialog, onOpenChange: setShowConfirmDialog, children: _jsxs(AlertDialogContent, { className: 'bg-background border-border', children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { className: 'font-canela', children: t('admin.ticketing.confirmChangesTitle') }), _jsxs(AlertDialogDescription, { children: [t('admin.ticketing.confirmChangesDescription'), hasFeesChanges && ` ${t('admin.ticketing.feeChangesWarning')}`, hasTimerChanges && ` ${t('admin.ticketing.timerChangesWarning')}`, ` ${t('admin.ticketing.continueQuestion')}`] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: t('buttons.cancel') }), _jsx(AlertDialogAction, { onClick: handleSave, className: 'bg-fm-gold hover:bg-fm-gold/90 text-black', children: t('buttons.saveChanges') })] })] }) })] }));
};
