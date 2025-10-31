/**
 * Animation configuration for Tailwind CSS
 * Organized keyframes and animations by category
 */

// Utility function to create fade animations
const createFadeAnimation = (direction: string, distance = '10px') => ({
  '0%': { opacity: '0', transform: `translate${direction}(${distance})` },
  '100%': { opacity: '1', transform: `translate${direction}(0)` },
});

// Layout and interaction animations
const layoutAnimations = {
  'accordion-down': {
    from: { height: '0', opacity: '0' },
    to: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
  },
  'accordion-up': {
    from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
    to: { height: '0', opacity: '0' },
  },
};

// Entry animations
const entryAnimations = {
  'fade-in': createFadeAnimation('Y'),
  'scale-in': {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  'slide-up': {
    '0%': { transform: 'translateY(100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  'slide-down-in': {
    '0%': { transform: 'translateY(-20px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  'slide-up-fade': {
    '0%': { transform: 'translateY(20px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
};

// Brand-specific animations
const brandAnimations = {
  'pulse-gold': {
    '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--fm-gold) / 0.7)' },
    '50%': { boxShadow: '0 0 0 10px hsl(var(--fm-gold) / 0)' },
  },
  shimmer: {
    '0%': {
      backgroundPosition: '-200% 0',
      borderImage:
        'linear-gradient(45deg, transparent, hsl(var(--accent)), transparent) 1',
    },
    '100%': {
      backgroundPosition: '200% 0',
      borderImage:
        'linear-gradient(45deg, transparent, hsl(var(--accent)), transparent) 1',
    },
  },
  'border-shimmer': {
    '0%': { borderColor: 'hsl(var(--fm-crimson))' },
    '50%': { borderColor: 'hsl(var(--accent))' },
    '100%': { borderColor: 'hsl(var(--fm-crimson))' },
  },
};

// Interactive feedback animations
const feedbackAnimations = {
  'input-pulse': {
    '0%, 100%': { backgroundColor: 'hsl(var(--background))' },
    '50%': { backgroundColor: 'hsl(var(--muted) / 0.3)' },
  },
  'pulse-gold-check': {
    '0%': {
      backgroundColor: 'transparent',
      borderColor: 'hsl(var(--border))',
      transform: 'scale(1)',
    },
    '50%': {
      backgroundColor: 'hsl(var(--fm-gold))',
      borderColor: 'hsl(var(--fm-gold))',
      transform: 'scale(1.1)',
    },
    '100%': {
      backgroundColor: 'hsl(var(--fm-gold))',
      borderColor: 'hsl(var(--fm-gold))',
      transform: 'scale(1)',
    },
  },
  'pulse-uncheck': {
    '0%': {
      backgroundColor: 'hsl(var(--fm-gold))',
      borderColor: 'hsl(var(--fm-gold))',
      transform: 'scale(1)',
    },
    '50%': {
      backgroundColor: 'hsl(var(--fm-gold) / 0.5)',
      borderColor: 'hsl(var(--fm-gold))',
      transform: 'scale(1.1)',
    },
    '100%': {
      backgroundColor: 'transparent',
      borderColor: 'hsl(var(--border))',
      transform: 'scale(1)',
    },
  },
};

// Collapsible animations
const collapsibleAnimations = {
  'slide-down': {
    from: { height: '0', opacity: '0' },
    to: { height: 'var(--radix-collapsible-content-height)', opacity: '1' },
  },
  'slide-up': {
    from: { height: 'var(--radix-collapsible-content-height)', opacity: '1' },
    to: { height: '0', opacity: '0' },
  },
};

export const keyframes = {
  ...layoutAnimations,
  ...entryAnimations,
  ...brandAnimations,
  ...feedbackAnimations,
  ...collapsibleAnimations,
};

// Animation configurations with consistent timing
const createAnimation = (
  name: string,
  duration: string,
  easing = 'ease-out',
  iteration = ''
) => `${name} ${duration} ${easing}${iteration ? ` ${iteration}` : ''}`;

export const animations = {
  // Layout animations
  'accordion-down': createAnimation('accordion-down', '0.3s'),
  'accordion-up': createAnimation('accordion-up', '0.3s'),

  // Collapsible animations
  'slide-down': createAnimation('slide-down', '0.3s'),
  'slide-up': createAnimation('slide-up', '0.3s'),

  // Entry animations
  'fade-in': createAnimation('fade-in', '0.5s'),
  'scale-in': createAnimation('scale-in', '0.3s'),
  'slide-up-fade': createAnimation('slide-up-fade', '0.6s'),
  'slide-down-in': createAnimation('slide-down-in', '0.6s', 'ease-in'),

  // Brand animations
  'pulse-gold': createAnimation('pulse-gold', '2s', 'infinite'),
  shimmer: createAnimation('shimmer', '2s', 'infinite'),
  'border-shimmer': createAnimation('border-shimmer', '2s', 'infinite'),

  // Feedback animations
  'input-pulse': createAnimation('input-pulse', '0.15s'),
  'pulse-gold-check': createAnimation('pulse-gold-check', '0.3s', 'ease-out'),
  'pulse-uncheck': createAnimation('pulse-uncheck', '0.3s', 'ease-out'),
};
