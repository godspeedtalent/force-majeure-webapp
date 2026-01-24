/**
 * DemoToolsTab - Tab content for demo tools within DeveloperHome
 *
 * Displays a grid of available demo tools and testing utilities.
 * Converted from standalone DemoIndex page to embedded tab content.
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/common/shadcn/badge';
import {
  ShoppingCart,
  Mail,
  Music,
  Smartphone,
  ArrowRight,
  FlaskConical,
  ClipboardCheck,
  Square,
} from 'lucide-react';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import { formatHeader } from '@/shared';

interface DemoTool {
  title: string;
  description: string;
  path: string;
  icon: typeof ShoppingCart;
  category: string;
  status: string;
}

export function DemoToolsTab() {
  const { t } = useTranslation('common');

  // Sorted alphabetically by title
  const demos: DemoTool[] = [
    {
      title: t('demoIndex.artistSignup'),
      description: t('demoIndex.artistSignupDescription'),
      path: '/developer/demo/artist-signup',
      icon: Music,
      category: t('demoIndex.categoryArtistManagement'),
      status: 'Active',
    },
    {
      title: t('demoIndex.emailTemplate'),
      description: t('demoIndex.emailTemplateDescription'),
      path: '/developer/demo/email-template',
      icon: Mail,
      category: t('demoIndex.categoryCommunication'),
      status: 'Active',
    },
    {
      title: t('demoIndex.eventCheckout'),
      description: t('demoIndex.eventCheckoutDescription'),
      path: '/developer/demo/event-checkout',
      icon: ShoppingCart,
      category: t('demoIndex.categoryEcommerce'),
      status: 'Active',
    },
    {
      title: t('demoIndex.squareSpinners'),
      description: t('demoIndex.squareSpinnersDescription'),
      path: '/developer/demo/square-spinners',
      icon: Square,
      category: t('demoIndex.categoryDesign'),
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
    {
      title: t('developerIndex.ticketFlowTests'),
      description: t('developerIndex.ticketFlowTestsDescription'),
      path: '/developer/ticket-flow',
      icon: ClipboardCheck,
      category: t('demoIndex.categoryTesting'),
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-[20px]">
      <FmFormSectionHeader
        title={formatHeader(t('demoIndex.title'))}
        description={t('demoIndex.description')}
        icon={FlaskConical}
      />

      {/* Demo List */}
      <div className="space-y-4">
        {demos.map(demo => {
          const Icon = demo.icon;
          return (
            <Link key={demo.path} to={demo.path} className="block group">
              <div className="p-6 border border-border rounded-none bg-card hover:bg-accent/5 hover:border-fm-gold/50 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-fm-gold/10 rounded-none group-hover:bg-fm-gold/20 transition-colors">
                        <Icon className="h-5 w-5 text-fm-gold" />
                      </div>
                      <h2 className="text-2xl font-canela font-semibold group-hover:text-fm-gold transition-colors">
                        {demo.title}
                      </h2>
                      <Badge variant="outline" className="ml-auto">
                        {demo.category}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground pl-14">{demo.description}</p>
                    <div className="flex items-center gap-2 text-sm text-fm-gold pl-14 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>{t('demoIndex.openDemo')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="mt-12 p-4 bg-muted/50 rounded-none border border-border">
        <p className="text-sm text-muted-foreground text-center">{t('demoIndex.accessNote')}</p>
      </div>
    </div>
  );
}