# FmCommon Component Library Documentation

## Overview

The FmCommon component library provides standardized, reusable components for the Force Majeure application. All components follow consistent design patterns, use semantic design tokens, and are fully typed with TypeScript.

---

## Phase 1 Components (Complete) ✅

### 1. FmCommonIconWithText

**Purpose:** Display an icon with text for metadata, details, and inline information.

**Usage:**
```tsx
import { FmCommonIconWithText } from '@/components/common/fm';
import { Clock, MapPin } from 'lucide-react';

<FmCommonIconWithText 
  icon={Clock} 
  text="9:00 PM - 2:00 AM" 
  size="md"
/>

<FmCommonIconWithText 
  icon={MapPin} 
  text="The Parish" 
  iconPosition="left"
/>
```

**Props:**
- `icon` (LucideIcon, required) - Icon component from lucide-react
- `text` (string, required) - Text to display
- `iconPosition` ('left' | 'right') - Icon placement (default: 'left')
- `size` ('sm' | 'md' | 'lg') - Size variant (default: 'md')
- `gap` ('sm' | 'md' | 'lg') - Gap between icon and text (default: 'md')
- `className` (string) - Additional CSS classes
- `iconClassName` (string) - CSS classes for icon
- `textClassName` (string) - CSS classes for text

---

### 2. FmCommonBackButton

**Purpose:** Standardized navigation back button with consistent styling.

**Usage:**
```tsx
import { FmCommonBackButton } from '@/components/common/fm';

// Navigate back in history
<FmCommonBackButton />

// Navigate to specific path
<FmCommonBackButton to="/events" text="Back to Events" />

// Custom onClick
<FmCommonBackButton 
  onClick={() => console.log('Custom action')}
  variant="outline"
/>
```

**Props:**
- `text` (string) - Button text (default: 'Back')
- `icon` (LucideIcon) - Icon component (default: ArrowLeft)
- `to` (string) - Path to navigate to (if not provided, uses browser back)
- `onClick` (function) - Custom click handler (overrides navigation)
- `variant` ('ghost' | 'outline' | 'default') - Button style (default: 'ghost')
- `className` (string) - Additional CSS classes

---

### 3. FmCommonPriceDisplay

**Purpose:** Consistent price formatting with support for discounts and free items.

**Usage:**
```tsx
import { FmCommonPriceDisplay } from '@/components/common/fm';

// Basic price
<FmCommonPriceDisplay amountCents={2500} />

// With discount
<FmCommonPriceDisplay 
  amountCents={2000}
  originalAmountCents={2500}
  showDiscount
/>

// Free item
<FmCommonPriceDisplay amountCents={0} showFreeText />
```

**Props:**
- `amountCents` (number, required) - Price amount in cents
- `currency` (string) - Currency symbol (default: '$')
- `originalAmountCents` (number) - Original price for discount display
- `showDiscount` (boolean) - Show discount badge (default: true)
- `size` ('sm' | 'md' | 'lg' | 'xl') - Size variant (default: 'md')
- `className` (string) - Additional CSS classes
- `showFreeText` (boolean) - Show "Free" for $0.00 (default: true)

---

### 4. FmCommonBadgeGroup

**Purpose:** Display groups of badges with consistent layout and overflow handling.

**Usage:**
```tsx
import { FmCommonBadgeGroup, FmCommonBadgeItem } from '@/components/common/fm';

const badges: FmCommonBadgeItem[] = [
  { label: 'Hyperpop', variant: 'secondary' },
  { label: 'Electronic', variant: 'outline' },
  { label: 'Indie', variant: 'secondary' },
];

<FmCommonBadgeGroup 
  badges={badges}
  maxDisplay={3}
  gap="md"
  wrap
/>
```

