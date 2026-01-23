import { useMemo } from 'react';
import { History, Music } from 'lucide-react';
import type { MobileMessage } from '@/shared/types/mobileMessages';
import { MESSAGE_STYLES } from '@/shared/types/mobileMessages';

export interface UseMobileMessagesOptions {
  /** Whether user is currently viewing past events section */
  isViewingPastEvents: boolean;
  // Future: Add more contextual flags as needed
  // isLoggedIn?: boolean;
  // hasUnreadNotifications?: boolean;
}

/**
 * Message definitions with visibility rules
 */
interface MessageDefinition extends MobileMessage {
  /** Function to determine if message should be visible */
  isVisible: (options: UseMobileMessagesOptions) => boolean;
}

/**
 * All available messages with their visibility rules
 */
const MESSAGE_DEFINITIONS: MessageDefinition[] = [
  // Past Events - contextual, only when viewing past events
  {
    id: 'past-events',
    type: 'contextual',
    icon: History,
    textKey: 'mobileBanner.pastEvents',
    style: MESSAGE_STYLES.dark,
    priority: 1,
    isVisible: (options) => options.isViewingPastEvents,
  },
  // Artist Signup - persistent, always visible on mobile homepage
  {
    id: 'artist-signup',
    type: 'persistent',
    icon: Music,
    textKey: 'mobileBanner.artistSignup',
    style: MESSAGE_STYLES.gold,
    action: {
      type: 'navigate',
      target: '/artists/signup',
    },
    priority: 2,
    isVisible: () => true, // Always visible
  },
  // Future: Add promotional messages here
  // {
  //   id: 'merch-promo',
  //   type: 'promotional',
  //   icon: ShoppingBag,
  //   textKey: 'mobileBanner.merchPromo',
  //   style: MESSAGE_STYLES.crimson,
  //   action: { type: 'navigate', target: '/merch' },
  //   priority: 3,
  //   isVisible: (options) => options.isMerchEnabled,
  // },
];

/**
 * Hook that returns the currently visible mobile banner messages
 * Messages are filtered based on context and sorted by priority
 */
export function useMobileMessages(
  options: UseMobileMessagesOptions
): MobileMessage[] {
  return useMemo(() => {
    // Filter to only visible messages
    const visibleMessages = MESSAGE_DEFINITIONS.filter((msg) =>
      msg.isVisible(options)
    );

    // Sort by priority (lower number = shown first in rotation)
    visibleMessages.sort((a, b) => a.priority - b.priority);

    // Return without the isVisible function (not needed by consumer)
    return visibleMessages.map(({ isVisible: _, ...message }) => message);
  }, [options]);
}
