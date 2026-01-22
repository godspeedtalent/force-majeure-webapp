import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/common/shadcn/badge';
import { Code, ShoppingCart, Mail, Music, Smartphone, ArrowRight } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';

export default function DemoIndex() {
  const { t } = useTranslation('common');

  const demos = [
    {
      title: t('demoIndex.eventCheckout'),
      description: t('demoIndex.eventCheckoutDescription'),
      path: '/demo/event-checkout',
      icon: ShoppingCart,
      category: t('demoIndex.categoryEcommerce'),
      status: 'Active',
    },
    {
      title: t('demoIndex.emailTemplate'),
      description: t('demoIndex.emailTemplateDescription'),
      path: '/demo/email-template',
      icon: Mail,
      category: t('demoIndex.categoryCommunication'),
      status: 'Active',
    },
    {
      title: t('demoIndex.artistSignup'),
      description: t('demoIndex.artistSignupDescription'),
      path: '/developer/demo/artist-signup',
      icon: Music,
      category: t('demoIndex.categoryArtistManagement'),
      status: 'Active',
    },
    {
      title: t('demoIndex.storyDesigner'),
      description: t('demoIndex.storyDesignerDescription'),
      path: '/developer/demo/story-designer',
      icon: Smartphone,
      category: t('demoIndex.categorySocial'),
      status: 'Active',
    },
  ];

  return (
    <DemoLayout
      title={t('demoIndex.title')}
      description={t('demoIndex.description')}
      icon={Code}
    >
      {/* Demo List */}
      <div className='space-y-4'>
        {demos.map(demo => {
          const Icon = demo.icon;
          return (
            <Link key={demo.path} to={demo.path} className='block group'>
              <div className='p-6 border border-border rounded-none bg-card hover:bg-accent/5 hover:border-fm-gold/50 transition-all duration-200'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1 space-y-2'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 bg-fm-gold/10 rounded-none group-hover:bg-fm-gold/20 transition-colors'>
                        <Icon className='h-5 w-5 text-fm-gold' />
                      </div>
                      <h2 className='text-2xl font-canela font-semibold group-hover:text-fm-gold transition-colors'>
                        {demo.title}
                      </h2>
                      <Badge variant='outline' className='ml-auto'>
                        {demo.category}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground pl-14'>
                      {demo.description}
                    </p>
                    <div className='flex items-center gap-2 text-sm text-fm-gold pl-14 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <span>{t('demoIndex.openDemo')}</span>
                      <ArrowRight className='h-4 w-4' />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className='mt-12 p-4 bg-muted/50 rounded-none border border-border'>
        <p className='text-sm text-muted-foreground text-center'>
          {t('demoIndex.accessNote')}
        </p>
      </div>
    </DemoLayout>
  );
}
