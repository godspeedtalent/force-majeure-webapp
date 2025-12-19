import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { FmQueryInput } from '../forms/FmQueryInput';
import { supabase } from '@/shared';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { Button } from '../shadcn/button';
import { cn } from '@/shared';
export const FmPromoCodeInput = ({ onPromoCodeApplied, className, }) => {
    const { t } = useTranslation('common');
    const [validationState, setValidationState] = useState('idle');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const handleQuery = async (code) => {
        try {
            const { data, error } = await supabase
                .from('promo_codes')
                .select('*')
                .eq('code', code)
                .eq('is_active', true)
                .maybeSingle();
            if (error)
                throw error;
            if (data) {
                const promoCode = data;
                setValidationState('valid');
                setAppliedPromo(promoCode);
                setErrorMessage('');
                onPromoCodeApplied?.(promoCode);
            }
            else {
                setValidationState('invalid');
                setAppliedPromo(null);
                setErrorMessage(t('promoCode.invalidCode'));
                onPromoCodeApplied?.(null);
            }
        }
        catch (error) {
            logger.error('Error validating promo code:', { error: error instanceof Error ? error.message : 'Unknown' });
            setValidationState('invalid');
            setAppliedPromo(null);
            setErrorMessage(t('promoCode.errorValidating'));
            onPromoCodeApplied?.(null);
        }
    };
    const getDiscountText = () => {
        if (!appliedPromo)
            return '';
        if (appliedPromo.discount_type === 'percentage') {
            return t('promoCode.percentOff', { percent: appliedPromo.discount_value });
        }
        else {
            return t('promoCode.amountOff', { amount: appliedPromo.discount_value });
        }
    };
    const handleClearPromo = () => {
        setValidationState('idle');
        setAppliedPromo(null);
        setErrorMessage('');
        onPromoCodeApplied?.(null);
    };
    return (_jsxs("div", { className: cn('space-y-2', className), children: [validationState !== 'valid' ? (_jsx(FmQueryInput, { placeholder: t('promoCode.enterCode'), onQuery: handleQuery })) : (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsxs("div", { className: 'flex-1 flex items-center gap-1.5 text-xs text-green-600 bg-green-600/10 px-3 py-2 rounded-md', children: [_jsx(CheckCircle2, { className: 'h-3 w-3' }), _jsx("span", { children: t('promoCode.applied', { code: appliedPromo?.code, discount: getDiscountText() }) })] }), _jsx(Button, { size: 'sm', variant: 'ghost', onClick: handleClearPromo, className: 'h-8 px-2 hover:bg-destructive/10', children: _jsx(X, { className: 'h-3 w-3' }) })] })), validationState === 'invalid' && (_jsxs("div", { className: 'flex items-center gap-1.5 text-xs text-destructive', children: [_jsx(XCircle, { className: 'h-3 w-3' }), _jsx("span", { children: errorMessage })] }))] }));
};
