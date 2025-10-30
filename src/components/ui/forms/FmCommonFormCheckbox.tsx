import { Checkbox } from '@/components/ui/shadcn/checkbox';
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
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
        />
        <Label htmlFor={id} className="text-sm font-normal cursor-pointer leading-relaxed">
          {label}
        </Label>
      </div>
      {error && <p className="text-xs text-destructive mt-1 ml-7">{error}</p>}
    </div>
  );
};
