import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { Input } from '@/components/common/shadcn/input';
export const PhoneInput = forwardRef(({ value, onChange, ...props }, ref) => {
    const formatPhoneNumber = (input) => {
        // Remove all non-numeric characters
        const cleaned = input.replace(/\D/g, '');
        // Format as (XXX) XXX-XXXX
        if (cleaned.length <= 3) {
            return cleaned;
        }
        else if (cleaned.length <= 6) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        }
        else {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        }
    };
    const handleChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        onChange(formatted);
    };
    return (_jsx(Input, { ref: ref, type: 'tel', value: value, onChange: handleChange, placeholder: '(555) 123-4567', maxLength: 14, ...props }));
});
PhoneInput.displayName = 'PhoneInput';
