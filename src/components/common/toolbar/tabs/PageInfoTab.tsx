import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileCode,
  Layout,
  Component,
  Route,
  Clock,
  Gauge,
  Eye,
  MousePointer,
  Copy,
  Check,
  ExternalLink,
  Hash,
  Layers,
  Box,
  Timer,
  Activity,
  Zap,
} from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { Badge } from '@/components/common/shadcn/badge';
import { Button } from '@/components/common/shadcn/button';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import {
  FmResponsiveGroupLayout,
  ResponsiveGroup,
} from '@/components/common/layout/FmResponsiveGroupLayout';
import { getPageType, getResourceId } from '@/features/analytics/utils/pageUtils';
import { cn } from '@/shared';

// Route to component mapping for common pages
const ROUTE_TO_COMPONENT_MAP: Record<string, { page: string; layout: string; file: string }> = {
  '/': { page: 'Index', layout: 'Layout', file: 'src/pages/Index.tsx' },
  '/auth': { page: 'Auth', layout: 'Layout', file: 'src/pages/Auth.tsx' },
  '/profile': { page: 'Profile', layout: 'Layout', file: 'src/pages/Profile.tsx' },
  '/profile/edit': { page: 'ProfileEdit', layout: 'Layout', file: 'src/pages/ProfileEdit.tsx' },
  '/orders': { page: 'Orders', layout: 'Layout', file: 'src/pages/Orders.tsx' },
  '/contact': { page: 'Contact', layout: 'Layout', file: 'src/pages/Contact.tsx' },
  '/merch': { page: 'Merch', layout: 'Layout', file: 'src/pages/Merch.tsx' },
  '/checkout/success': { page: 'CheckoutSuccess', layout: 'Layout', file: 'src/pages/CheckoutSuccess.tsx' },
  '/checkout/cancel': { page: 'CheckoutCancel', layout: 'Layout', file: 'src/pages/CheckoutCancel.tsx' },
  '/forgot-password': { page: 'ForgotPassword', layout: 'Layout', file: 'src/pages/ForgotPassword.tsx' },
  '/reset-password': { page: 'ResetPassword', layout: 'Layout', file: 'src/pages/ResetPassword.tsx' },
  '/scavenger': { page: 'Scavenger', layout: 'Layout', file: 'src/pages/Scavenger.tsx' },
  '/developer': { page: 'DeveloperHome', layout: 'Layout', file: 'src/pages/developer/DeveloperHome.tsx' },
  '/developer/documentation': { page: 'DeveloperDocumentation', layout: 'Layout', file: 'src/pages/developer/DeveloperDocumentation.tsx' },
  '/developer/ticket-flow': { page: 'TicketFlowTests', layout: 'Layout', file: 'src/pages/developer/TicketFlowTests.tsx' },
  '/developer/demo': { page: 'DemoIndex', layout: 'Layout', file: 'src/pages/demo/DemoIndex.tsx' },
  '/developer/demo/event-checkout': { page: 'EventCheckout', layout: 'Layout', file: 'src/pages/demo/EventCheckout.tsx' },
  '/developer/demo/email-template': { page: 'EmailTemplateDemo', layout: 'Layout', file: 'src/pages/demo/EmailTemplateDemo.tsx' },
  '/developer/demo/story-designer': { page: 'StoryDesigner', layout: 'Layout', file: 'src/pages/demo/StoryDesigner.tsx' },
  '/admin/statistics': { page: 'Statistics', layout: 'Layout', file: 'src/pages/admin/Statistics.tsx' },
  '/admin/products': { page: 'ProductsManagement', layout: 'Layout', file: 'src/pages/admin/ProductsManagement.tsx' },
  '/organization/tools': { page: 'OrganizationTools', layout: 'SidebarLayout', file: 'src/pages/organization/OrganizationTools.tsx' },
  '/organization/scanning': { page: 'TicketScanning', layout: 'Layout', file: 'src/pages/organization/TicketScanning.tsx' },
  '/testing': { page: 'TestingIndex', layout: 'Layout', file: 'src/pages/testing/TestingIndex.tsx' },
  '/testing/checkout-flow': { page: 'CheckoutFlowTests', layout: 'Layout', file: 'src/pages/testing/CheckoutFlowTests.tsx' },
  '/members/home': { page: 'MemberHome', layout: 'Layout', file: 'src/pages/members/MemberHome.tsx' },
  '/sonic-gauntlet': { page: 'SonicGauntlet', layout: 'Layout', file: 'src/pages/SonicGauntlet.tsx' },
  '/artists/signup': { page: 'ArtistSignup', layout: 'Layout', file: 'src/pages/artists/ArtistSignup.tsx' },
  '/artists/register': { page: 'ArtistRegister', layout: 'Layout', file: 'src/pages/artists/ArtistRegister.tsx' },
};

