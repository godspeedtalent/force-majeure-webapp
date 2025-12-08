import { useState } from 'react';
import { logger } from '@/shared/services/logger';
import { FmQueryInput } from '../forms/FmQueryInput';
import { supabase } from '@/shared/api/supabase/client';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { Button } from '../shadcn/button';
import { cn } from '@/shared/utils/utils';

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
  const [validationState, setValidationState] = useState<
    'idle' | 'valid' | 'invalid'
  >('idle');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleQuery = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('promo_codes' as any)
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const promoCode = data as unknown as PromoCode;
        setValidationState('valid');
        setAppliedPromo(promoCode);
        setErrorMessage('');
        onPromoCodeApplied?.(promoCode);
      } else {
        setValidationState('invalid');
        setAppliedPromo(null);
        setErrorMessage('Invalid promo code');
        onPromoCodeApplied?.(null);
      }
    } catch (error) {
      logger.error('Error validating promo code:', { error: error instanceof Error ? error.message : 'Unknown' });
      setValidationState('invalid');
      setAppliedPromo(null);
      setErrorMessage('Error validating code');
      onPromoCodeApplied?.(null);
    }
  };

  const getDiscountText = () => {
    if (!appliedPromo) return '';

    if (appliedPromo.discount_type === 'percentage') {
      return `${appliedPromo.discount_value}% off`;
    } else {
      return `$${appliedPromo.discount_value} off`;
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
        <FmQueryInput placeholder='Enter promo code' onQuery={handleQuery} />
      ) : (
        <div className='flex items-center gap-2'>
          <div className='flex-1 flex items-center gap-1.5 text-xs text-green-600 bg-green-600/10 px-3 py-2 rounded-md'>
            <CheckCircle2 className='h-3 w-3' />
            <span>
              {appliedPromo?.code} applied: {getDiscountText()}
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
