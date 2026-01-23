import { useTranslation } from 'react-i18next';
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
} from '@/components/common/shadcn/drawer';
import { cn } from '@/shared';
import { MobileDevToolId } from './useMobileDevTools';
import { DevNavigationTabContent } from '../tabs/DevNavigationTab';
import {
  DatabaseTabContent,
  DatabaseTabFooter,
} from '../tabs/DatabaseTab';
import { FeatureTogglesTabContent } from '../tabs/FeatureTogglesTab';
import { DevNotesTabContent } from '../tabs/DevNotesTab';
import { MockRoleTabContent } from '../tabs/MockRoleTab';
import { PageInfoTabContent, PageInfoTabFooter } from '../tabs/PageInfoTab';
import { ErrorLogTabContent, ErrorLogTabFooter } from '../tabs/ErrorLogTab';
import { AdminMessagesTabContent } from '../tabs/AdminMessagesTab';
import { CartTabContent } from '../tabs/CartTab';
import {
  ManageOrganizationTabContent,
  ScanTicketsTabContent,
} from '../tabs/OrganizationTab';
import { DemoModeTabContent } from '../tabs/DemoModeTab';
import { Button } from '@/components/common/shadcn/button';

interface FmMobileDevToolContentProps {
  toolId: MobileDevToolId | null;
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

/**
 * Nested drawer for displaying individual developer tool content
 * Full-screen (90vh) overlay with header (back/close buttons) and scrollable content
 * Reuses existing desktop tab content components
 */
export function FmMobileDevToolContent({
  toolId,
  open,
  onClose,
  isAdmin,
}: FmMobileDevToolContentProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const toolLabels: Record<MobileDevToolId, string> = {
    // Staff tools
    navigation: t('mobileDevTools.toolLabels.navigation'),
    notes: t('mobileDevTools.toolLabels.staffNotes'),
    // Developer tools
    pageInfo: t('mobileDevTools.toolLabels.pageInfo'),
    roles: t('mobileDevTools.toolLabels.roles'),
    demoMode: t('mobileDevTools.toolLabels.demoMode'),
    // Data & Config tools
    database: t('mobileDevTools.toolLabels.database'),
    features: t('mobileDevTools.toolLabels.features'),
    errorLogs: t('mobileDevTools.toolLabels.errorLogs'),
    // Admin tools
    adminMessages: t('mobileDevTools.toolLabels.adminMessages'),
    // User tools
    cart: t('mobileDevTools.toolLabels.cart'),
    // Organization tools
    orgDashboard: t('mobileDevTools.toolLabels.orgDashboard'),
    scanTickets: t('mobileDevTools.toolLabels.scanTickets'),
  };

  if (!toolId) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose(); // Close drawer after navigation
  };

  const renderContent = () => {
    switch (toolId) {
      // Staff tools
      case 'navigation':
        return (
          <DevNavigationTabContent
            onNavigate={handleNavigate}
            isAdmin={isAdmin}
          />
        );
      case 'notes':
        return <DevNotesTabContent />;

      // Developer tools
      case 'pageInfo':
        return (
          <>
            <PageInfoTabContent />
            <div className="mt-4">
              <PageInfoTabFooter />
            </div>
          </>
        );
      case 'roles':
        return <MockRoleTabContent />;
      case 'demoMode':
        return <DemoModeTabContent />;

      // Data & Config tools
      case 'database':
        return (
          <>
            <DatabaseTabContent />
            <div className="mt-4">
              <DatabaseTabFooter onNavigate={handleNavigate} />
            </div>
          </>
        );
      case 'features':
        return <FeatureTogglesTabContent />;
      case 'errorLogs':
        return (
          <>
            <ErrorLogTabContent />
            <div className="mt-4">
              <ErrorLogTabFooter />
            </div>
          </>
        );

      // Admin tools
      case 'adminMessages':
        return <AdminMessagesTabContent />;

      // User tools
      case 'cart':
        return <CartTabContent />;

      // Organization tools
      case 'orgDashboard':
        return <ManageOrganizationTabContent onNavigate={handleNavigate} />;
      case 'scanTickets':
        return <ScanTicketsTabContent onNavigate={handleNavigate} />;

      default:
        return (
          <div className="text-white/50 text-center">
            {t('mobileDevTools.toolNotFound')}
          </div>
        );
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent
        className={cn(
          // Background - frosted glass Level 3
          'bg-black/90 backdrop-blur-xl',
          // Border
          'border-t-2 border-white/20',
          // Rounded top corners
          'rounded-t-[20px]',
          // Full height - 90vh for immersive experience
          'h-[90vh]',
          // z-index - above main drawer
          'z-[80]',
          // Flex layout for header + content
          'flex flex-col'
        )}
      >
        {/* Header with Back and Close buttons */}
        <DrawerHeader
          className={cn(
            // Padding
            'p-[20px]',
            // Border bottom
            'border-b border-white/10',
            // Flex row for back | title | close layout
            'flex flex-row items-center justify-between',
            // Shrink to fit content
            'flex-shrink-0'
          )}
        >
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              'p-[10px]',
              'hover:bg-white/10',
              'text-white',
              'transition-all duration-200'
            )}
            aria-label={t('buttons.goBack')}
          >
            <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2} />
          </Button>

          {/* Title */}
          <h2 className="font-canela uppercase text-fm-gold text-base font-medium">
            {toolLabels[toolId]}
          </h2>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              'p-[10px]',
              'hover:bg-white/10',
              'text-white',
              'transition-all duration-200'
            )}
            aria-label={t('buttons.close')}
          >
            <X className="h-[20px] w-[20px]" strokeWidth={2} />
          </Button>
        </DrawerHeader>

        {/* Scrollable Content Area */}
        <div
          className={cn(
            // Scrolling
            'overflow-y-auto overflow-x-hidden',
            // Padding
            'p-[20px]',
            // Flex grow to fill space
            'flex-1',
            // Custom scrollbar styling
            'scrollbar-thin scrollbar-thumb-fm-gold/30 scrollbar-track-transparent'
          )}
        >
          {renderContent()}
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)] flex-shrink-0" />
      </DrawerContent>
    </Drawer>
  );
}
