import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { useUserLinkedArtist } from '@/shared/hooks/useUserLinkedArtist';
import { cn } from '@/shared';

/**
 * Floating CTA pill for desktop that prompts local DJs to sign up for undercard slots.
 * Matches the mobile banner styling with gold frosted glass appearance.
 *
 * Features:
 * - Fixed position in top-right corner (desktop only)
 * - Subtle rise-up + fade-in animation on mount
 * - Hidden for users who already have a linked artist profile
 * - Navigates to /artists/signup on click
 */
export const FmFloatingUndercardCta = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { hasLinkedArtist } = useUserLinkedArtist();

  // Don't display for artists that are already signed up
  if (hasLinkedArtist) {
    return null;
  }

  return (
    <Button
      variant="default"
      onClick={() => navigate('/artists/signup')}
      className={cn(
        // Positioning - fixed top-right, desktop only
        'fixed top-[120px] right-[40px] z-40',
        'hidden lg:flex', // Only show on large screens

        // Gold frosted glass styling (matches mobile banner)
        'bg-fm-gold/20 backdrop-blur-sm border border-fm-gold',
        'text-fm-gold hover:bg-fm-gold hover:text-black',

        // Size and typography
        'text-sm py-2 px-4 h-auto',
        'rounded-none font-medium',

        // Transitions
        'transition-all duration-200',

        // Entrance animation - rise up + fade in
        'animate-in fade-in slide-in-from-bottom-2 duration-500',
        'delay-300' // Slight delay after page load
      )}
    >
      {t('artistUndercard.floatingCtaText')}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
};
