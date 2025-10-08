# DecorativeDivider Component

A reusable decorative divider component with animated gold elements.

## Usage

### Basic Usage
```tsx
import { DecorativeDivider } from '@/components/DecorativeDivider';

// Default styling
<DecorativeDivider />
```

### Customization Options

```tsx
// Custom margins
<DecorativeDivider marginTop="mt-8" marginBottom="mb-8" />

// Custom opacity
<DecorativeDivider opacity={0.5} />

// Custom line width and dot size
<DecorativeDivider lineWidth="w-16" dotSize="w-3 h-3" />

// Without animation
<DecorativeDivider animate={false} />

// Combined customization
<DecorativeDivider 
  marginTop="mt-4" 
  marginBottom="mb-12" 
  opacity={0.7}
  lineWidth="w-20"
  dotSize="w-4 h-4"
  className="my-custom-class"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `""` | Additional CSS classes |
| `marginTop` | `string` | `"mt-16"` | Top margin Tailwind class |
| `marginBottom` | `string` | `"mb-16"` | Bottom margin Tailwind class |
| `opacity` | `number` | `0.3` | Opacity value (0-1) |
| `lineWidth` | `string` | `"w-12"` | Width of the gradient lines |
| `dotSize` | `string` | `"w-2 h-2"` | Size of the center dot |
| `animate` | `boolean` | `true` | Whether to animate the center dot |

## Features

- 🎨 Gold gradient lines that fade from transparent
- ⚡ Animated pulsing center dot
- 📱 Fully responsive design
- 🔧 Highly customizable
- 💨 Lightweight and performant

## Examples

### Compact Divider
```tsx
<DecorativeDivider 
  marginTop="mt-4" 
  marginBottom="mb-4" 
  lineWidth="w-8" 
  dotSize="w-1.5 h-1.5" 
/>
```

### Prominent Divider
```tsx
<DecorativeDivider 
  marginTop="mt-20" 
  marginBottom="mb-20" 
  opacity={0.6}
  lineWidth="w-20" 
  dotSize="w-3 h-3" 
/>
```

### Static Divider
```tsx
<DecorativeDivider 
  animate={false}
  opacity={0.2}
/>
```