import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, LucideIcon } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { Separator } from '@/components/common/shadcn/separator';
import { format } from 'date-fns';
import { cn } from '@/shared';

export interface FmCommonDetailPageLayoutProps {
  /** Entity title (e.g., "Artist Name") */
  title: string;
  /** Subtitle for the page (e.g., "Artist Details") */
  subtitle?: string;
  /** Icon to display next to the title */
  icon?: LucideIcon;
  /** Entity ID for metadata display */
  entityId?: string;
  /** ID label (e.g., "Artist ID", "Venue ID") */
  idLabel?: string;
  /** Creation date */
  createdAt?: string | Date | null;
  /** Last updated date */
  updatedAt?: string | Date | null;
  /** Main content (left column) */
  children: ReactNode;
  /** Additional sidebar content (above metadata) */
  sidebarContent?: ReactNode;
  /** Action buttons for the actions card */
  actions?: ReactNode;
  /** Back button handler (defaults to navigate(-1)) */
  onBack?: () => void;
  /** Hide the back button */
  hideBackButton?: boolean;
  /** Hide the metadata card */
  hideMetadata?: boolean;
  /** Hide the actions card */
  hideActions?: boolean;
  /** Additional header content (e.g., status badges) */
  headerContent?: ReactNode;
  /** Custom width class (defaults to 'w-full lg:w-[70%]') */
  widthClass?: string;
  /** Additional className for the container */
  className?: string;
}

/**
 * Standardized detail page layout with:
 * - Header with back button, icon, title, and subtitle
 * - 2-column layout (main content + sidebar)
 * - Metadata card with ID, created, and updated dates
 * - Actions card
 *
 * Reduces ~50 lines of boilerplate per detail page.
 *
 * @example
 * ```tsx
 * <FmCommonDetailPageLayout
 *   title={venue.name}
 *   subtitle={t('adminDetails.venueDetails')}
 *   icon={MapPin}
 *   entityId={venue.id}
 *   idLabel={t('adminDetails.venueId')}
 *   createdAt={venue.created_at}
 *   updatedAt={venue.updated_at}
 *   actions={
 *     <Button onClick={() => navigate('/admin/venues')}>
 *       {t('adminDetails.backToVenuesList')}
 *     </Button>
 *   }
 * >
 *   <FmCommonCard>
 *     <FmCommonCardHeader>
 *       <FmCommonCardTitle>Basic Information</FmCommonCardTitle>
 *     </FmCommonCardHeader>
 *     <FmCommonCardContent>
 *       {/* Your custom content *\/}
 *     </FmCommonCardContent>
 *   </FmCommonCard>
 * </FmCommonDetailPageLayout>
 * ```
 */
export const FmCommonDetailPageLayout = ({
  title,
  subtitle,
  icon: Icon,
  entityId,
  idLabel,
  createdAt,
  updatedAt,
  children,
  sidebarContent,
  actions,
  onBack,
  hideBackButton = false,
  hideMetadata = false,
  hideActions = false,
  headerContent,
  widthClass = 'w-full lg:w-[70%]',
  className,
}: FmCommonDetailPageLayoutProps) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const handleBack = onBack || (() => navigate(-1));

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return null;
    try {
      return format(new Date(date), 'PPP');
    } catch {
      return null;
    }
  };

  const showMetadata = !hideMetadata && (entityId || createdAt || updatedAt);
  const showActions = !hideActions && actions;
  const showSidebar = sidebarContent || showMetadata || showActions;

  return (
    <div className={cn(widthClass, 'mx-auto py-8 px-4 space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          {!hideBackButton && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleBack}
              className='border-white/20 hover:bg-white/10'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              {t('buttons.back')}
            </Button>
          )}
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-3'>
              {Icon && <Icon className='h-8 w-8 text-fm-gold' />}
              {title}
            </h1>
            {subtitle && (
              <p className='text-muted-foreground mt-1'>{subtitle}</p>
            )}
          </div>
        </div>
        {headerContent}
      </div>

      <Separator />

      {/* Main Content */}
      {showSidebar ? (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Left Column - Main Content */}
          <div className='md:col-span-2 space-y-6'>{children}</div>

          {/* Right Column - Sidebar */}
          <div className='space-y-6'>
            {sidebarContent}

            {/* Metadata Card */}
            {showMetadata && (
              <FmCommonCard>
                <FmCommonCardHeader>
                  <FmCommonCardTitle>{t('adminDetails.metadata')}</FmCommonCardTitle>
                </FmCommonCardHeader>
                <FmCommonCardContent className='space-y-3'>
                  {entityId && (
                    <div>
                      <label className='text-sm text-muted-foreground'>
                        {idLabel || t('adminDetails.entityId')}
                      </label>
                      <p className='font-mono text-sm'>{entityId}</p>
                    </div>
                  )}

                  {createdAt && formatDate(createdAt) && (
                    <div>
                      <label className='text-sm text-muted-foreground flex items-center gap-2'>
                        <Calendar className='h-4 w-4' />
                        {t('adminDetails.created')}
                      </label>
                      <p className='text-sm'>{formatDate(createdAt)}</p>
                    </div>
                  )}

                  {updatedAt && formatDate(updatedAt) && (
                    <div>
                      <label className='text-sm text-muted-foreground flex items-center gap-2'>
                        <Calendar className='h-4 w-4' />
                        {t('adminDetails.lastUpdated')}
                      </label>
                      <p className='text-sm'>{formatDate(updatedAt)}</p>
                    </div>
                  )}
                </FmCommonCardContent>
              </FmCommonCard>
            )}

            {/* Actions Card */}
            {showActions && (
              <FmCommonCard>
                <FmCommonCardHeader>
                  <FmCommonCardTitle>{t('adminDetails.actions')}</FmCommonCardTitle>
                </FmCommonCardHeader>
                <FmCommonCardContent className='space-y-2'>
                  {actions}
                </FmCommonCardContent>
              </FmCommonCard>
            )}
          </div>
        </div>
      ) : (
        // No sidebar - full width content
        <div className='space-y-6'>{children}</div>
      )}
    </div>
  );
};

FmCommonDetailPageLayout.displayName = 'FmCommonDetailPageLayout';
