import { Instagram, LogIn, Menu, SettingsIcon, ShoppingCart, User, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ForceMajeureLogo } from '@/components/ForceMajeureLogo';
import { UserMenuDropdown } from '@/components/Navigation/UserMenuDropdown';
import { CheckoutCountdown } from '@/components/CheckoutCountdown';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useScrollPosition } from '@/shared/hooks/useScrollPosition';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { SCROLL_THRESHOLDS } from '@/shared/constants/scrollThresholds';
import { SOCIAL_LINKS } from '@/shared/constants/socialLinks';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const scrollY = useScrollPosition();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: role } = useUserRole();
  const { data: flags } = useFeatureFlags();
  const { isCheckoutActive, endCheckout, redirectUrl } = useCheckoutTimer();
  const isAdmin = role === 'admin';
  const isHomePage = location.pathname === '/';

  // Calculate opacity based on scroll - only on home page
  const navOpacity = isHomePage ? Math.min(1, scrollY / SCROLL_THRESHOLDS.CONTENT_FADE) : 1;
  return <nav className='sticky top-0 z-50 w-full bg-background/50 backdrop-blur-md border-b border-border transition-opacity duration-300' style={{
    opacity: navOpacity
  }}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo and Breadcrumbs */}
          <div className='flex items-center space-x-3'>
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
              <h2 className='font-canela text-white tracking-[0.15em] text-sm'>
                FORCE MAJEURE
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='text-foreground hover:text-fm-gold hover:bg-hover-overlay'>
                    <User className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56 bg-background border border-border shadow-lg z-50'>
                  <DropdownMenuItem className='cursor-pointer hover:bg-hover-overlay' onClick={() => navigate('/auth')}>
                    <LogIn className='mr-2 h-4 w-4' />
                    <span>Sign In</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className='cursor-pointer hover:bg-hover-overlay' onClick={() => navigate('/auth')}>
                    <UserPlus className='mr-2 h-4 w-4' />
                    <span>Sign Up</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='text-foreground hover:text-fm-gold hover:bg-hover-overlay'>
                    <User className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56 bg-background border border-border shadow-lg z-50'>
                  <DropdownMenuItem className='cursor-pointer hover:bg-hover-overlay' onClick={() => navigate('/auth')}>
                    <LogIn className='mr-2 h-4 w-4' />
                    <span>Sign In</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className='cursor-pointer hover:bg-hover-overlay' onClick={() => navigate('/auth')}>
                    <UserPlus className='mr-2 h-4 w-4' />
                    <span>Sign Up</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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