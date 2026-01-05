import { useTranslation } from 'react-i18next';
import { Home, Database, Mail } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCollapsibleGroupHeader } from '@/components/common/data/FmCollapsibleGroupHeader';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/common/shadcn/context-menu';

interface DevNavigationTabContentProps {
  onNavigate: (path: string) => void;
  isAdmin: boolean;
}

export function DevNavigationTabContent({ onNavigate, isAdmin: _isAdmin }: DevNavigationTabContentProps) {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <div className='flex flex-col gap-4'>
        {/* Core Section */}
        <FmCollapsibleGroupHeader title={t('devNavigation.core')} count={1}>
          <div className='flex flex-col gap-2'>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div>
                  <FmCommonButton
                    variant='default'
                    icon={Home}
                    iconPosition='left'
                    onClick={() => onNavigate('/developer')}
                    className='w-full justify-start'
                  >
                    {t('devNavigation.developerHome')}
                  </FmCommonButton>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className='bg-card border-border rounded-none w-40'>
                <ContextMenuItem
                  onClick={() => onNavigate('/developer')}
                  className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                >
                  {t('devNavigation.goTo')}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </FmCollapsibleGroupHeader>

        {/* Supabase Links Section */}
        <FmCollapsibleGroupHeader title={t('devNavigation.supabase')}>
          <div className='flex flex-col gap-2'>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div>
                  <FmCommonButton
                    variant='default'
                    icon={Database}
                    iconPosition='left'
                    onClick={() => {
                      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
                      if (supabaseUrl) {
                        const isLocal = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

                        if (isLocal) {
                          window.open('http://localhost:54323', '_blank');
                        } else if (projectId) {
                          window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank');
                        } else {
                          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
                          if (projectRef) {
                            window.open(`https://supabase.com/dashboard/project/${projectRef}`, '_blank');
                          }
                        }
                      }
                    }}
                    className='w-full justify-start'
                  >
                    {t('devNavigation.supabaseDashboard')}
                  </FmCommonButton>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className='bg-card border-border rounded-none w-40'>
                <ContextMenuItem
                  onClick={() => {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
                    if (supabaseUrl) {
                      const isLocal = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

                      if (isLocal) {
                        window.open('http://localhost:54323', '_blank');
                      } else if (projectId) {
                        window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank');
                      } else {
                        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
                        if (projectRef) {
                          window.open(`https://supabase.com/dashboard/project/${projectRef}`, '_blank');
                        }
                      }
                    }
                  }}
                  className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                >
                  {t('devNavigation.open')}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            {/* Mailpit link - only shown in dev environment */}
            {import.meta.env.VITE_ENVIRONMENT === 'dev' && (
              <FmCommonButton
                variant='default'
                icon={Mail}
                iconPosition='left'
                onClick={() => {
                  window.open('http://localhost:55324', '_blank');
                }}
                className='w-full justify-start'
              >
                {t('devNavigation.mailpit')}
              </FmCommonButton>
            )}
          </div>
        </FmCollapsibleGroupHeader>
      </div>
    </div>
  );
}
