import { Instagram, Menu, SettingsIcon, ShoppingCart, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Breadcrumbs } from '@/components/primitives/Breadcrumbs';
import { ForceMajeureLogo } from './ForceMajeureLogo';
import { UserMenuDropdown } from '@/components/Navigation/UserMenuDropdown';
import { CheckoutCountdown } from '@/components/business/CheckoutCountdown';
import { Button } from '@/components/common/shadcn/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/common/shadcn/tooltip';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { SOCIAL_LINKS } from '@/shared/constants/socialLinks';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: role } = useUserRole();
  const { data: flags } = useFeatureFlags();
  const { isCheckoutActive, endCheckout, redirectUrl } = useCheckoutTimer();
  const isAdmin = role === 'admin';

  return <nav className='sticky top-0 z-50 w-full bg-background/50 backdrop-blur-md border-b border-border'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo and Breadcrumbs */}
          <div className='flex items-center'>
            <Link to='/' className='transition-transform duration-200 hover:scale-110'>
              <ForceMajeureLogo className='h-8 w-8' />
            </Link>
            <Breadcrumbs />
          </div>

          {/* Center Title or Countdown */}
          <div className='absolute left-1/2 transform -translate-x-1/2 hidden lg:block'>
            {flags?.event_checkout_timer && isCheckoutActive ? (
              <CheckoutCountdown onExpire={endCheckout} redirectUrl={redirectUrl} />
            ) : (
              <h2 className='font-fk-screamer text-sm'>
                <span className='text-white'>FORCE</span>{' '}
                <span className='text-fm-gold'>MAJEURE</span>
              </h2>
            )}
          </div>

          {/* Desktop Actions */}
          <div className='hidden md:flex items-center space-x-4'>
            {isAdmin && (
              <Button variant='ghost' size='sm' className='text-foreground hover:text-fm-gold hover:bg-hover-overlay' asChild>
                <Link to='/admin'>
                  <SettingsIcon className='h-4 w-4' />
                </Link>
              </Button>
            )}
            
            {/* Social and Shopping Icons */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href={SOCIAL_LINKS.instagram} target='_blank' rel='noopener noreferrer' className='text-foreground hover:text-fm-gold transition-colors duration-200' aria-label='Follow us on Instagram'>
                    <Instagram className='h-5 w-5' />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{SOCIAL_LINKS.instagramHandle}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {flags?.merch_store && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to='/merch' className='text-foreground hover:text-fm-gold transition-colors duration-200' aria-label='Shop Merch'>
                      <ShoppingCart className='h-5 w-5' />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shop Merch</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
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

          {/* Mobile menu button */}
          <div className='md:hidden flex items-center space-x-2'>
            {isAdmin && (
              <Button variant='ghost' size='sm' className='text-foreground hover:text-fm-gold hover:bg-hover-overlay' asChild>
                <Link to='/admin'>
                  <SettingsIcon className='h-4 w-4' />
                </Link>
              </Button>
            )}
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

            <Button variant='ghost' size='sm' onClick={() => setIsOpen(!isOpen)} className='text-foreground hover:text-fm-gold hover:bg-hover-overlay'>
              {isOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && <div className='md:hidden animate-slide-up'>
          <div className='px-2 pt-2 pb-3 space-y-1 bg-background border-b border-border'>
            <Link to='/merch' className='block px-3 py-2 text-base font-canela font-medium text-foreground hover:text-fm-gold hover:bg-hover-overlay rounded-md transition-colors' onClick={() => setIsOpen(false)}>
              Merchandise
            </Link>
          </div>
        </div>}
    </nav>;
};