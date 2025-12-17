import { FmCheckbox } from './FmCheckbox';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared';

export interface FmMultiCheckboxOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface FmMultiCheckboxInputProps {
  options: FmMultiCheckboxOption[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Multi-checkbox selection component with smooth animations
 * Allows selecting multiple options at once
 */
export const FmMultiCheckboxInput = ({
  options,
  selectedValues,
  onSelectionChange,
  className = '',
  disabled = false,
}: FmMultiCheckboxInputProps) => {
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      // Add value to selection
      onSelectionChange([...selectedValues, value]);
    } else {
      // Remove value from selection
      onSelectionChange(selectedValues.filter(v => v !== value));
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {options.map(option => (
        <FmCheckbox
          key={option.value}
          id={`checkbox-${option.value}`}
          label={option.label}
          icon={option.icon}
          checked={selectedValues.includes(option.value)}
          onCheckedChange={checked =>
            handleCheckboxChange(option.value, checked)
          }
          disabled={disabled}
        />
      ))}
    </div>
  );
};
