import { useState } from 'react';
import { FmCommonQueryInput } from './FmCommonQueryInput';
import { supabase } from '@/shared/api/supabase/client';
import { CheckCircle2, XCircle } from 'lucide-react';
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

export const FmPromoCodeInput = ({ onPromoCodeApplied, className }: FmPromoCodeInputProps) => {
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
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
      console.error('Error validating promo code:', error);
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

  return (
    <div className={cn('space-y-2', className)}>
      <FmCommonQueryInput
        placeholder='Enter promo code'
        onQuery={handleQuery}
        disabled={validationState === 'valid'}
      />
      
      {validationState === 'valid' && appliedPromo && (
        <div className='flex items-center gap-1.5 text-xs text-green-600'>
          <CheckCircle2 className='h-3 w-3' />
          <span>Promo code applied: {getDiscountText()}</span>
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
