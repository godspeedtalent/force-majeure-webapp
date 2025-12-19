import { jsx as _jsx } from "react/jsx-runtime";
import { FmCheckbox } from './FmCheckbox';
import { cn } from '@/shared';
/**
 * Multi-checkbox selection component with smooth animations
 * Allows selecting multiple options at once
 */
export const FmMultiCheckboxInput = ({ options, selectedValues, onSelectionChange, className = '', disabled = false, }) => {
    const handleCheckboxChange = (value, checked) => {
        if (checked) {
            // Add value to selection
            onSelectionChange([...selectedValues, value]);
        }
        else {
            // Remove value from selection
            onSelectionChange(selectedValues.filter(v => v !== value));
        }
    };
    return (_jsx("div", { className: cn('space-y-1', className), children: options.map(option => (_jsx(FmCheckbox, { id: `checkbox-${option.value}`, label: option.label, icon: option.icon, checked: selectedValues.includes(option.value), onCheckedChange: checked => handleCheckboxChange(option.value, checked), disabled: disabled }, option.value))) }));
};
