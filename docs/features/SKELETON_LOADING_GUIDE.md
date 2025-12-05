# Skeleton Loading Guide

This guide documents the skeleton loading implementation for Force Majeure, including both image loading and font loading skeletons.

## Overview

Skeleton loaders improve perceived performance by showing placeholders while content loads. This prevents layout shifts and provides visual feedback to users.

## Components

### 1. ImageWithSkeleton

A wrapper component for images that shows a skeleton while the image loads.

**Location:** `/src/components/primitives/ImageWithSkeleton.tsx`

**Features:**
- Automatic skeleton display while image loads
- Smooth fade-in transition (300ms)
- Error handling with fallback to placeholder image
- Support for custom aspect ratios
- Configurable image anchor positioning

**Usage:**

```tsx
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { ImageAnchor } from '@/shared/types/imageAnchor';

// Basic usage
<ImageWithSkeleton
  src="/path/to/image.jpg"
  alt="Description"
  className="w-full h-64 object-cover"
/>

// With custom skeleton styling
<ImageWithSkeleton
  src="/path/to/image.jpg"
  alt="Description"
  className="w-full h-64 object-cover"
  skeletonClassName="rounded-none" // Sharp corners per design system
/>

// With aspect ratio and anchor
<ImageWithSkeleton
  src="/path/to/image.jpg"
  alt="Description"
  aspectRatio="16/9"
  anchor={ImageAnchor.TOP}
  className="w-full object-cover"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | Required | Image source URL |
| `alt` | `string` | Required | Alt text for accessibility |
| `className` | `string` | - | CSS classes for the image element |
| `skeletonClassName` | `string` | - | CSS classes for the skeleton |
| `aspectRatio` | `string` | - | Aspect ratio (e.g., "16/9", "4/3") |
| `anchor` | `ImageAnchor` | `ImageAnchor.CENTER` | Image positioning anchor point |

### 2. FmCommonTextSkeleton

A wrapper component for text that shows a skeleton while custom fonts load.

**Location:** `/src/components/common/feedback/FmCommonTextSkeleton.tsx`

**Features:**
- Automatic font loading detection (Canela Deck by default)
- Smooth fade-in when font loads
- Configurable dimensions
- Support for all HTML heading/text elements
- Fallback timeout (3 seconds) to prevent infinite loading

**Usage:**

```tsx
import { FmCommonTextSkeleton } from '@/components/common/feedback/FmCommonTextSkeleton';

// Basic usage (auto-detects Canela font)
<FmCommonTextSkeleton as="h1" className="text-4xl font-bold">
  Force Majeure
</FmCommonTextSkeleton>

// With custom dimensions
<FmCommonTextSkeleton
  as="h2"
  className="text-2xl"
  skeletonWidth="200px"
  skeletonHeight="32px"
>
  Event Title
</FmCommonTextSkeleton>

// Skip font loading check
<FmCommonTextSkeleton fontLoaded={true}>
  Pre-loaded text
</FmCommonTextSkeleton>

// Multiple lines
<div className="space-y-2">
  <FmCommonTextSkeleton as="h1" className="text-4xl">
    Main Heading
  </FmCommonTextSkeleton>
  <FmCommonTextSkeleton as="p" className="text-lg">
    Subtitle text that loads with font
  </FmCommonTextSkeleton>
</div>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | Text content to display when loaded |
| `className` | `string` | - | CSS classes for the text element |
| `skeletonClassName` | `string` | - | CSS classes for the skeleton |
| `as` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' \| 'p' \| 'span' \| 'div'` | `'span'` | HTML element to render |
| `skeletonWidth` | `string` | `'100%'` | Width of skeleton (px, %, tailwind) |
| `skeletonHeight` | `string` | `'1em'` | Height of skeleton (px, tailwind) |
| `fontLoaded` | `boolean` | - | Override font loading check |

## Hooks

### useFontLoaded

Detects when a custom font has finished loading using the CSS Font Loading API.

**Location:** `/src/shared/hooks/useFontLoaded.ts`

**Features:**
- Uses native CSS Font Loading API
- Fallback timeout for browsers without API support
- Convenience hooks for specific fonts

**Usage:**

