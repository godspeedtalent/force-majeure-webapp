# Tailwind Configuration

This directory contains the modular Tailwind CSS configuration for the Force Majeure project. The configuration has been refactored to follow DRY principles and improve maintainability.

## Structure

```
src/config/tailwind/
├── README.md          # This file
├── theme.ts          # Main theme configuration
├── colors.ts         # Color palette and semantic colors
├── animations.ts     # Keyframes and animation definitions
├── typography.ts     # Font families and text styling
├── effects.ts        # Visual effects (shadows, gradients)
└── layout.ts         # Container and responsive settings
```

## Usage

The main `tailwind.config.ts` imports the complete theme configuration:

```typescript
import { themeConfig } from './src/config/tailwind/theme';
```

## Adding New Configurations

### Colors

Add new colors to `colors.ts`:

```typescript
// For brand colors
const brandColors = {
  'fm-new-color': 'hsl(var(--fm-new-color))',
};

// For component colors with variants
const componentColors = {
  newComponent: createColorVariant('new-component'),
};
```

### Animations

Add new animations to `animations.ts`:

```typescript
// Add keyframes
const newAnimations = {
  'custom-animation': {
    '0%': {
      /* start state */
    },
    '100%': {
      /* end state */
    },
  },
};

// Add to animations export
export const animations = {
  'custom-animation': createAnimation('custom-animation', '0.5s'),
};
```

### Typography

Add new fonts to `typography.ts`:

```typescript
export const fontFamily = {
  'new-font': ['New Font Family', 'fallback', 'generic'],
};
```

## Benefits

- **Modularity**: Each concern is separated into its own file
- **DRY Principle**: Utility functions reduce code duplication
- **Maintainability**: Easy to find and modify specific configurations
- **Type Safety**: Full TypeScript support with proper types
- **Documentation**: Clear organization and inline comments
