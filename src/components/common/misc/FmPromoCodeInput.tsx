import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { FmQueryInput } from '../forms/FmQueryInput';
import { supabase } from '@/shared';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { Button } from '../shadcn/button';
import { cn } from '@/shared';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
}

interface FmPromoCodeInputProps {
  onPromoCodeApplied?: (promoCode: PromoCode | null) => void;
  className?: string;
}

export const FmPromoCodeInput = ({
  onPromoCodeApplied,
  className,
}: FmPromoCodeInputProps) => {
  const { t } = useTranslation('common');
  const [validationState, setValidationState] = useState<
    'idle' | 'valid' | 'invalid'
  >('idle');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleQuery = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('id, code, discount_type, discount_value')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const promoCode: PromoCode = {
          id: data.id,
          code: data.code,
          discount_type: data.discount_type as 'percentage' | 'flat',
          discount_value: data.discount_value,
        };
        setValidationState('valid');
        setAppliedPromo(promoCode);
        setErrorMessage('');
        onPromoCodeApplied?.(promoCode);
      } else {
        setValidationState('invalid');
        setAppliedPromo(null);
        setErrorMessage(t('promoCode.invalidCode'));
        onPromoCodeApplied?.(null);
      }
    } catch (error) {
      logger.error('Error validating promo code:', { error: error instanceof Error ? error.message : 'Unknown' });
      setValidationState('invalid');
      setAppliedPromo(null);
      setErrorMessage(t('promoCode.errorValidating'));
      onPromoCodeApplied?.(null);
    }
  };

  const getDiscountText = () => {
    if (!appliedPromo) return '';

    if (appliedPromo.discount_type === 'percentage') {
      return t('promoCode.percentOff', { percent: appliedPromo.discount_value });
    } else {
      return t('promoCode.amountOff', { amount: appliedPromo.discount_value });
    }
  };

  const handleClearPromo = () => {
    setValidationState('idle');
    setAppliedPromo(null);
    setErrorMessage('');
    onPromoCodeApplied?.(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {validationState !== 'valid' ? (
        <FmQueryInput placeholder={t('promoCode.enterCode')} onQuery={handleQuery} />
      ) : (
        <div className='flex items-center gap-2'>
          <div className='flex-1 flex items-center gap-1.5 text-xs text-green-600 bg-green-600/10 px-3 py-2 rounded-none'>
            <CheckCircle2 className='h-3 w-3' />
            <span>
              {t('promoCode.applied', { code: appliedPromo?.code, discount: getDiscountText() })}
            </span>
          </div>
          <Button
            size='sm'
            variant='ghost'
            onClick={handleClearPromo}
            className='h-8 px-2 hover:bg-destructive/10'
          >
            <X className='h-3 w-3' />
          </Button>
        </div>
      )}

      {validationState === 'invalid' && (
        <div className='flex items-center gap-1.5 text-xs text-destructive'>
          <XCircle className='h-3 w-3' />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
