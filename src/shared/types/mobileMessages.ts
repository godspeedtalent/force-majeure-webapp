import { LucideIcon } from 'lucide-react';

/**
 * Message type categories for the mobile banner
 */
export type MobileMessageType = 'contextual' | 'persistent' | 'promotional';

/**
 * Styling configuration for a mobile message
 */
export interface MobileMessageStyle {
  /** Tailwind classes for background (e.g., 'bg-fm-gold/20', 'bg-black/60') */
  background: string;
  /** Text color classes (e.g., 'text-fm-gold', 'text-foreground') */
  text: string;
  /** Border classes (e.g., 'border-fm-gold/30', 'border-white/20') */
  border: string;
  /** Icon color override (defaults to text color if not specified) */
  icon?: string;
}

/**
 * Action to execute when a message is tapped
 */
export interface MobileMessageAction {
  /** Type of action */
  type: 'navigate' | 'link' | 'callback';
  /** Route path for navigate, URL for link, or callback identifier */
  target: string;
}

/**
 * A message to display in the mobile banner
 */
export interface MobileMessage {
  /** Unique identifier for the message */
  id: string;
  /** Category of message */
  type: MobileMessageType;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** i18n key for the message text */
  textKey: string;
  /** Per-message styling */
  style: MobileMessageStyle;
  /** Optional action when message is tapped */
  action?: MobileMessageAction;
  /** Priority for rotation order (higher = shown first) */
  priority: number;
}

/**
 * Predefined message styles
 */
export const MESSAGE_STYLES = {
  /** Gold frosted glass for CTAs like artist signup */
  gold: {
    background: 'bg-fm-gold/20',
    text: 'text-fm-gold',
    border: 'border-fm-gold/50',
    icon: 'text-fm-gold',
  } satisfies MobileMessageStyle,

  /** Dark frosted glass for contextual info like past events */
  dark: {
    background: 'bg-black/60',
    text: 'text-foreground',
    border: 'border-fm-gold/30',
    icon: 'text-fm-gold',
  } satisfies MobileMessageStyle,

  /** Crimson frosted glass for promotional messages */
  crimson: {
    background: 'bg-fm-crimson/20',
    text: 'text-foreground',
    border: 'border-fm-crimson/50',
    icon: 'text-fm-crimson',
  } satisfies MobileMessageStyle,
} as const;
