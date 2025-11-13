# Parallax System Documentation

## Overview

The Force Majeure parallax system provides layered background effects with independent scroll speeds, creating depth and visual interest. The system includes:

1. **ParallaxLayerManager** - Manages multiple parallax layers with different speeds
2. **TopographicBackground** - Mirrored topography pattern with optional parallax
3. **Per-page rotation** - Random 90° rotations for variety

## ParallaxLayerManager

A flexible component for managing multiple parallax background layers.

### Location
`/src/components/layout/ParallaxLayerManager.tsx`

### Features
- **Multiple layers** with independent scroll speeds
- **Z-index control** for layer ordering
- **Opacity control** per layer
- **Foreground content** rendered on top (no parallax)
- **Performance optimized** with passive scroll listeners

### Usage

```tsx
import { ParallaxLayerManager } from '@/components/layout/ParallaxLayerManager';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

<ParallaxLayerManager
  className='min-h-screen bg-background'
  layers={[
    {
      id: 'topography',
      content: <TopographicBackground opacity={0.1} parallax={false} />,
      speed: 0.3, // Moves at 30% of scroll speed
      zIndex: 1,
    },
    {
      id: 'gradient',
      content: <div className='absolute inset-0 bg-gradient-monochrome' />,
      speed: 0.5, // Moves at 50% of scroll speed
      zIndex: 2,
      opacity: 0.05,
    },
  ]}
>
  {/* Foreground content - no parallax */}
  <div className='container mx-auto'>
    <h1>Your content here</h1>
  </div>
</ParallaxLayerManager>
```

### ParallaxLayer Interface

```typescript
interface ParallaxLayer {
  /** Unique identifier */
  id: string;

  /** Content to render */
  content: ReactNode;

  /** Parallax speed multiplier
   * 0 = no movement (fixed)
   * 0.3 = slow parallax (recommended for far backgrounds)
   * 0.5 = medium parallax
   * 1 = moves with scroll (no parallax effect)
   */
  speed: number;

  /** Z-index for layer ordering (higher = closer) */
  zIndex?: number;

  /** Additional CSS classes */
  className?: string;

  /** Opacity (0-1) */
  opacity?: number;
}
```

### Recommended Speed Values

| Speed | Effect | Best For |
|-------|--------|----------|
| 0.0 | Fixed (no movement) | Truly static backgrounds |
| 0.2-0.3 | Very slow | Far background layers (topography) |
| 0.4-0.5 | Medium | Mid-ground elements (gradients, patterns) |
| 0.6-0.7 | Fast | Near background elements |
| 0.8-1.0 | Very fast / No parallax | Elements that should move with content |

## TopographicBackground

### Mirrored Tiling System

The topographic pattern uses a **3×3 mirrored grid** that repeats infinitely:

```
[TL]  [Top]  [TR]
[Left][Center][Right]
[BL]  [Bottom][BR]
```

**Dynamic transform calculation:**
The system dynamically generates tile transforms based on position relative to center (1,1):
- **Moving left or right** on X axis → flip X (`scaleX: -1`)
- **Moving up or down** on Y axis → flip Y (`scaleY: -1`)
- **Moving diagonally** → flip both (`scaleX: -1, scaleY: -1`)
- **Center tile** (1,1) → original, no flips (`scaleX: 1, scaleY: 1`)

This creates perfect edge matching where each tile mirrors its neighbor seamlessly.

### Random Rotation

Each page gets a unique rotation (0°, 90°, 180°, or 270°):
- **Determined by URL pathname** hash
- **Consistent per page** - same URL = same rotation
- **Maintains seamless mirroring** after rotation

### Props

```typescript
interface TopographicBackgroundProps {
  /** Opacity (0-1), default: 0.03 */
  opacity?: number;

  /** Additional CSS classes */
  className?: string;

  /** Enable internal parallax (use false with ParallaxLayerManager) */
  parallax?: boolean;

  /** Internal parallax speed (only used if parallax=true) */
  parallaxSpeed?: number;
}
```

### Usage

**With ParallaxLayerManager (Recommended):**
```tsx
<ParallaxLayerManager
  layers={[
    {
      id: 'topography',
      content: <TopographicBackground opacity={0.1} parallax={false} />,
      speed: 0.3,
      zIndex: 1,
    },
  ]}
>
  {/* Content */}
</ParallaxLayerManager>
```

**Standalone (Simple pages):**
```tsx
<div className='relative min-h-screen'>
  <TopographicBackground opacity={0.05} parallax={true} parallaxSpeed={0.5} />
  <div className='relative z-10'>
    {/* Content */}
  </div>
</div>
```

## Examples

### Example 1: Coming Soon Page (Multi-layer)

```tsx
<ParallaxLayerManager
  className='min-h-screen bg-background'
  layers={[
    {
      id: 'topography',
      content: <TopographicBackground opacity={0.1} parallax={false} />,
      speed: 0.3, // Slow movement for deep background
      zIndex: 1,
    },
    {
      id: 'gradient',
      content: <div className='absolute inset-0 bg-gradient-monochrome' />,
      speed: 0.5, // Medium movement for mid-layer
      zIndex: 2,
      opacity: 0.05,
    },
  ]}
>
  {/* Logo and content - no parallax, moves normally with page */}
  <div className='text-center'>
    <ForceMajeureLogo size='responsive' />
    <h1>Coming Soon</h1>
  </div>
</ParallaxLayerManager>
```