**Props:**
- `badges` (FmCommonBadgeItem[], required) - Array of badge objects
- `maxDisplay` (number) - Maximum badges to show before "+X more"
- `gap` ('sm' | 'md' | 'lg') - Space between badges (default: 'md')
- `wrap` (boolean) - Allow wrapping to multiple lines (default: true)
- `className` (string) - Additional CSS classes
- `badgeClassName` (string) - CSS classes applied to all badges

**Badge Item Type:**
```typescript
interface FmCommonBadgeItem {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}
```

---

## Phase 2 Components (Complete) ✅

### 5. FmCommonInfoCard

**Purpose:** Display metadata with icon in a card format (event details, venue info, etc.).

**Usage:**
```tsx
import { FmCommonInfoCard } from '@/components/common/fm';
import { Calendar } from 'lucide-react';

<FmCommonInfoCard
  icon={Calendar}
  label="Event Date"
  value="September 26, 2025"
  size="md"
  layout="horizontal"
/>
```

**Props:**
- `icon` (LucideIcon, required) - Icon component
- `label` (string, required) - Label/title text
- `value` (string | ReactNode, required) - Value to display
- `size` ('sm' | 'md' | 'lg') - Card size (default: 'md')
- `layout` ('horizontal' | 'vertical') - Content layout (default: 'horizontal')
- `className` (string) - Additional CSS classes
- `iconClassName` (string) - CSS classes for icon

---

### 6. FmCommonStatCard

**Purpose:** Display metrics and statistics for dashboards and admin pages.

**Usage:**
```tsx
import { FmCommonStatCard } from '@/components/common/fm';
import { Users } from 'lucide-react';

<FmCommonStatCard
  value="1,234"
  label="Total Users"
  icon={Users}
  description="Active in last 30 days"
  badge={{ label: 'Live', variant: 'default' }}
  trend={{ value: '+12%', isPositive: true }}
  size="md"
/>
```

**Props:**
- `value` (string | number, required) - Main stat value
- `label` (string, required) - Stat label
- `icon` (LucideIcon) - Optional icon
- `description` (string) - Optional subtitle
- `badge` (object) - Optional badge with label and variant
- `trend` (object) - Optional trend indicator with value and isPositive
- `size` ('sm' | 'md' | 'lg') - Card size (default: 'md')
- `className` (string) - Additional CSS classes

---

### 7. FmCommonPageHeader

**Purpose:** Consistent page header layout with title, description, actions, and stats.

**Usage:**
```tsx
import { FmCommonPageHeader } from '@/components/common/fm';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';

<FmCommonPageHeader
  title="Admin Settings"
  icon={Settings}
  description="Manage application configuration and settings"
  actions={
    <>
      <Button>Save Changes</Button>
      <Button variant="outline">Cancel</Button>
    </>
  }
  stats={
    <>
      <FmCommonStatCard value="42" label="Active Events" />
      <FmCommonStatCard value="1,234" label="Total Users" />
    </>
  }
  showDivider
/>
```

**Props:**
- `title` (string, required) - Page title
- `icon` (LucideIcon) - Optional icon
- `description` (string) - Optional description/subtitle
- `actions` (ReactNode) - Action buttons or elements
- `stats` (ReactNode) - Stat cards or content below title
- `showDivider` (boolean) - Show decorative divider (default: true)
- `className` (string) - Additional CSS classes

---

### 8. FmCommonConfirmDialog

**Purpose:** Standardized confirmation dialog for destructive or important actions.

**Usage:**
```tsx
import { FmCommonConfirmDialog } from '@/components/common/fm';
import { useState } from 'react';

const [open, setOpen] = useState(false);

<FmCommonConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Delete Event"
  description="Are you sure you want to delete this event? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="destructive"
  onConfirm={async () => {
    await deleteEvent(eventId);
  }}
  isLoading={isDeleting}
/>
```