// Pattern-based route matching for dynamic routes
const DYNAMIC_ROUTE_PATTERNS: Array<{
  pattern: RegExp;
  getInfo: (match: RegExpMatchArray) => { page: string; layout: string; file: string };
}> = [
  {
    pattern: /^\/event\/([^/]+)$/,
    getInfo: () => ({ page: 'EventDetails', layout: 'Layout', file: 'src/pages/EventDetails.tsx' }),
  },
  {
    pattern: /^\/event\/([^/]+)\/tickets$/,
    getInfo: () => ({ page: 'EventTicketingPage', layout: 'Layout', file: 'src/pages/event/EventTicketingPage.tsx' }),
  },
  {
    pattern: /^\/event\/([^/]+)\/manage$/,
    getInfo: () => ({ page: 'EventManagement', layout: 'SideNavbarLayout', file: 'src/pages/EventManagement.tsx' }),
  },
  {
    pattern: /^\/venues\/([^/]+)$/,
    getInfo: () => ({ page: 'VenueDetails', layout: 'Layout', file: 'src/pages/venues/VenueDetails.tsx' }),
  },
  {
    pattern: /^\/venues\/([^/]+)\/manage$/,
    getInfo: () => ({ page: 'VenueManagement', layout: 'Layout', file: 'src/pages/venues/VenueManagement.tsx' }),
  },
  {
    pattern: /^\/artists\/([^/]+)$/,
    getInfo: () => ({ page: 'ArtistDetails', layout: 'Layout', file: 'src/pages/artists/ArtistDetails.tsx' }),
  },
  {
    pattern: /^\/artists\/([^/]+)\/manage$/,
    getInfo: () => ({ page: 'ArtistManagement', layout: 'Layout', file: 'src/pages/artists/ArtistManagement.tsx' }),
  },
  {
    pattern: /^\/recordings\/([^/]+)$/,
    getInfo: () => ({ page: 'RecordingDetails', layout: 'Layout', file: 'src/pages/recordings/RecordingDetails.tsx' }),
  },
  {
    pattern: /^\/admin\/users\/([^/]+)$/,
    getInfo: () => ({ page: 'UserDetails', layout: 'Layout', file: 'src/pages/admin/UserDetails.tsx' }),
  },
  {
    pattern: /^\/admin\/organizations\/([^/]+)$/,
    getInfo: () => ({ page: 'OrganizationDetails', layout: 'Layout', file: 'src/pages/admin/OrganizationDetails.tsx' }),
  },
  {
    pattern: /^\/admin\/galleries\/([^/]+)$/,
    getInfo: () => ({ page: 'GalleryManagement', layout: 'Layout', file: 'src/pages/admin/GalleryManagement.tsx' }),
  },
  {
    pattern: /^\/events\/create$/,
    getInfo: () => ({ page: 'CreateEvent', layout: 'Layout', file: 'src/pages/developer/database/CreateEvent.tsx' }),
  },
  {
    pattern: /^\/artists\/create$/,
    getInfo: () => ({ page: 'CreateArtist', layout: 'Layout', file: 'src/pages/developer/database/CreateArtist.tsx' }),
  },
  {
    pattern: /^\/venues\/create$/,
    getInfo: () => ({ page: 'CreateVenue', layout: 'Layout', file: 'src/pages/developer/database/CreateVenue.tsx' }),
  },
  {
    pattern: /^\/organizations\/create$/,
    getInfo: () => ({ page: 'CreateOrganization', layout: 'Layout', file: 'src/pages/developer/database/CreateOrganization.tsx' }),
  },
];