**Result:**
- Topography moves slowly (30% of scroll)
- Gradient moves medium speed (50% of scroll)
- Content moves normally (100% - no parallax)
- Creates depth with 3 distinct layers

### Example 2: Simple Page (Single Layer)

```tsx
<div className='relative min-h-screen bg-background'>
  <TopographicBackground opacity={0.03} />

  <div className='relative z-10 container mx-auto py-8'>
    <h1>Page Content</h1>
  </div>
</div>
```

**Result:**
- Topography has built-in parallax (default 50% speed)
- Random rotation applied per page
- Simpler setup for basic pages

### Example 3: Event Details Page (Custom Layers)

```tsx
<ParallaxLayerManager
  className='min-h-screen'
  layers={[
    {
      id: 'topography',
      content: <TopographicBackground opacity={0.05} parallax={false} />,
      speed: 0.2,
      zIndex: 1,
    },
    {
      id: 'hero-blur',
      content: (
        <div
          className='absolute inset-0'
          style={{
            background: `radial-gradient(circle at 50% 20%, rgba(223,186,125,0.1) 0%, transparent 50%)`,
          }}
        />
      ),
      speed: 0.4,
      zIndex: 2,
    },
  ]}
>
  <EventDetails />
</ParallaxLayerManager>
```

**Result:**
- Very slow topography (20% speed)
- Medium hero blur effect (40% speed)
- Multiple layers create rich depth

## Design Guidelines

### Layer Ordering (Z-Index)

1. **Far background** (z-index: 1): Topography, subtle patterns
2. **Mid background** (z-index: 2-5): Gradients, overlays
3. **Near background** (z-index: 6-9): Decorative elements
4. **Foreground** (z-index: 10+): Content, UI elements

### Speed Guidelines

- **Difference between layers**: Minimum 0.1-0.2 difference for noticeable effect
- **Maximum speed**: Keep under 0.7 for background layers
- **Topography**: Always 0.2-0.3 (slowest layer)
- **Gradients/overlays**: 0.4-0.5 (mid-speed)

### Opacity Guidelines

- **Topography**: 0.03-0.1 (very subtle to subtle)
- **Gradients**: 0.01-0.05 (extremely subtle)
- **Overlays**: 0.1-0.3 (more visible)
- **Total combined**: Should not exceed 0.3-0.4 opacity

### Performance Tips

1. **Limit layers**: Max 3-4 parallax layers per page
2. **Use will-change**: Already applied to all layers
3. **Passive listeners**: Already enabled for scroll events
4. **Disable on mobile**: Consider `parallax={false}` on mobile devices

## Troubleshooting

### Parallax not visible

**Problem:** Can't see parallax effect

**Solutions:**
1. Page must be scrollable (content taller than viewport)
2. Check speed values (0 = no movement)
3. Ensure layers have different speeds
4. Check opacity (too low = invisible)

### Layers not rendering

**Problem:** Background layers don't appear

**Solutions:**
1. Check z-index values (foreground might be covering)
2. Ensure `absolute inset-0` on layer content
3. Check opacity values
4. Verify content is not empty

### Mirroring seams visible

**Problem:** Can see lines between topography tiles

**Solutions:**
1. This is expected if image doesn't naturally tile
2. Increase opacity to make pattern more visible
3. Check browser zoom level (100% recommended)
4. Verify image file is loaded correctly

### Performance issues

**Problem:** Scrolling is laggy

**Solutions:**
1. Reduce number of layers (max 3-4)
2. Simplify layer content (avoid complex gradients)
3. Check for other scroll listeners on page
4. Consider disabling parallax on mobile

## Migration Guide

### From old TopographicBackground

**Old approach:**
```tsx
<div className='relative min-h-screen'>
  <TopographicBackground opacity={0.1} />
  <div className='relative z-10'>Content</div>
</div>
```

**New approach (if you want different speeds):**
```tsx
<ParallaxLayerManager
  className='min-h-screen'
  layers={[
    {
      id: 'topography',
      content: <TopographicBackground opacity={0.1} parallax={false} />,
      speed: 0.3,
      zIndex: 1,
    },
  ]}
>
  Content
</ParallaxLayerManager>
```

**Note:** Old approach still works! Only migrate if you need:
- Multiple layers with different speeds
- Fine-grained control over z-index
- Per-layer opacity

## Related Files

- `/src/components/layout/ParallaxLayerManager.tsx` - Main parallax manager
- `/src/components/common/misc/TopographicBackground.tsx` - Topography component
- `/src/pages/ComingSoon.tsx` - Example implementation
- `/src/components/common/misc/TopographicBackgroundDebug.tsx` - Debug tool

## Questions?

For questions about the parallax system:
1. Check this guide
2. Review ComingSoon.tsx example
3. Use TopographicBackgroundDebug for testing transforms
4. Refer to Design System Guide for styling guidelines
