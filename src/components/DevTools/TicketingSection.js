import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Percent } from 'lucide-react';
import { FmCommonToggleHeader } from '@/components/common/forms/FmCommonToggleHeader';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Button } from '@/components/common/shadcn/button';
import { logger } from '@/shared';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/common/shadcn/alert-dialog';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { cn } from '@/shared';
export const TicketingSection = () => {
    const { t } = useTranslation('common');
    const [fees, setFees] = useState([]);
    const [localFees, setLocalFees] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const environment = 'dev'; // Currently always dev
    const feeLabels = {
        sales_tax: t('devTools.ticketing.salesTax'),
        processing_fee: t('devTools.ticketing.processingFee'),
        platform_fee: t('devTools.ticketing.platformFee'),
    };
    const fetchFees = async () => {
        try {
            const { data, error } = await supabase
                .from('ticketing_fees')
                .select('*')
                .eq('environment', 'all') // Only fetch from 'all' environment
                .order('fee_name', { ascending: true });
            if (error)
                throw error;
            setFees((data || []));
            // Initialize local state
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
            toast.error(t('devTools.ticketing.loadError'));
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
                return supabase
                    .from('ticketing_fees')
                    .update({
                    fee_type: feeData.type,
                    fee_value: numValue,
                })
                    .eq('fee_name', feeName)
                    .eq('environment', 'all');
            });
            await Promise.all(updates);
            toast.success(t('devTools.ticketing.updateSuccess'));
            await fetchFees();
        }
        catch (error) {
            logger.error('Failed to update fees:', { error: error instanceof Error ? error.message : 'Unknown' });
            toast.error(t('devTools.ticketing.updateError'));
        }
    };
    const hasChanges = fees.some(fee => {
        const local = localFees[fee.fee_name];
        if (!local)
            return false;
        return (local.type !== fee.fee_type || parseFloat(local.value) !== fee.fee_value);
    });
    if (isLoading) {
        return _jsx("div", { className: 'text-white/50 text-sm', children: t('status.loading') });
    }
    return (_jsxs("div", { className: 'space-y-6', children: [_jsx("p", { className: 'text-xs text-white/50', children: t('devTools.ticketing.description') }), _jsx(FmCommonToggleHeader, { title: t('devTools.ticketing.taxesAndFees'), children: _jsx("div", { className: 'space-y-4', children: fees.map(fee => {
                        const local = localFees[fee.fee_name];
                        if (!local)
                            return null;
                        return (_jsxs("div", { className: 'space-y-2', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsx("span", { className: 'text-white text-sm font-medium', children: feeLabels[fee.fee_name] || fee.fee_name }), _jsxs("div", { className: 'flex gap-2', children: [_jsxs(Button, { size: 'sm', variant: 'outline', onClick: () => handleTypeToggle(fee.fee_name), className: cn('h-8 px-3 text-xs', local.type === 'flat'
                                                        ? 'bg-fm-gold/20 border-fm-gold text-white'
                                                        : 'bg-white/5 border-white/20 text-white/70'), children: [_jsx(DollarSign, { className: 'h-3 w-3 mr-1' }), t('devTools.ticketing.flat')] }), _jsxs(Button, { size: 'sm', variant: 'outline', onClick: () => handleTypeToggle(fee.fee_name), className: cn('h-8 px-3 text-xs', local.type === 'percentage'
                                                        ? 'bg-fm-gold/20 border-fm-gold text-white'
                                                        : 'bg-white/5 border-white/20 text-white/70'), children: [_jsx(Percent, { className: 'h-3 w-3 mr-1' }), "%"] })] })] }), _jsx(FmCommonTextField, { label: local.type === 'flat' ? t('devTools.ticketing.amountDollar') : t('devTools.ticketing.amountPercent'), type: 'number', value: local.value, onChange: e => handleValueChange(fee.fee_name, e.target.value), placeholder: '0', prepend: local.type === 'flat' ? '$' : '%' })] }, fee.id));
                    }) }) }), _jsx("div", { className: 'pt-4 border-t border-white/10', children: _jsx(Button, { onClick: () => setShowConfirmDialog(true), disabled: !hasChanges, className: 'w-full bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed', children: t('devTools.ticketing.saveFees') }) }), _jsx(AlertDialog, { open: showConfirmDialog, onOpenChange: setShowConfirmDialog, children: _jsxs(AlertDialogContent, { className: 'bg-black/90 backdrop-blur-md border border-white/20 text-white z-[200]', children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { className: 'font-canela text-white', children: t('devTools.ticketing.confirmTitle') }), _jsx(AlertDialogDescription, { className: 'text-white/70', children: t('devTools.ticketing.confirmDescription', { environment }) })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { className: 'bg-white/5 border-white/20 hover:bg-white/10 text-white', children: t('buttons.cancel') }), _jsx(AlertDialogAction, { onClick: handleSave, className: 'bg-fm-gold hover:bg-fm-gold/90 text-black', children: t('devTools.ticketing.saveChanges') })] })] }) })] }));
};
