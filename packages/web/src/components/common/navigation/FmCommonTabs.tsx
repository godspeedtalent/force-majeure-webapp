import * as React from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/common/shadcn/tabs';
import { cn } from '@force-majeure/shared';

// ============================================================
// FmCommonTabs - Force Majeure branded Tabs wrapper
// ============================================================
// Wraps shadcn Tabs with FM branding:
// - Gold underline on active tab
// - Smooth transitions
// - Enhanced hover states

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
    className={cn('bg-muted/50 backdrop-blur-sm', className)}
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
      'transition-all duration-300',
      'data-[state=active]:text-fm-gold',
      'data-[state=active]:border-b-2 data-[state=active]:border-fm-gold',
      'hover:text-fm-gold/70',
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
