import * as React from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/common/shadcn/tabs';
import { cn } from '@/shared';

// ============================================================
// FmCommonTabs - Force Majeure branded Tabs wrapper
// ============================================================
// Wraps shadcn Tabs with FM branding:
// - Active: Gold border, gold text, frosted gold bg with glow
// - Inactive: Gold text, no borders except dividers; hover -> frosted gold bg
// - Smooth transitions

interface FmCommonTabsProps extends React.ComponentPropsWithoutRef<typeof Tabs> {}

const FmCommonTabs = React.forwardRef<
  React.ElementRef<typeof Tabs>,
  FmCommonTabsProps
>(({ className, ...props }, ref) => (
  <Tabs ref={ref} className={cn('', className)} {...props} />
));
FmCommonTabs.displayName = 'FmCommonTabs';

const FmCommonTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  React.ComponentPropsWithoutRef<typeof TabsList>
>(({ className, ...props }, ref) => (
  <TabsList
    ref={ref}
    className={cn(
      'bg-transparent h-auto p-0 gap-0 rounded-none',
      className
    )}
    {...props}
  />
));
FmCommonTabsList.displayName = 'FmCommonTabsList';

const FmCommonTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, ...props }, ref) => (
  <TabsTrigger
    ref={ref}
    className={cn(
      // Base styles
      'font-canela px-4 py-2 rounded-none',
      'transition-all duration-300',
      // Inactive state: gold text, divider border, transparent bg
      'text-fm-gold bg-transparent',
      'border-r border-fm-gold/30 last:border-r-0',
      // Inactive hover: frosted gold bg
      'hover:bg-fm-gold/20 hover:text-fm-gold hover:shadow-[0_0_12px_rgba(223,186,125,0.3)]',
      // Active state: gold border, gold text, frosted gold bg with glow
      'data-[state=active]:border data-[state=active]:border-fm-gold',
      'data-[state=active]:text-fm-gold data-[state=active]:bg-fm-gold/20',
      'data-[state=active]:shadow-[0_0_12px_rgba(223,186,125,0.3)]',
      // Active hover: stronger frosted gold bg
      'data-[state=active]:hover:bg-fm-gold/30 data-[state=active]:hover:text-fm-gold',
      className
    )}
    {...props}
  />
));
FmCommonTabsTrigger.displayName = 'FmCommonTabsTrigger';

const FmCommonTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsContent>,
  React.ComponentPropsWithoutRef<typeof TabsContent>
>(({ className, ...props }, ref) => (
  <TabsContent ref={ref} className={cn('', className)} {...props} />
));
FmCommonTabsContent.displayName = 'FmCommonTabsContent';

export {
  FmCommonTabs,
  FmCommonTabsList,
  FmCommonTabsTrigger,
  FmCommonTabsContent,
};
