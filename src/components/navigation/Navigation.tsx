import { useState } from 'react';
import {
  ArrowLeft,
  Instagram,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
import { cn, useIsMobile, FEATURE_FLAGS } from '@/shared';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { SOCIAL_LINKS } from '@/shared';
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';

export const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { isCheckoutActive, endCheckout, redirectUrl } = useCheckoutTimer();
  const { backButton } = useNavigation();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openSearch } = useGlobalSearch();

  const handleBackClick = () => {
    if (backButton.onClick) {
      backButton.onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full border-b transition-all duration-200',
        // When mobile menu is open, match the dropdown's frosted glass styling
        isMobile && isMobileMenuOpen
          ? 'bg-black/95 backdrop-blur-xl border-white/20 border-l-[3px] border-l-fm-gold/60'
          : 'bg-background/50 backdrop-blur-md border-border'
      )}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Back Button, Logo, and Breadcrumbs */}
          <div className='flex items-center'>
            {/* Back Button */}
            {backButton.show && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleBackClick}
                      className={cn(
                        'flex items-center gap-2 mr-3 px-3 py-1.5',
                        'text-foreground hover:text-fm-gold',
                        'border border-white/20 hover:border-fm-gold/50',
                        'bg-black/40 hover:bg-black/60 backdrop-blur-sm',
                        'transition-all duration-200',
                        'rounded-none'
                      )}
                    >
                      <ArrowLeft className='h-4 w-4' />
                      {backButton.label && (
                        <span className='text-sm hidden sm:inline'>
                          {backButton.label}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{backButton.label || t('buttons.back')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

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
            {isCheckoutActive ? (
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
                    aria-label={t('nav.followOnInstagram')}
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
                      aria-label={t('nav.shopMerch')}
                    >
                      <ShoppingCart className='h-5 w-5' />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('nav.shopMerch')}</p>
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

          {/* Mobile menu - search and user dropdown */}
          <div className='md:hidden flex items-center gap-2'>
            <FeatureGuard feature={FEATURE_FLAGS.GLOBAL_SEARCH}>
              <Button
                variant='ghost'
                size='sm'
                className='text-foreground hover:text-fm-gold hover:bg-hover-overlay'
                onClick={openSearch}
                aria-label={t('buttons.search')}
              >
                <Search className='h-5 w-5' />
              </Button>
            </FeatureGuard>
            {user ? (
              <UserMenuDropdown onOpenChange={setIsMobileMenuOpen} />
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
