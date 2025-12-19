import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Percent } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Button } from '@/components/common/shadcn/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/common/shadcn/alert-dialog';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { cn } from '@/shared';
import { logger } from '@/shared';
import { useEnvironmentName } from '@/shared';
// Fee label keys - will use translations
const feeLabelKeys = {
    sales_tax: 'labels.salesTax',
    processing_fee: 'labels.processingFee',
    platform_fee: 'labels.platformFee',
};
export const AdminFeesSection = () => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const [fees, setFees] = useState([]);
    const [localFees, setLocalFees] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const currentEnvName = useEnvironmentName(); // Get environment name from hook
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
                .eq('environment_id', allEnvData.id) // Only fetch from 'all' environment
                .order('fee_name', { ascending: true });
            if (error)
                throw error;
            setFees((data || []));
            const initialLocal = {};
            (data || []).forEach((fee) => {
                initialLocal[fee.fee_name] = {
                    type: fee.fee_type,
                    value: fee.fee_value.toString(),
                };
            });
            setLocalFees(initialLocal);
        }
        catch (error) {
            logger.error('Failed to fetch fees:', { error: error instanceof Error ? error.message : 'Unknown' });
            toast.error(tToast('admin.feesLoadFailed'));
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchFees();
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
            const updates = Object.entries(localFees).map(([feeName, feeData]) => {
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
            await Promise.all(updates);
            toast.success(tToast('admin.feesUpdated'));
            await fetchFees();
        }
        catch (error) {
            logger.error('Failed to update fees:', { error: error instanceof Error ? error.message : 'Unknown' });
            toast.error(tToast('admin.feesUpdateFailed'));
        }
    };
    const hasChanges = fees.some(fee => {
        const local = localFees[fee.fee_name];
        if (!local)
            return false;
        return (local.type !== fee.fee_type || parseFloat(local.value) !== fee.fee_value);
    });
    if (isLoading) {
        return _jsx("div", { className: 'text-muted-foreground text-sm', children: "Loading..." });
    }
    return (_jsxs("div", { className: 'space-y-6 max-w-2xl', children: [_jsxs("div", { className: 'pb-3 border-b border-border', children: [_jsx("p", { className: 'text-xs text-muted-foreground mb-2', children: t('pageTitles.ticketingFeesDescription') }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsxs("span", { className: 'text-xs text-muted-foreground', children: [t('labels.currentEnvironment'), ":"] }), _jsx("span", { className: 'text-xs font-medium text-fm-gold uppercase', children: currentEnvName }), _jsx("span", { className: 'text-xs text-muted-foreground', children: t('formMessages.editingAllEnvironments') })] })] }), _jsx("div", { className: 'grid gap-6', children: fees.map(fee => {
                    const local = localFees[fee.fee_name];
                    if (!local)
                        return null;
                    return (_jsxs("div", { className: 'space-y-3 p-4 bg-muted/20 rounded-none border border-border', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsx("span", { className: 'text-foreground font-medium', children: feeLabelKeys[fee.fee_name] ? t(feeLabelKeys[fee.fee_name]) : fee.fee_name }), _jsxs("div", { className: 'flex gap-2', children: [_jsxs(Button, { size: 'sm', variant: 'outline', onClick: () => handleTypeToggle(fee.fee_name), className: cn('h-8 px-3 text-xs', local.type === 'flat'
                                                    ? 'bg-fm-gold/20 border-fm-gold text-foreground hover:bg-fm-gold/30'
                                                    : 'bg-background border-border text-muted-foreground hover:bg-muted'), children: [_jsx(DollarSign, { className: 'h-3 w-3 mr-1' }), t('labels.flat')] }), _jsxs(Button, { size: 'sm', variant: 'outline', onClick: () => handleTypeToggle(fee.fee_name), className: cn('h-8 px-3 text-xs', local.type === 'percentage'
                                                    ? 'bg-fm-gold/20 border-fm-gold text-foreground hover:bg-fm-gold/30'
                                                    : 'bg-background border-border text-muted-foreground hover:bg-muted'), children: [_jsx(Percent, { className: 'h-3 w-3 mr-1' }), "%"] })] })] }), _jsx(FmCommonTextField, { label: local.type === 'flat' ? t('labels.amountDollar') : t('labels.percentage'), type: 'number', value: local.value, onChange: e => handleValueChange(fee.fee_name, e.target.value), placeholder: '0', prepend: local.type === 'flat' ? '$' : '%' })] }, fee.id));
                }) }), _jsx("div", { className: 'pt-4', children: _jsx(Button, { onClick: () => setShowConfirmDialog(true), disabled: !hasChanges, className: 'bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed', children: t('formActions.saveFeeSettings') }) }), _jsx(AlertDialog, { open: showConfirmDialog, onOpenChange: setShowConfirmDialog, children: _jsxs(AlertDialogContent, { className: 'bg-background border-border', children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { className: 'font-canela', children: t('dialogs.confirmFeeChanges') }), _jsx(AlertDialogDescription, { children: t('dialogs.feeChangesDescription', { env: currentEnvName }) })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: t('buttons.cancel') }), _jsx(AlertDialogAction, { onClick: handleSave, className: 'bg-fm-gold hover:bg-fm-gold/90 text-black', children: t('formActions.saveChanges') })] })] }) })] }));
};