**Props:**
- `open` (boolean, required) - Dialog open state
- `onOpenChange` (function, required) - Callback when state changes
- `title` (string, required) - Dialog title
- `description` (string, required) - Dialog message
- `onConfirm` (function, required) - Callback when confirmed
- `confirmText` (string) - Confirm button text (default: 'Confirm')
- `cancelText` (string) - Cancel button text (default: 'Cancel')
- `variant` ('default' | 'destructive' | 'warning') - Dialog styling (default: 'default')
- `isLoading` (boolean) - Loading state (default: false)

---

## Design Principles

### 1. **Semantic Tokens**
All components use design system tokens from `index.css`:
- Colors: `text-foreground`, `text-muted-foreground`, `bg-accent`
- Spacing: Consistent padding and gaps
- Typography: `font-screamer` for headings, semantic text sizes

### 2. **Type Safety**
- All components have full TypeScript definitions
- Exported types for complex props (e.g., `FmCommonBadgeItem`)
- Strict prop validation

### 3. **Accessibility**
- Semantic HTML elements
- Proper ARIA labels where needed
- Keyboard navigation support
- Focus management

### 4. **Responsive Design**
- Mobile-first approach
- Responsive sizing options
- Flexible layouts that adapt to container

### 5. **Consistency**
- Shared sizing system (sm, md, lg)
- Consistent prop naming
- Predictable behavior

---

## Usage Best Practices

### Import Pattern
```tsx
// Import from common/fm index for tree-shaking
import { 
  FmCommonIconWithText, 
  FmCommonBackButton 
} from '@/components/common/fm';
```

### Composition
```tsx
// Combine components for complex layouts
<FmCommonPageHeader
  title="Events"
  stats={
    <>
      <FmCommonStatCard value="12" label="Active Events" />
      <FmCommonStatCard value="45" label="Past Events" />
    </>
  }
/>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <FmCommonInfoCard
    icon={Calendar}
    label="Date"
    value={<FmCommonIconWithText icon={Clock} text="9:00 PM" />}
  />
</div>
```

### Styling
```tsx
// Use className for layout adjustments, not styling
<FmCommonBackButton className="mb-4" />

// Avoid overriding internal component styles
// ❌ Bad
<FmCommonIconWithText className="text-red-500" />

// ✅ Good - use iconClassName prop
<FmCommonIconWithText iconClassName="text-accent" />
```

---

## Next Steps: Phase 3

**Planned Components:**
- `FmCommonSidebarLayout` - Standardized sidebar navigation
- `FmCommonForm` - Form wrapper with consistent handling
- Enhanced `FmCommonDataGrid` - More features for data tables
- `FmCommonDetailSection` - Content section with title/description

---

## Migration Guide

### Replacing Existing Patterns

**Before:**
```tsx
<div className="flex items-center gap-2">
  <Clock className="w-4 h-4 text-muted-foreground" />
  <span className="text-sm">9:00 PM</span>
</div>
```

**After:**
```tsx
<FmCommonIconWithText icon={Clock} text="9:00 PM" />
```

**Before:**
```tsx
<Button variant="ghost" onClick={() => navigate(-1)}>
  <ArrowLeft className="w-4 h-4 mr-2" />
  Back
</Button>
```

**After:**
```tsx
<FmCommonBackButton />
```

---

## Component Hierarchy

```
src/components/common/fm/
├── display/
│   ├── FmCommonIconWithText.tsx
│   ├── FmCommonPriceDisplay.tsx
│   ├── FmCommonBadgeGroup.tsx
│   ├── FmCommonInfoCard.tsx
│   ├── FmCommonStatCard.tsx
│   ├── FmCommonPageHeader.tsx
│   └── index.ts
├── navigation/
│   ├── FmCommonBackButton.tsx
│   └── index.ts
├── modals/
│   ├── FmCommonConfirmDialog.tsx
│   └── index.ts
└── index.ts (main export)
```

---

## Support & Feedback

For questions or suggestions about the FmCommon component library, please refer to:
- Component source code in `src/components/common/fm/`
- Design system in `src/index.css`
- Tailwind config in `src/config/tailwind/`
