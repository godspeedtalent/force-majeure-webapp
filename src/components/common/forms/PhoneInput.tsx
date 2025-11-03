import { forwardRef } from 'react';
import { Input } from '@/components/common/shadcn/input';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const formatPhoneNumber = (input: string): string => {
      // Remove all non-numeric characters
      const cleaned = input.replace(/\D/g, '');
      
      // Format as (XXX) XXX-XXXX
      if (cleaned.length <= 3) {
        return cleaned;
      } else if (cleaned.length <= 6) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      } else {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      onChange(formatted);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder="(555) 123-4567"
        maxLength={14}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
