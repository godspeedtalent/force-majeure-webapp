/**
 * FmFormFieldGroup
 *
 * Wraps form fields in a frosted glass card container for visual grouping.
 * Use this to group related form fields together with consistent styling.
 *
 * Based on the ProfileEdit pattern which is the gold standard for form field grouping.
 */

import { LucideIcon } from 'lucide-react';
import { cn } from '@force-majeure/shared/utils/utils';

export interface FmFormFieldGroupProps {
  /** Group title displayed at top */
  title?: string;
  /** Optional description/help text below title */
  description?: string;
  /** Optional icon displayed next to title */
  icon?: LucideIcon;
  /** Form fields to wrap */
  children: React.ReactNode;
  /** Layout for form fields */
  layout?: 'stack' | 'grid-2' | 'grid-3' | 'inline';
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg';
  /** Whether to show required indicator on title */
  required?: boolean;
  /** Blur intensity */
  blur?: 'sm' | 'md' | 'lg';
  /** Background opacity level */
  opacity?: 'light' | 'medium' | 'dark';
}

const layoutClasses = {
  stack: 'space-y-[20px]',
  'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-[20px]',
  'grid-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]',
  inline: 'flex flex-wrap gap-[20px]',
};

const paddingClasses = {
  sm: 'p-[10px]',
  md: 'p-[20px]',
  lg: 'p-[40px]',
};

const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
};

const opacityClasses = {
  light: 'bg-card/10',
  medium: 'bg-card/20',
  dark: 'bg-card/30',
};

export const FmFormFieldGroup = ({
  title,
  description,
  icon: Icon,
  children,
  layout = 'stack',
  className,
  contentClassName,
  padding = 'md',
  required = false,
  blur = 'lg',
  opacity = 'medium',
}: FmFormFieldGroupProps) => {
  return (
    <div
      className={cn(
        // Base container styling - frosted glass effect
        'rounded-none border border-border/30',
        opacityClasses[opacity],
        blurClasses[blur],
        paddingClasses[padding],
        className
      )}
    >
      {/* Section Header */}
      {(title || description) && (
        <div className='mb-[20px]'>
          {title && (
            <div className='flex items-center gap-2'>
              {Icon && <Icon className='w-5 h-5 text-fm-gold' />}
              <h3 className='text-lg font-canela font-medium text-foreground'>
                {title}
                {required && <span className='text-destructive ml-1'>*</span>}
              </h3>
            </div>
          )}
          {description && (
            <p className='text-sm text-muted-foreground mt-1'>{description}</p>
          )}
        </div>
      )}

      {/* Form Fields */}
      <div className={cn(layoutClasses[layout], contentClassName)}>
        {children}
      </div>
    </div>
  );
};

/**
 * Preset variants for common use cases
 */

/** Contact information group (name, email, phone) */
export const FmContactFieldGroup = ({
  children,
  ...props
}: Omit<FmFormFieldGroupProps, 'title'>) => (
  <FmFormFieldGroup title='Contact Information' layout='grid-2' {...props}>
    {children}
  </FmFormFieldGroup>
);

/** Address fields group */
export const FmAddressFieldGroup = ({
  children,
  ...props
}: Omit<FmFormFieldGroupProps, 'title'>) => (
  <FmFormFieldGroup title='Address' layout='grid-2' {...props}>
    {children}
  </FmFormFieldGroup>
);

/** Account/credentials group (password, etc.) */
export const FmAccountFieldGroup = ({
  children,
  ...props
}: Omit<FmFormFieldGroupProps, 'title'>) => (
  <FmFormFieldGroup title='Account Security' layout='stack' {...props}>
    {children}
  </FmFormFieldGroup>
);

/** Social media links group */
export const FmSocialLinksFieldGroup = ({
  children,
  ...props
}: Omit<FmFormFieldGroupProps, 'title'>) => (
  <FmFormFieldGroup title='Social Media' layout='grid-2' {...props}>
    {children}
  </FmFormFieldGroup>
);