```tsx
import {
  useFontLoaded,
  useCanelaLoaded,
  useScreamerLoaded,
} from '@/shared/hooks/useFontLoaded';

// Check any font
const isCustomFontLoaded = useFontLoaded('My Custom Font', 3000);

// Check Canela Deck (primary app font)
const isCanelaLoaded = useCanelaLoaded();

// Check FK Screamer (display font)
const isScreamerLoaded = useScreamerLoaded();

// Conditional rendering
{!isCanelaLoaded ? (
  <Skeleton className="h-8 w-48" />
) : (
  <h1 className="font-canela text-4xl">Loaded Text</h1>
)}
```

**API:**

```typescript
// Main hook
useFontLoaded(fontFamily: string, fallbackTimeout?: number): boolean

// Convenience hooks
useCanelaLoaded(): boolean  // Checks 'Canela Deck'
useScreamerLoaded(): boolean // Checks 'FK Screamer'
```

## Components Using Skeletons

### Updated Components

The following components have been updated to use skeleton loading:

1. **ForceMajeureLogo** ([components/navigation/ForceMajeureLogo.tsx](../src/components/navigation/ForceMajeureLogo.tsx))
   - Uses `ImageWithSkeleton` for logo image
   - Shows skeleton until logo loads
   - Critical path component in navigation

2. **EventCard** ([features/events/components/EventCard.tsx](../src/features/events/components/EventCard.tsx))
   - Uses `ImageWithSkeleton` for hero images
   - Replaced manual loading state management
   - Smooth transitions on image load

3. **FmCommonUserPhoto** ([components/common/display/FmCommonUserPhoto.tsx](../src/components/common/display/FmCommonUserPhoto.tsx))
   - Uses `ImageWithSkeleton` for square variant
   - Maintains fallback to initials/gradient
   - Circular avatars use Radix UI's built-in loading

### Already Implemented

These components already had skeleton support:

1. **FmImageCard** - Uses `ImageWithSkeleton` (gallery-style image cards)
2. **EventCardSkeleton** - Dedicated skeleton for event card grids
3. **EventRowSkeleton** - Dedicated skeleton for event list rows

## Design System Compliance

### Sharp Corners

Per the Force Majeure design system, skeletons use **sharp corners** (`rounded-none`) by default:

```tsx
// ✅ Correct - sharp corners
<ImageWithSkeleton
  src="/image.jpg"
  alt="Description"
  skeletonClassName="rounded-none"
/>

// ❌ Avoid - rounded corners (unless matching parent container)
<ImageWithSkeleton
  src="/image.jpg"
  alt="Description"
  skeletonClassName="rounded-md"
/>
```

**Exception:** When skeleton must match a rounded parent container:

```tsx
// Parent has rounded-md, skeleton should match
<div className="rounded-md overflow-hidden">
  <ImageWithSkeleton
    src="/image.jpg"
    alt="Description"
    skeletonClassName="rounded-md"
  />
</div>
```

### Animation

All skeletons use the `animate-pulse` animation from Tailwind:

- Duration: 2 seconds
- Easing: Cubic bezier
- Respects `prefers-reduced-motion`

### Colors

Skeletons use the muted background color from the design system:

```css
.skeleton {
  background-color: hsl(var(--muted));
}
```

## Performance Considerations

### Font Loading

The app uses `font-display: swap` for all custom fonts, which means:

1. Text renders immediately with fallback font (system font)
2. Custom font loads in the background
3. Text swaps to custom font when ready

**Why use FmCommonTextSkeleton?**

Even with `font-display: swap`, the font swap can cause visual jarring. The skeleton:
- Prevents the "flash" of system font
- Shows loading state explicitly
- Provides consistent user experience
- Matches expected design immediately

### Image Loading

Images can be slow to load, especially:
- Large hero images (event cards, headers)
- User-uploaded content
- Slow network connections

**Best Practices:**

1. **Always use skeletons for above-the-fold images**
   ```tsx
   <ImageWithSkeleton src={heroImage} alt="Event" />
   ```

2. **Consider aspect ratios for layout stability**
   ```tsx
   <ImageWithSkeleton
     src={image}
     alt="Event"
     aspectRatio="4/3"
   />
   ```

3. **Use EventCardSkeleton for loading lists**
   ```tsx
   {isLoading ? (
     <>
       <EventCardSkeleton />
       <EventCardSkeleton />
       <EventCardSkeleton />
     </>
   ) : (
     events.map(event => <EventCard key={event.id} event={event} />)
   )}
   ```

## Implementation Checklist