// Common FmCommon components used across the app
const COMMON_COMPONENTS = [
  'FmCommonButton',
  'FmCommonCard',
  'FmCommonTextField',
  'FmCommonLoadingSpinner',
  'FmCommonDataGrid',
  'FmCommonModal',
  'FmCommonContextMenu',
  'FmFormSectionHeader',
  'FmPortalTooltip',
  'FmCommonTab',
];

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  timeToInteractive: number | null;
  memoryUsed: number | null;
  memoryTotal: number | null;
}

interface CopyableValueProps {
  label: string;
  value: string;
  className?: string;
}

function CopyableValue({ label, value, className }: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group flex items-center gap-2', className)}>
      <span className='text-muted-foreground text-xs uppercase tracking-wider'>{label}:</span>
      <code className='text-sm font-mono text-white/80 bg-white/5 px-1.5 py-0.5 flex-1 truncate'>
        {value}
      </code>
      <FmPortalTooltip content={copied ? 'Copied!' : 'Copy'} side='left'>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={handleCopy}
        >
          {copied ? (
            <Check className='h-3 w-3 text-green-400' />
          ) : (
            <Copy className='h-3 w-3 text-muted-foreground' />
          )}
        </Button>
      </FmPortalTooltip>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, badge }: { icon: typeof FileCode; label: string; value: string; badge?: string }) {
  return (
    <div className='flex items-start gap-3 py-2'>
      <Icon className='h-4 w-4 text-fm-gold mt-0.5 shrink-0' />
      <div className='flex-1 min-w-0'>
        <div className='text-xs uppercase tracking-wider text-muted-foreground mb-0.5'>{label}</div>
        <div className='text-sm text-white/90 font-mono truncate'>{value}</div>
      </div>
      {badge && (
        <Badge variant='outline' className='text-xs border-white/20 text-white/60 shrink-0'>
          {badge}
        </Badge>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, rating }: {
  icon: typeof Gauge;
  label: string;
  value: string | number;
  unit?: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
}) {
  const ratingColors = {
    good: 'text-green-400 border-green-400/30',
    'needs-improvement': 'text-yellow-400 border-yellow-400/30',
    poor: 'text-red-400 border-red-400/30',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 bg-white/5 border border-white/10',
      rating && ratingColors[rating]
    )}>
      <Icon className='h-4 w-4 shrink-0' />
      <div className='flex-1 min-w-0'>
        <div className='text-xs uppercase tracking-wider text-muted-foreground'>{label}</div>
        <div className='text-lg font-mono'>
          {value}
          {unit && <span className='text-xs text-muted-foreground ml-1'>{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export function PageInfoTabContent() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const params = useParams();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [renderCount, setRenderCount] = useState(0);
  const [pageLoadTimestamp] = useState(() => Date.now());

  // Track render count
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, []);

  // Get performance metrics
  useEffect(() => {
    const getMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');

      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
      const lcp = lcpEntries[lcpEntries.length - 1] as PerformanceEntry | undefined;

      // Memory info (Chrome only)
      const memory = (performance as any).memory;

      setPerformanceMetrics({
        loadTime: navigation?.loadEventEnd - navigation?.startTime || 0,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.startTime || 0,
        firstContentfulPaint: fcp?.startTime || null,
        largestContentfulPaint: (lcp as any)?.startTime || null,
        timeToInteractive: navigation?.domInteractive - navigation?.startTime || null,
        memoryUsed: memory?.usedJSHeapSize || null,
        memoryTotal: memory?.totalJSHeapSize || null,
      });
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      getMetrics();
      return;
    } else {
      window.addEventListener('load', getMetrics);
      return () => window.removeEventListener('load', getMetrics);
    }
  }, [location.pathname]);

  // Get page component info
  const pageInfo = useMemo(() => {
    const pathname = location.pathname;

    // Check static routes first
    if (ROUTE_TO_COMPONENT_MAP[pathname]) {
      return ROUTE_TO_COMPONENT_MAP[pathname];
    }

    // Check dynamic route patterns
    for (const { pattern, getInfo } of DYNAMIC_ROUTE_PATTERNS) {
      const match = pathname.match(pattern);
      if (match) {
        return getInfo(match);
      }
    }

    // Default fallback
    return {
      page: 'Unknown',
      layout: 'Unknown',
      file: 'Unknown',
    };
  }, [location.pathname]);

  // Get page type from analytics utility
  const pageType = useMemo(() => getPageType(location.pathname), [location.pathname]);
  const resourceId = useMemo(() => getResourceId(location.pathname), [location.pathname]);

  // Get time on page
  const [timeOnPage, setTimeOnPage] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOnPage(Math.floor((Date.now() - pageLoadTimestamp) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [pageLoadTimestamp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getRating = (value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  };

  const groups: ResponsiveGroup[] = useMemo(() => [
    {
      id: 'route',
      title: t('pageInfo.routeInfo'),
      icon: Route,
      defaultExpanded: true,
      children: (
        <div className='space-y-2'>
          <CopyableValue label={t('pageInfo.path')} value={location.pathname} />
          {location.search && (
            <CopyableValue label={t('pageInfo.query')} value={location.search} />
          )}
          {location.hash && (
            <CopyableValue label={t('pageInfo.hash')} value={location.hash} />
          )}
          {Object.keys(params).length > 0 && (
            <div className='mt-3 pt-3 border-t border-white/10'>
              <div className='text-xs uppercase tracking-wider text-muted-foreground mb-2'>
                {t('pageInfo.routeParams')}
              </div>
              {Object.entries(params).map(([key, value]) => (
                <CopyableValue key={key} label={key} value={value || ''} className='mt-1' />
              ))}
            </div>
          )}
          <div className='mt-3 pt-3 border-t border-white/10'>
            <InfoRow icon={Hash} label={t('pageInfo.pageType')} value={pageType} />
            {resourceId && (
              <CopyableValue label={t('pageInfo.resourceId')} value={resourceId} className='mt-2' />
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'components',
      title: t('pageInfo.componentInfo'),
      icon: Component,
      defaultExpanded: true,
      children: (
        <div className='space-y-1'>
          <InfoRow
            icon={FileCode}
            label={t('pageInfo.pageComponent')}
            value={pageInfo.page}
            badge={pageInfo.page !== 'Unknown' ? 'TSX' : undefined}
          />
          <InfoRow
            icon={Layout}
            label={t('pageInfo.layoutComponent')}
            value={pageInfo.layout}
          />
          <div className='mt-3 pt-3 border-t border-white/10'>
            <CopyableValue label={t('pageInfo.filePath')} value={pageInfo.file} />
          </div>

          {/* Quick reference for common components */}
          <div className='mt-4 pt-3 border-t border-white/10'>
            <div className='text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2'>
              <Layers className='h-3 w-3' />
              {t('pageInfo.commonComponents')}
            </div>
            <div className='flex flex-wrap gap-1.5'>
              {COMMON_COMPONENTS.map(comp => (
                <Badge
                  key={comp}
                  variant='outline'
                  className='text-xs font-mono border-white/20 text-white/60 hover:text-fm-gold hover:border-fm-gold/50 cursor-default transition-colors'
                >
                  {comp}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'performance',
      title: t('pageInfo.performance'),
      icon: Gauge,
      defaultExpanded: false,
      children: (
        <div className='space-y-3'>
          {performanceMetrics ? (
            <>
              <div className='grid grid-cols-2 gap-2'>
                <MetricCard
                  icon={Timer}
                  label={t('pageInfo.loadTime')}
                  value={Math.round(performanceMetrics.loadTime)}
                  unit='ms'
                  rating={getRating(performanceMetrics.loadTime, { good: 1000, poor: 3000 })}
                />
                <MetricCard
                  icon={Activity}
                  label={t('pageInfo.domReady')}
                  value={Math.round(performanceMetrics.domContentLoaded)}
                  unit='ms'
                  rating={getRating(performanceMetrics.domContentLoaded, { good: 800, poor: 2000 })}
                />
              </div>

              {performanceMetrics.firstContentfulPaint !== null && (
                <MetricCard
                  icon={Eye}
                  label={t('pageInfo.fcp')}
                  value={Math.round(performanceMetrics.firstContentfulPaint)}
                  unit='ms'
                  rating={getRating(performanceMetrics.firstContentfulPaint, { good: 1800, poor: 3000 })}
                />
              )}

              {performanceMetrics.largestContentfulPaint !== null && (
                <MetricCard
                  icon={Box}
                  label={t('pageInfo.lcp')}
                  value={Math.round(performanceMetrics.largestContentfulPaint)}
                  unit='ms'
                  rating={getRating(performanceMetrics.largestContentfulPaint, { good: 2500, poor: 4000 })}
                />
              )}

              {performanceMetrics.memoryUsed !== null && performanceMetrics.memoryTotal !== null && (
                <div className='mt-3 pt-3 border-t border-white/10'>
                  <div className='text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2'>
                    <Zap className='h-3 w-3' />
                    {t('pageInfo.memory')}
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1 h-2 bg-white/10 overflow-hidden'>
                      <div
                        className='h-full bg-fm-gold/60'
                        style={{
                          width: `${(performanceMetrics.memoryUsed / performanceMetrics.memoryTotal) * 100}%`
                        }}
                      />
                    </div>
                    <span className='text-xs text-muted-foreground'>
                      {formatBytes(performanceMetrics.memoryUsed)} / {formatBytes(performanceMetrics.memoryTotal)}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className='text-sm text-muted-foreground text-center py-4'>
              {t('pageInfo.loadingMetrics')}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'session',
      title: t('pageInfo.sessionInfo'),
      icon: Clock,
      defaultExpanded: false,
      children: (
        <div className='space-y-3'>
          <div className='grid grid-cols-2 gap-2'>
            <MetricCard
              icon={Clock}
              label={t('pageInfo.timeOnPage')}
              value={formatTime(timeOnPage)}
            />
            <MetricCard
              icon={MousePointer}
              label={t('pageInfo.renderCount')}
              value={renderCount}
            />
          </div>

          <div className='mt-3 pt-3 border-t border-white/10 space-y-2'>
            <CopyableValue
              label={t('pageInfo.userAgent')}
              value={navigator.userAgent.substring(0, 60) + '...'}
            />
            <CopyableValue
              label={t('pageInfo.language')}
              value={navigator.language}
            />
            <CopyableValue
              label={t('pageInfo.screenSize')}
              value={`${window.innerWidth}x${window.innerHeight}`}
            />
          </div>
        </div>
      ),
    },
  ], [t, location, params, pageInfo, pageType, resourceId, performanceMetrics, timeOnPage, renderCount]);

  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <FmResponsiveGroupLayout groups={groups} />
    </div>
  );
}

export function PageInfoTabFooter() {
  const { t } = useTranslation('common');
  const location = useLocation();

  const handleOpenInVSCode = () => {
    const pageInfo = ROUTE_TO_COMPONENT_MAP[location.pathname];
    if (pageInfo?.file) {
      // VS Code URL scheme to open file
      window.open(`vscode://file/${window.location.origin.includes('localhost') ? process.cwd?.() || '' : ''}/${pageInfo.file}`, '_blank');
    }
  };

  const handleViewReactDevTools = () => {
    // This will open React DevTools if installed
    if (typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
      console.log('%c[Page Info] React DevTools detected. Open browser DevTools → Components tab', 'color: #61dafb; font-weight: bold;');
    }
  };

  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        size='sm'
        className='flex-1 border-white/20 hover:bg-white/10'
        onClick={handleOpenInVSCode}
      >
        <ExternalLink className='h-4 w-4 mr-2' />
        {t('pageInfo.openInEditor')}
      </Button>
      <Button
        variant='outline'
        size='sm'
        className='flex-1 border-white/20 hover:bg-white/10'
        onClick={handleViewReactDevTools}
      >
        <Component className='h-4 w-4 mr-2' />
        {t('pageInfo.reactDevTools')}
      </Button>
    </div>
  );
}