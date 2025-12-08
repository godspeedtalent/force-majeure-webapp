import { Home, Shield, Database, Mail } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
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

export function DevNavigationTabContent({ onNavigate, isAdmin }: DevNavigationTabContentProps) {
  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <div className='flex flex-col gap-4'>
        {/* App Links Section */}
        <div className='flex flex-col gap-2'>
          {isAdmin && (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div>
                  <FmCommonButton
                    variant='default'
                    icon={Shield}
                    iconPosition='left'
                    onClick={() => onNavigate('/admin/controls')}
                    className='w-full justify-start'
                  >
                    Admin Controls
                  </FmCommonButton>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className='bg-card border-border rounded-none w-40'>
                <ContextMenuItem
                  onClick={() => onNavigate('/admin/controls')}
                  className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                >
                  Go to
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}
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
                  Developer Home
                </FmCommonButton>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className='bg-card border-border rounded-none w-40'>
              <ContextMenuItem
                onClick={() => onNavigate('/developer')}
                className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
              >
                Go to
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>

        {/* Supabase Links Section */}
        <FmCommonCollapsibleSection title='Supabase' defaultExpanded={true}>
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
                      if (supabaseUrl) {
                        const isLocal = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

                        if (isLocal) {
                          window.open('http://localhost:54323', '_blank');
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
                    Supabase Dashboard
                  </FmCommonButton>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className='bg-card border-border rounded-none w-40'>
                <ContextMenuItem
                  onClick={() => {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    if (supabaseUrl) {
                      const isLocal = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

                      if (isLocal) {
                        window.open('http://localhost:54323', '_blank');
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
                  Open
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
                Mailpit (Local Email)
              </FmCommonButton>
            )}
          </div>
        </FmCommonCollapsibleSection>
      </div>
    </div>
  );
}
