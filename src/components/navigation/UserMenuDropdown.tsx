import { useState, type ReactNode } from 'react';
import { LogOut, User as UserIcon, Building2, Scan, Mail, Home, Settings, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/common/shadcn/button';
import {
  FmCommonDropdown,
  DropdownSection,
} from '@/components/common/forms/FmCommonDropdown';
import { FmUserAvatar } from '@/components/common/display/FmUserAvatar';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS, ROLES, FEATURE_FLAGS, useFeatureFlagHelpers } from '@/shared';
import { AdminLockIndicator } from '@/components/common/indicators';
import { useIsMobile } from '@/shared';
import { cn } from '@/shared';
import { useUserLinkedArtist } from '@/shared/hooks/useUserLinkedArtist';

interface MobileMenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  badge?: ReactNode;
  variant?: 'default' | 'muted';
}

interface MobileMenuSection {
  label?: string; // Optional section header
  items: MobileMenuItem[];
}

/**
 * User menu dropdown component for authenticated users
 * Shows fullscreen menu on mobile, dropdown on desktop
 */
export function UserMenuDropdown() {
  const { user, profile, signOut } = useAuth();
  const { hasPermission, hasRole } = useUserPermissions();
  const { isFeatureEnabled } = useFeatureFlagHelpers();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  // Organization tools feature flag
  const orgToolsEnabled = isFeatureEnabled(FEATURE_FLAGS.ORGANIZATION_TOOLS);
  // Org tools access: manage_organization permission AND feature flag
  const hasOrgToolsAccess = orgToolsEnabled && hasPermission(PERMISSIONS.MANAGE_ORGANIZATION);
  // Scanning access: scan_tickets permission AND feature flag
  const hasScanningAccess = orgToolsEnabled && hasPermission(PERMISSIONS.SCAN_TICKETS);
  // Any org access
  const hasAnyOrgAccess = hasOrgToolsAccess || hasScanningAccess;
  // Developer access
  const isDeveloper = hasRole(ROLES.DEVELOPER);
  // Artist access
  const isArtist = hasRole(ROLES.ARTIST);
  const { linkedArtist } = useUserLinkedArtist();

  // Desktop dropdown sections - grouped by category
  const dropdownSections: DropdownSection[] = [
    // Profile section (no header)
    {
      items: [
        {
          label: t('nav.profile'),
          icon: UserIcon,
          onClick: () => navigate('/profile'),
        },
        // Artist option - only shown for users with artist role and linked artist
        ...(isArtist && linkedArtist
          ? [
              {
                label: t('nav.artistProfile'),
                icon: Music,
                onClick: () => navigate(`/artists/${linkedArtist.id}`),
              },
            ]
          : []),
        {
          label: t('nav.accountSettings'),
          icon: Settings,
          onClick: () => navigate('/profile/edit'),
        },
      ],
    },
    // Organization section (only if user has access)
    ...(hasAnyOrgAccess
      ? [
          {
            label: t('nav.organization'),
            items: [
              ...(hasOrgToolsAccess
                ? [
                    {
                      label: t('nav.orgTools'),
                      icon: Building2,
                      onClick: () => navigate('/organization/tools'),
                      badge: <AdminLockIndicator position="inline" size="xs" tooltipText={t('nav.requiresAdminPermissions')} />,
                    },
                  ]
                : []),
              ...(hasScanningAccess
                ? [
                    {
                      label: t('nav.scanning'),
                      icon: Scan,
                      onClick: () => navigate('/organization/scanning'),
                      badge: <AdminLockIndicator position="inline" size="xs" tooltipText={t('nav.requiresScanningPermissions')} />,
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    // Developer section (only if user is developer)
    ...(isDeveloper
      ? [
          {
            label: t('nav.developer'),
            items: [
              {
                label: t('nav.developerHome'),
                icon: Home,
                onClick: () => navigate('/developer'),
                badge: <AdminLockIndicator position="inline" size="xs" tooltipText={t('nav.developerOnly')} />,
              },
            ],
          },
        ]
      : []),
    // Site section
    {
      label: t('nav.site'),
      items: [
        {
          label: t('nav.contactUs'),
          icon: Mail,
          onClick: () => navigate('/contact'),
        },
        {
          label: t('nav.signOut'),
          icon: LogOut,
          onClick: handleSignOut,
          variant: 'muted' as const,
        },
      ],
    },
  ];

  // Mobile menu sections - grouped by category
  const mobileMenuSections: MobileMenuSection[] = [
    // Profile section (no header) - Profile link is in the header user info area
    {
      items: [
        // Artist option - only shown for users with artist role and linked artist
        ...(isArtist && linkedArtist
          ? [
              {
                label: t('nav.artistProfile'),
                icon: Music,
                onClick: () => handleNavigate(`/artists/${linkedArtist.id}`),
              },
            ]
          : []),
        {
          label: t('nav.accountSettings'),
          icon: Settings,
          onClick: () => handleNavigate('/profile/edit'),
        },
      ],
    },
    // Organization section (only if user has access)
    ...(hasAnyOrgAccess
      ? [
          {
            label: t('nav.organization'),
            items: [
              ...(hasOrgToolsAccess
                ? [
                    {
                      label: t('nav.orgTools'),
                      icon: Building2,
                      onClick: () => handleNavigate('/organization/tools'),
                      badge: <AdminLockIndicator position="inline" size="xs" tooltipText={t('nav.requiresAdminPermissions')} />,
                    },
                  ]
                : []),
              ...(hasScanningAccess
                ? [
                    {
                      label: t('nav.scanning'),
                      icon: Scan,
                      onClick: () => handleNavigate('/organization/scanning'),
                      badge: <AdminLockIndicator position="inline" size="xs" tooltipText={t('nav.requiresScanningPermissions')} />,
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    // Developer section (only if user is developer)
    ...(isDeveloper
      ? [
          {
            label: t('nav.developer'),
            items: [
              {
                label: t('nav.developerHome'),
                icon: Home,
                onClick: () => handleNavigate('/developer'),
                badge: <AdminLockIndicator position="inline" size="xs" tooltipText={t('nav.developerOnly')} />,
              },
            ],
          },
        ]
      : []),
    // Site section
    {
      label: t('nav.site'),
      items: [
        {
          label: t('nav.contactUs'),
          icon: Mail,
          onClick: () => handleNavigate('/contact'),
        },
        {
          label: t('nav.signOut'),
          icon: LogOut,
          onClick: handleSignOut,
          variant: 'muted' as const,
        },
      ],
    },
  ];

  // Mobile: Custom fullscreen overlay menu
  if (isMobile) {
    let itemIndex = 0; // Track global item index for striping

    return (
      <>
        <Button
          variant='ghost'
          className='relative h-8 w-8 p-0 z-[101] hover:bg-transparent focus:bg-transparent group'
          onClick={() => setIsOpen(!isOpen)}
        >
          <FmUserAvatar
            avatarUrl={profile?.avatar_url}
            displayName={profile?.display_name || user?.user_metadata?.display_name}
            size='sm'
            className='transition-all duration-200 group-hover:ring-2 group-hover:ring-fm-gold group-hover:ring-offset-1 group-hover:ring-offset-background'
          />
        </Button>

        {/* Mobile Menu Overlay - slides down from below nav bar */}
        {isOpen && (
          <>
            {/* Gold border overlay on nav bar - slides up from bottom */}
            <div
              className='fixed top-0 left-0 h-16 z-[99] pointer-events-none border-l-[3px] border-l-fm-gold/60'
              style={{
                animation: 'borderSlideUp 200ms ease-out forwards',
              }}
            >
              <style>{`
                @keyframes borderSlideUp {
                  from {
                    clip-path: inset(100% 0 0 0);
                  }
                  to {
                    clip-path: inset(0 0 0 0);
                  }
                }
              `}</style>
            </div>

            <div
              className='fixed inset-0 top-16 z-[110] animate-in fade-in duration-200'
            >
              {/* Backdrop - only covers area below nav, click to close */}
              <div
                className='absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer'
                onClick={() => setIsOpen(false)}
              />

              {/* Menu Panel - expands down from nav bar */}
              <div
                className={cn(
                  'absolute top-0 left-0 right-0',
                  'bg-black/95 backdrop-blur-xl',
                  'border-b-2 border-white/20 border-l-[3px] border-l-fm-gold/60',
                  'shadow-lg shadow-black/50'
                )}
                style={{
                  transformOrigin: 'top',
                  animation: 'menuSlideDown 200ms ease-out forwards',
                }}
                onClick={e => e.stopPropagation()}
              >
                <style>{`
                  @keyframes menuSlideDown {
                    from {
                      opacity: 0;
                      transform: scaleY(0.8) translateY(-10px);
                    }
                    to {
                      opacity: 1;
                      transform: scaleY(1) translateY(0);
                    }
                  }
                `}</style>
              {/* Header with user info - clickable to profile */}
              <button
                onClick={() => handleNavigate('/profile')}
                className={cn(
                  'w-full flex items-center gap-[15px] p-[20px] border-b border-white/10',
                  'group cursor-pointer',
                  'hover:bg-fm-gold/10 active:bg-fm-gold/15',
                  'transition-all duration-200'
                )}
              >
                <FmUserAvatar
                  avatarUrl={profile?.avatar_url}
                  displayName={profile?.display_name || user?.user_metadata?.display_name}
                  size='md'
                  className='transition-all duration-200 group-hover:ring-2 group-hover:ring-fm-gold group-hover:ring-offset-1 group-hover:ring-offset-background'
                />
                <div className='text-left'>
                  <p className='font-canela font-medium text-white group-hover:text-fm-gold transition-colors duration-200'>
                    {profile?.display_name || user?.user_metadata?.display_name || t('nav.user')}
                  </p>
                  <p className='font-canela text-xs text-white/50'>
                    {user?.email}
                  </p>
                </div>
              </button>

              {/* Menu Sections */}
              <div className='p-[10px]'>
                {mobileMenuSections.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    {/* Section divider (before all sections except first) */}
                    {sectionIndex > 0 && (
                      <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-[10px]' />
                    )}

                    {/* Section header */}
                    {section.label && (
                      <div className='px-[15px] py-[8px]'>
                        <p className='font-canela text-[10px] uppercase tracking-[0.2em] text-fm-gold/70'>
                          {section.label}
                        </p>
                      </div>
                    )}

                    {/* Section items */}
                    {section.items.map((item, _itemIdx) => {
                      const currentIndex = itemIndex++;
                      const isEven = currentIndex % 2 === 0;
                      return (
                        <button
                          key={item.label}
                          onClick={item.onClick}
                          className={cn(
                            'w-full flex items-center gap-[15px] px-[15px] py-[12px] rounded-none my-0.5',
                            'group cursor-pointer relative',
                            // Use transparent backgrounds to let frosted glass show through
                            isEven ? 'bg-white/[0.02]' : 'bg-white/[0.06]',
                            'hover:bg-fm-gold/15 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20 hover:text-white',
                            'focus:bg-fm-gold/20 focus:scale-[1.02] focus:shadow-lg focus:shadow-fm-gold/20 focus:text-white',
                            'active:scale-[0.98] transition-all duration-300',
                            item.variant === 'muted' &&
                              'text-white/70 hover:bg-white/10 hover:shadow-white/10 focus:bg-white/15 focus:shadow-white/10 hover:text-white'
                          )}
                        >
                          <span className='transition-transform duration-300 group-hover:scale-110'>
                            <item.icon className='h-5 w-5' />
                          </span>
                          <span className='flex items-center flex-1 font-canela font-medium text-base'>
                            {item.label}
                            {item.badge && <span className='ml-auto'>{item.badge}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>
        )}
      </>
    );
  }

  // Desktop: Standard dropdown with sections
  return (
    <FmCommonDropdown
      trigger={
        <Button variant='ghost' className='relative h-8 w-8 p-0 hover:bg-transparent focus:bg-transparent group'>
          <FmUserAvatar
            avatarUrl={profile?.avatar_url}
            displayName={profile?.display_name || user?.user_metadata?.display_name}
            size='sm'
            className='transition-all duration-200 group-hover:ring-2 group-hover:ring-fm-gold group-hover:ring-offset-1 group-hover:ring-offset-background'
          />
        </Button>
      }
      sections={dropdownSections}
      hideChevron
    />
  );
}
