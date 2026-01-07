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
// - Active: Gold border, gold text, semi-opaque white bg; hover -> gold bg, black text
// - Inactive: Gold text, no borders except dividers; hover -> gold bg, black text
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
      // Inactive hover: gold bg, black text
      'hover:bg-fm-gold hover:text-black',
      // Active state: gold border, gold text, semi-opaque white bg
      'data-[state=active]:border data-[state=active]:border-fm-gold',
      'data-[state=active]:text-fm-gold data-[state=active]:bg-white/10',
      'data-[state=active]:shadow-none',
      // Active hover: gold bg, black text
      'data-[state=active]:hover:bg-fm-gold data-[state=active]:hover:text-black',
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