When adding new components with images or custom fonts:

- [ ] For images:
  - [ ] Use `ImageWithSkeleton` instead of plain `<img>` tags
  - [ ] Add `skeletonClassName="rounded-none"` (unless matching rounded container)
  - [ ] Consider aspect ratio for layout stability
  - [ ] Test on slow network (Chrome DevTools > Network > Slow 3G)

- [ ] For text with custom fonts:
  - [ ] Wrap important headings in `FmCommonTextSkeleton`
  - [ ] Use appropriate `as` prop for semantic HTML
  - [ ] Set `skeletonWidth` and `skeletonHeight` for accurate layout
  - [ ] Test font loading by disabling cache

- [ ] For loading states:
  - [ ] Use dedicated skeleton components (e.g., `EventCardSkeleton`)
  - [ ] Match skeleton layout exactly to real component
  - [ ] Show multiple skeletons for lists

## Examples

### Event Card with Full Skeleton Support

```tsx
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { FmCommonTextSkeleton } from '@/components/common/feedback/FmCommonTextSkeleton';

export const EventCard = ({ event }) => {
  return (
    <div className="border border-border rounded-none overflow-hidden">
      {/* Hero image with skeleton */}
      <div className="h-64 relative">
        <ImageWithSkeleton
          src={event.heroImage}
          alt={event.title}
          className="w-full h-full object-cover"
          skeletonClassName="rounded-none"
        />
      </div>

      {/* Content with text skeletons */}
      <div className="p-6">
        <FmCommonTextSkeleton as="h2" className="text-2xl font-bold mb-2">
          {event.title}
        </FmCommonTextSkeleton>

        <FmCommonTextSkeleton as="p" className="text-muted-foreground">
          {event.venue}
        </FmCommonTextSkeleton>
      </div>
    </div>
  );
};
```

### Logo with Skeleton

```tsx
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';

export const Logo = () => {
  return (
    <div className="w-12 h-12 relative">
      <ImageWithSkeleton
        src="/logo.png"
        alt="Force Majeure"
        className="w-full h-full object-contain"
        skeletonClassName="rounded-none"
      />
    </div>
  );
};
```

### Loading List with Skeletons

```tsx
import { EventCardSkeleton } from '@/features/events/components/EventCardSkeleton';
import { EventCard } from '@/features/events/components/EventCard';

export const EventGrid = ({ isLoading, events }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
```

## Troubleshooting

### Skeleton doesn't show

**Problem:** Image loads too quickly, skeleton never visible.

**Solution:** This is expected! Skeleton only shows when needed. Test on slow network:
```bash
# Chrome DevTools
Network tab > Throttling > Slow 3G
```

### Font skeleton flashes briefly

**Problem:** Font loads very quickly, causing brief flash.

**Solution:** This is working as intended. The fallback timeout (3 seconds) prevents infinite loading.

### Skeleton doesn't match final layout

**Problem:** Layout shifts when skeleton is replaced with content.

**Solution:**
1. Set explicit `skeletonWidth` and `skeletonHeight`
2. Match skeleton dimensions to expected content size
3. Use aspect ratios for images

### Skeleton has wrong colors

**Problem:** Skeleton doesn't match design system colors.

**Solution:** The base `Skeleton` component uses `bg-muted`. If you need custom colors:
```tsx
<Skeleton className="bg-muted" /> {/* Default */}
<Skeleton className="bg-fm-gold/10" /> {/* Custom */}
```

## Future Enhancements

Potential improvements for the skeleton system:

1. **Shimmer effect** - Add optional shimmer animation for premium feel
2. **Progressive loading** - Show low-res placeholder before full image
3. **Staggered animations** - Cascade fade-ins for multiple elements
4. **Skeleton templates** - Pre-built skeletons for common layouts
5. **Automatic detection** - Detect slow loads and show skeletons automatically

## Related Documentation

- [Design System Guide](/docs/DESIGN_SYSTEM.md) - Design system colors, spacing, and patterns
- [Image Anchor Types](/src/shared/types/imageAnchor.ts) - Image positioning options
- [Component Library](/docs/COMPONENT_LIBRARY.md) - Full component documentation

## Questions?

For questions about skeleton loading implementation:
1. Check this guide first
2. Review existing implementations (EventCard, ForceMajeureLogo)
3. Refer to Design System Guide for styling guidelines
