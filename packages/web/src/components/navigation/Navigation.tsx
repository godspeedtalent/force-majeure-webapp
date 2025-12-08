import {
  Instagram,
  ShoppingCart,
  User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Breadcrumbs } from '@/components/primitives/Breadcrumbs';
import { ForceMajeureLogo } from './ForceMajeureLogo';
import { UserMenuDropdown } from '@/components/navigation/UserMenuDropdown';
import { CheckoutCountdown } from '@/components/business/CheckoutCountdown';
import { Button } from '@/components/common/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useFeatureFlagHelpers } from '@force-majeure/shared/hooks/useFeatureFlags';
import { FEATURE_FLAGS } from '@force-majeure/shared/config/featureFlags';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { SOCIAL_LINKS } from '@force-majeure/shared/constants/socialLinks';
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';

export const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFeatureEnabled } = useFeatureFlagHelpers();
  const { isCheckoutActive, endCheckout, redirectUrl } = useCheckoutTimer();

  return (
    <nav className='sticky top-0 z-50 w-full bg-background/50 backdrop-blur-md border-b border-border'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo and Breadcrumbs */}
          <div className='flex items-center'>
            <Link
              to='/'
              className='transition-transform duration-200 hover:scale-110'
            >
              <ForceMajeureLogo className='h-8 w-8' />
            </Link>
            <Breadcrumbs />
          </div>

          {/* Center Title or Countdown */}
          <div className='absolute left-1/2 transform -translate-x-1/2 hidden lg:block'>
            {isFeatureEnabled(FEATURE_FLAGS.EVENT_CHECKOUT_TIMER) &&
            isCheckoutActive ? (
              <CheckoutCountdown
                onExpire={endCheckout}
                redirectUrl={redirectUrl}
              />
            ) : (
              <h2 className='font-screamer text-xl'>
                <span className='text-white'>FORCE</span>{' '}
                <span className='text-fm-gold'>MAJEURE</span>
              </h2>
            )}
          </div>

          {/* Desktop Actions */}
          <div className='hidden md:flex items-center space-x-4'>
            {/* Social and Shopping Icons */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-foreground hover:text-fm-gold transition-colors duration-200'
                    aria-label='Follow us on Instagram'
                  >
                    <Instagram className='h-5 w-5' />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{SOCIAL_LINKS.instagramHandle}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <FeatureGuard feature={FEATURE_FLAGS.MERCH_STORE}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to='/merch'
                      className='text-foreground hover:text-fm-gold transition-colors duration-200'
                      aria-label='Shop Merch'
                    >
                      <ShoppingCart className='h-5 w-5' />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shop Merch</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FeatureGuard>

            {/* Vertical Divider */}
            <div className='h-6 w-px bg-border/50' />

            {user ? (
              <UserMenuDropdown />
            ) : (
              <Button
                variant='ghost'
                size='sm'
                className='text-foreground hover:text-fm-gold hover:bg-hover-overlay'
                onClick={() => navigate('/auth')}
              >
                <User className='h-4 w-4' />
              </Button>
            )}
          </div>

          {/* Mobile menu - user dropdown only */}
          <div className='md:hidden flex items-center'>
            {user ? (
              <UserMenuDropdown />
            ) : (
              <Button
                variant='ghost'
                size='sm'
                className='text-foreground hover:text-fm-gold hover:bg-hover-overlay'
                onClick={() => navigate('/auth')}
              >
                <User className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
