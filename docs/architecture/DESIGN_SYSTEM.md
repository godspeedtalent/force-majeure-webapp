# Force Majeure Design System

Complete design system reference for building consistent, on-brand components and pages.

## Table of Contents

- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing Scale](#spacing-scale)
- [Depth & Layering](#depth--layering)
- [Design Elements](#design-elements)
- [Component Library](#component-library)
- [Usage Guidelines](#usage-guidelines)

---

## Color Palette

### Base Colors

- **Black** (`#000000`) - Primary background color
- **White** (`#FFFFFF`) - Default text and contrast elements

### Accent Colors

- **Dusty Gold** (`#dfba7d`) - Primary accent
  - Use for: Primary buttons, CTAs, highlights, active states
  - Tailwind: `bg-fm-gold`, `text-fm-gold`, `border-fm-gold`
- **Dark Crimson** (`#520C10`) - Secondary accent
  - Use for: Secondary emphasis, subtle accents
  - Tailwind: `bg-fm-crimson`, `text-fm-crimson`, `border-fm-crimson`

### Semantic Colors

- **Muted Navy** (`#545E75`) - Info/Tertiary
  - Use for: Informational states, tertiary actions
  - Tailwind: `bg-fm-navy`, `text-fm-navy`, `border-fm-navy`
- **Chili Red** (`#D64933`) - Danger
  - Use for: Errors, warnings, destructive actions
  - Note: Brighter than Dark Crimson for better visibility
  - Tailwind: `bg-fm-danger`, `text-fm-danger`, `border-fm-danger`

### Usage in Code

```typescript
import { COLORS, COLOR_CLASSES } from '@/shared/constants/designSystem';

// Direct hex values
const goldColor = COLORS.DUSTY_GOLD;

// Tailwind classes
const buttonClasses = `${COLOR_CLASSES.GOLD_BG} ${COLOR_CLASSES.WHITE_TEXT}`;
```

---

## Typography

### Primary Font

**Canela** is used for 99% of the application.

```typescript
import { TYPOGRAPHY } from '@/shared/constants/designSystem';

// Tailwind class
className={TYPOGRAPHY.FONT_CANELA}
```

### Text Rules

1. **Capitalization**: Use standard sentence case for headers
   - ✅ "Here's what we found."
   - ✅ "Event details."
   - ❌ "Here's What We Found"
   - ❌ "Event Details"

2. **Punctuation**: Use periods at the end of headers where appropriate
   - ✅ "Welcome to Force Majeure."
   - ✅ "No events found."

3. **Bold text**: Use sparingly for emphasis only
   - ❌ Over-bolding everything
   - ✅ **Important** information only

### Example

```tsx
// Good
<h1 className="font-canela text-2xl">Welcome to the event.</h1>
<p className="font-canela">Here's what you need to know.</p>

// Bad
<h1 className="font-bold">Welcome To The Event</h1>
<p className="font-bold">Here's What You Need To Know</p>
```

---

## Spacing Scale

Consistent spacing based on 5px increments:

| Size   | Value  | Use Case                    |
| ------ | ------ | --------------------------- |
| **XS** | `5px`  | Tight spacing, small gaps   |
| **SM** | `10px` | Compact layouts, list items |
| **MD** | `20px` | Default element spacing     |
| **LG** | `40px` | Section spacing, major gaps |
| **XL** | `60px` | Page sections, hero spacing |

### Usage in Code

```typescript
import { SPACING, SPACING_CLASSES } from '@/shared/constants/designSystem';

// Direct values
const padding = SPACING.MD; // '20px'

// Tailwind classes
className={SPACING_CLASSES.P_MD}  // padding: 20px
className={SPACING_CLASSES.GAP_LG} // gap: 40px
```

### Example Layout

```tsx
<div className='flex flex-col gap-[20px]'>
  {' '}
  {/* MD spacing */}
  <section className='p-[40px]'>
    {' '}
    {/* LG padding */}
    <h1 className='mb-[10px]'>Title</h1> {/* SM margin */}
    <p>Content here</p>
  </section>
</div>
```

---

## Depth & Layering

Material Design-inspired depth system for backgrounds. Each level represents elevation in the visual hierarchy.

### Level 0: Transparent (Bottommost)

- Transparent background with outline
- Example: `FmCard` outline variant

```tsx
className = 'bg-transparent border border-white/20';
```

### Level 1: Base Frosted Glass

- Black frosted glass base layer

```tsx
className = 'bg-black/60 backdrop-blur-sm';
```

### Level 2: Elevated

- Brighter frosted glass for elevated elements

```tsx
className = 'bg-black/70 backdrop-blur-md';
```

### Level 3: High Elevation

- Brightest frosted glass for top-level overlays

```tsx
className = 'bg-black/80 backdrop-blur-lg';
```

### Usage Example

```tsx
import { DEPTH } from '@/shared/constants/designSystem';

// Level 0 - Card outline
<div className={DEPTH.LEVEL_0.classes}>
  Content
</div>

// Level 1 - Base frosted glass
<div className={DEPTH.LEVEL_1.classes}>
  Modal content
</div>
```

---

## Design Elements

### Background

- **Black Topography Pattern**: Primary background throughout the application

```tsx
className = 'bg-topography';
```

## Design Elements

### Background

- **Black Topography Pattern**: Primary background throughout the application

```tsx
className = 'bg-topography';
```

### Corners & Borders

- **Sharp Edges**: Default for all components
- **Rounded Corners**: Almost never used

```tsx
// Default (preferred)
className = 'rounded-none';

// Subtle rounding (rare, only when necessary)
className = 'rounded-sm';
```

### Input Fields & Forms

**Based on FmCommonTextField styling patterns:**

#### Border Behavior

- **Default**: Single border on all sides
- **Hover**: Border changes to gold with subtle glow
- **Focus**: Remove all borders EXCEPT bottom border
  - Bottom border becomes thicker (3px)
  - Bottom border turns gold
  - Adds stronger gold glow
  - Slight ripple effect from borders when clicked

```tsx
// Input styling pattern
className="
  border border-input
  hover:bg-white/5 hover:border-fm-gold/50 hover:shadow-[0_0_12px_rgba(223,186,125,0.15)]
  focus-visible:outline-none focus-visible:bg-white/5
  focus-visible:border-t-0 focus-visible:border-l-0 focus-visible:border-r-0
  focus-visible:border-b-[3px] focus-visible:border-b-fm-gold
  focus-visible:shadow-[0_4px_16px_rgba(223,186,125,0.3)]
  transition-all duration-300
"
```

#### Background States

- **Default**: `bg-background`
- **Hover**: `bg-white/5` (slight brightness increase)
- **Focus**: `bg-white/5` (same as hover, maintains consistency)

#### Usage with Constants

```tsx
import { INPUT_STYLES } from '@/shared/constants/designSystem';

<input
  className={`
    ${INPUT_STYLES.TRANSITION}
    ${INPUT_STYLES.HOVER_CLASSES}
    ${INPUT_STYLES.FOCUS_CLASSES}
  `}
/>;
```

### Labels

**Labels should be small, muted color, and in ALL CAPS:**

- **Size**: `text-xs`
- **Case**: `uppercase`
- **Color (default)**: `text-muted-foreground`
- **Color (focused)**: `text-fm-gold`

```tsx
import { LABEL_STYLES } from '@/shared/constants/designSystem';

// Default label
<label className={LABEL_STYLES.DEFAULT_CLASSES}>
  Email Address
</label>

// Focused label
<label className={LABEL_STYLES.FOCUSED_CLASSES}>
  Email Address
</label>
```

### List Items & Menus

**Based on FmCommonContextMenu - uses striped background pattern:**

#### Striped Background

Alternating items have different background opacity for visual separation:

- **Even items** (0, 2, 4...): `bg-background/40` (lighter)
- **Odd items** (1, 3, 5...): `bg-background/60` (darker)

#### Interactive States

- **Hover**: Gold tint, slight scale up, gold glow
- **Focus**: Stronger gold tint, slight scale up, gold glow
- **Active**: Scale down slightly (press effect)

```tsx
import { LIST_ITEM_STYLES } from '@/shared/constants/designSystem';

// Example list with striped pattern
<div>
  {items.map((item, idx) => {
    const isEven = idx % 2 === 0;
    return (
      <div
        key={idx}
        className={
          isEven ? LIST_ITEM_STYLES.EVEN_CLASSES : LIST_ITEM_STYLES.ODD_CLASSES
        }
      >
        {item.label}
      </div>
    );
  })}
</div>;
```

#### Complete Striped List Example

```tsx
<div className='space-y-1'>
  <div className='bg-background/40 hover:bg-fm-gold/10 hover:scale-[1.02] transition-all duration-300 p-3 cursor-pointer'>
    Option 1
  </div>
  <div className='bg-background/60 hover:bg-fm-gold/10 hover:scale-[1.02] transition-all duration-300 p-3 cursor-pointer'>
    Option 2
  </div>
  <div className='bg-background/40 hover:bg-fm-gold/10 hover:scale-[1.02] transition-all duration-300 p-3 cursor-pointer'>
    Option 3
  </div>
</div>
```

### Icon Buttons

Use icon buttons where appropriate for clear actions:

- Edit, delete, close, expand, etc.
- Must have accessible labels
- Sharp edges, minimal padding

```tsx
<button className='p-[5px] rounded-none' aria-label='Edit event'>
  <EditIcon />
</button>
```

---

## Component Library

### Primary Building Blocks

All reusable components should be in `/src/components/common/` or similar `FmComponents` directory.

#### Core Components

1. **FmButton** - Primary button component
2. **FmCard** - Two variants:
   - Outline style (transparent with border)
   - Frosted glass style (black with blur)
3. **FmTextInput** - Text input fields
4. **FmCheckbox** - Checkbox inputs
5. **FmDateBox** - Date picker component
6. **FmDataGrid** - Data table/grid component
7. **FmCollapsibleGroupHeader** - Primary toggleable section header

#### FmCollapsibleGroupHeader (Primary Toggleable Header)

**This is the PRIMARY component for collapsible/toggleable section headers.** Use this component whenever you need to group items with an expandable/collapsible header in toolbars, sidebars, panels, and settings pages.

**Location:** `/src/components/common/data/FmCollapsibleGroupHeader.tsx`

**Features:**

- Compact design with rotating chevron indicator
- Optional item count badge
- Optional horizontal line divider
- Smooth CSS transitions
- Supports both controlled and uncontrolled modes

**Usage:**

```tsx
import { FmCollapsibleGroupHeader } from '@/components/common/data/FmCollapsibleGroupHeader';

// Uncontrolled (manages own state)
<FmCollapsibleGroupHeader title="Core" count={3} defaultExpanded={true}>
  <YourContent />
</FmCollapsibleGroupHeader>

// Controlled (parent manages state)
<FmCollapsibleGroupHeader
  title="Settings"
  count={5}
  expanded={isExpanded}
  onExpandedChange={setIsExpanded}
>
  <YourContent />
</FmCollapsibleGroupHeader>
```

**Props:**

| Prop              | Type                           | Default     | Description                          |
| ----------------- | ------------------------------ | ----------- | ------------------------------------ |
| `title`           | `string`                       | required    | The group header title               |
| `count`           | `number`                       | undefined   | Optional count badge                 |
| `defaultExpanded` | `boolean`                      | `true`      | Initial expanded state (uncontrolled)|
| `expanded`        | `boolean`                      | undefined   | Controlled expanded state            |
| `onExpandedChange`| `(expanded: boolean) => void`  | undefined   | Callback when state changes          |
| `showDivider`     | `boolean`                      | `true`      | Show horizontal line divider         |
| `className`       | `string`                       | undefined   | Additional CSS classes               |

**When to use:**

- Feature flag grouping (see `FeatureToggleSection`)
- Navigation sections (see `DevNavigationTab`)
- Settings panels
- Any grouped list content in toolbars/sidebars

**Note:** Prefer this over `FmCommonCollapsibleSection` for toolbar/panel contexts as it has a more compact design suited for dense UIs.

### Naming Convention

- **Fm** prefix: Force Majeure
- **FmCommon\*** prefix: Common/reusable components
  - Example: `FmCommonButton`, `FmCommonTextField`
- **Fm\*** prefix: Domain-specific components
  - Example: `FmEventCard`, `FmTicketTier`

### Creating New Components

1. **Check existing components first** - Reuse before creating new
2. **Inherit from base components** when possible
3. Use naming convention: `Fm*` or `FmCommon*`
4. Follow design system constants
5. Include TypeScript types
6. Add accessibility attributes

```tsx
// Example: Creating a new component
import {
  COLORS,
  SPACING_CLASSES,
  TYPOGRAPHY,
} from '@/shared/constants/designSystem';

export const FmNewComponent = () => {
  return (
    <div className={`${SPACING_CLASSES.P_MD} rounded-none`}>
      <h2 className={TYPOGRAPHY.FONT_CANELA}>Component title.</h2>
    </div>
  );
};
```

---

## Usage Guidelines

### When Building New Pages

1. **Use pre-built layouts** - Only create new layouts if absolutely necessary
2. **Use existing Fm\* components** - Compose from building blocks
3. **Follow color palette** - Use constants, not hard-coded colors
4. **Apply spacing scale** - Use defined spacing values
5. **Maintain sharp edges** - No rounded corners by default
6. **Use Canela font** - For 99% of text
7. **Follow text rules** - Sentence case, periods where appropriate

### Example Page Structure

```tsx
import {
  SPACING_CLASSES,
  TYPOGRAPHY,
  DEPTH,
} from '@/shared/constants/designSystem';
import { FmCard } from '@/components/common/FmCard';
import { FmButton } from '@/components/common/FmButton';

export const MyNewPage = () => {
  return (
    <div className={`${SPACING_CLASSES.P_LG} bg-topography min-h-screen`}>
      <h1 className={`${TYPOGRAPHY.FONT_CANELA} text-4xl text-white mb-[20px]`}>
        Welcome to the page.
      </h1>

      <FmCard variant='frosted' className={SPACING_CLASSES.P_MD}>
        <p className={TYPOGRAPHY.FONT_CANELA}>Content goes here.</p>

        <FmButton variant='primary' className='mt-[20px]'>
          Take action
        </FmButton>
      </FmCard>
    </div>
  );
};
```

### Common Patterns

#### Cards with Depth

```tsx
// Outline card (level 0)
<FmCard variant="outline">
  Content
</FmCard>

// Frosted glass card (level 1)
<FmCard variant="frosted">
  Content
</FmCard>
```

#### Buttons

```tsx
// Primary action (gold)
<FmButton variant="primary">
  Save changes
</FmButton>

// Danger action (red)
<FmButton variant="danger">
  Delete item
</FmButton>

// Icon button
<FmButton variant="icon" aria-label="Close">
  <CloseIcon />
</FmButton>
```

#### Spacing

```tsx
// Vertical stack with medium gaps
<div className="flex flex-col gap-[20px]">
  <Section1 />
  <Section2 />
  <Section3 />
</div>

// Grid with large gaps
<div className="grid grid-cols-2 gap-[40px]">
  <Card1 />
  <Card2 />
</div>
```

---

## Quick Reference

### Import Statement

```typescript
import {
  COLORS,
  COLOR_CLASSES,
  SPACING,
  SPACING_CLASSES,
  TYPOGRAPHY,
  DEPTH,
  BORDER_RADIUS,
  DESIGN_ELEMENTS,
} from '@/shared/constants/designSystem';
```

### Color Quick Reference

- Primary: Dusty Gold `#dfba7d`
- Secondary: Dark Crimson `#520C10`
- Info: Muted Navy `#545E75`
- Danger: Chili Red `#D64933`

### Spacing Quick Reference

- XS: 5px
- SM: 10px
- MD: 20px
- LG: 40px
- XL: 60px

### Typography Quick Reference

- Font: Canela (99% of app)
- Case: Sentence case
- Bold: Use sparingly

### Design Quick Reference

- Corners: Sharp (rounded-none)
- Background: Black topography
- Depth: 4 levels (transparent → frosted glass)

---

## Checklist for New Components

- [ ] Uses constants from `/src/shared/constants/designSystem.ts`
- [ ] Follows naming convention (Fm* or FmCommon*)
- [ ] Uses Canela font
- [ ] Applies sentence case to headers
- [ ] Uses sharp corners (no rounding)
- [ ] Uses spacing scale (5, 10, 20, 40, 60)
- [ ] Follows depth system for backgrounds
- [ ] Includes accessibility attributes
- [ ] Reuses existing components where possible
- [ ] TypeScript types defined
- [ ] Tailwind classes preferred over inline styles

---

## Notes for AI Assistants (Claude)

When creating new components or pages:

1. **Always import and use** constants from `/src/shared/constants/designSystem.ts`
2. **Check existing components** before creating new ones
3. **Follow the depth system** for layered backgrounds
4. **Use sharp corners** by default (`rounded-none`)
5. **Apply spacing scale** - no arbitrary spacing values
6. **Use Canela font** for all text
7. **Sentence case headers** with periods where appropriate
8. **Minimal bold text** - only for true emphasis
9. **Reference this doc** when styling questions arise
10. **Maintain consistency** with existing Fm\* components

For color values, spacing, or typography questions, refer to the constants file rather than guessing or using arbitrary values.
