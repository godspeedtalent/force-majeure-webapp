import { FmCommonCheckbox } from '@/components/ui/forms/FmCommonCheckbox';
import { Label } from '@/components/ui/shadcn/label';

interface FmCommonFormCheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  error?: string;
}

export const FmCommonFormCheckbox = ({
  id,
  checked,
  onCheckedChange,
  label,
  error,
}: FmCommonFormCheckboxProps) => {
  return (
    <div>
      <div className="flex items-start gap-3">
        <FmCommonCheckbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        <Label htmlFor={id} className="text-sm font-normal cursor-pointer leading-relaxed">
          {label}
        </Label>
      </div>
      {error && <p className="text-xs text-destructive mt-1 ml-7">{error}</p>}
    </div>
  );
};
