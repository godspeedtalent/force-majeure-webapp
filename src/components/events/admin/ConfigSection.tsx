import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Props for the ConfigSection component
 */
export interface ConfigSectionProps {
  /** Section title */
  title: string;
  /** Icon component to display */
  icon: React.ElementType;
  /** Section content */
  children: React.ReactNode;
  /** Whether the section is open by default */
  defaultOpen?: boolean;
}

/**
 * Collapsible section component for organizing configuration controls.
 *
 * Used in TestEventConfigSection to organize mock data generation options
 * into logical groups that can be expanded/collapsed.
 *
 * @example
 * ```tsx
 * <ConfigSection title="Orders & Users" icon={Users}>
 *   <TextField label="Total Orders" ... />
 *   <Slider label="User Ratio" ... />
 * </ConfigSection>
 * ```
 */
export function ConfigSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: ConfigSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className='border border-white/10 bg-black/20'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 transition-colors'
      >
        <Icon className='h-4 w-4 text-fm-purple' />
        <span className='text-sm font-medium flex-1'>{title}</span>
        {isOpen ? (
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        ) : (
          <ChevronRight className='h-4 w-4 text-muted-foreground' />
        )}
      </button>
      {isOpen && <div className='p-3 pt-0 space-y-3'>{children}</div>}
    </div>
  );
}
