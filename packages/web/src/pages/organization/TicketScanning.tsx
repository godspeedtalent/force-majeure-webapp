import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

import { Layout } from '@/components/layout/Layout';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonPageLayout } from '@/components/common/layout';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { toast } from 'sonner';
import { PERMISSIONS } from '@force-majeure/shared';
import { formatHeader } from '@force-majeure/shared';
import { supabase } from '@force-majeure/shared';
import { useScanStatistics } from '@/features/events/hooks/useScanStatistics';
import { logger } from '@force-majeure/shared';
import { QRScanner } from '@/components/ticketing/QRScanner';

const scanLogger = logger.createNamespace('TicketScanning');

interface ScanResult {
  success: boolean;
  message: string;
  ticketInfo?: {
    eventName: string;
    attendeeName: string;
    ticketType: string;
    checkedInAt?: string;
    venueName?: string;
  };
}

/**
 * TicketScanning - Ticket scanning page for organization staffers
 *
 * Features:
 * - QR code/barcode scanning
 * - Manual ticket lookup
 * - Scan history
 * - Real-time validation
 */
const TicketScanning = () => {
  const { hasPermission, roles } = useUserPermissions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticketCode, setTicketCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const isLoading = !roles;

  // Check for scanning permission
  const hasAccess = hasPermission(PERMISSIONS.SCAN_TICKETS);

  // Get real-time scan statistics
  const { data: stats, isLoading: statsLoading } = useScanStatistics({
    refreshInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate('/');
    }
  }, [isLoading, navigate, hasAccess]);

  const handleScan = async () => {
    if (!ticketCode.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a ticket code',
        variant: 'destructive',
      });
      return;
    }

    setScanning(true);

    try {
      // Call validation edge function
      const { data, error } = await supabase.functions.invoke('validate-ticket', {
        body: {
          qr_data: ticketCode.trim(),
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        },
      });

      if (error) {
        scanLogger.error('Error calling validation function', {
          error: error.message,
        });
        throw error;
      }

      const response = data as {
        valid: boolean;
        ticket?: {
          event_name: string;
          attendee_name: string | null;
          ticket_tier_name: string;
          venue_name: string;
          checked_in_at: string;
        };
        error?: string;
        reason?: string;
      };

      const result: ScanResult = {
        success: response.valid,
        message: response.valid
          ? 'Ticket validated successfully!'
          : response.error || 'Invalid ticket',
        ticketInfo: response.ticket
          ? {
              eventName: response.ticket.event_name,
              attendeeName: response.ticket.attendee_name || 'No name provided',
              ticketType: response.ticket.ticket_tier_name,
              venueName: response.ticket.venue_name,
              checkedInAt: new Date(response.ticket.checked_in_at).toLocaleString(),
            }
          : undefined,
      };

      setLastScan(result);
      setTicketCode('');

      toast({
        title: result.success ? 'Valid Ticket' : 'Invalid Ticket',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });

      scanLogger.info('Scan completed', {
        success: result.success,
        reason: response.reason,
      });
    } catch (error) {
      scanLogger.error('Validation error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });

      const result: ScanResult = {
        success: false,
        message: 'Failed to validate ticket. Please try again.',
      };

      setLastScan(result);

      toast({
        title: 'Validation Error',
        description: 'Unable to validate ticket. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <FmCommonPageLayout title='Scan Tickets'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <p className='text-muted-foreground'>Loading...</p>
          </div>
        </FmCommonPageLayout>
      </Layout>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <Layout>
      <FmCommonPageLayout
        title='Scan Tickets'
        subtitle='Scan and validate event tickets'
      >
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-[20px]'>
        {/* Scanner Card */}
        <FmCommonCard variant='outline' className='p-[20px]'>
          <div className='space-y-[20px]'>
            <div className='flex items-center gap-[10px]'>
              <div className='p-[10px] rounded-none bg-fm-gold/10 border border-fm-gold/20'>
                <Scan className='h-6 w-6 text-fm-gold' />
              </div>
              <div>
                <h3 className='text-lg font-canela'>
                  {formatHeader('scan ticket')}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Enter ticket code or use camera to scan
                </p>
              </div>
            </div>

            <div className='space-y-[20px]'>
              <div>
                <Label htmlFor='ticketCode' className='text-xs uppercase'>
                  TICKET CODE
                </Label>
                <Input
                  id='ticketCode'
                  value={ticketCode}
                  onChange={e => setTicketCode(e.target.value)}
                  placeholder='Enter ticket code or barcode'
                  className='font-mono'
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleScan();
                    }
                  }}
                />
              </div>

              <FmCommonButton
                onClick={handleScan}
                loading={scanning}
                disabled={scanning || !ticketCode.trim()}
                className='w-full'
              >
                {scanning ? 'Validating...' : 'Validate Ticket'}
              </FmCommonButton>

              <div className='text-center'>
                <FmCommonButton
                  variant='secondary'
                  size='sm'
                  onClick={() => setShowCamera(true)}
                  disabled={scanning}
                >
                  <Scan className='h-4 w-4 mr-2' />
                  Use Camera Scanner
                </FmCommonButton>
              </div>
            </div>
          </div>
        </FmCommonCard>

        {/* Last Scan Result Card */}
        <FmCommonCard variant='outline' className='p-[20px]'>
          <div className='space-y-[20px]'>
            <h3 className='text-lg font-canela'>
              {formatHeader('last scan result')}
            </h3>

            {lastScan ? (
              <div className='space-y-[20px]'>
                <div
                  className={`p-[20px] rounded-none border ${
                    lastScan.success
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className='flex items-start gap-[10px]'>
                    {lastScan.success ? (
                      <CheckCircle2 className='h-6 w-6 text-green-500 flex-shrink-0' />
                    ) : (
                      <XCircle className='h-6 w-6 text-red-500 flex-shrink-0' />
                    )}
                    <div>
                      <p
                        className={`font-medium ${
                          lastScan.success ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {lastScan.success ? 'Valid ticket' : 'Invalid ticket'}
                      </p>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {lastScan.message}
                      </p>
                    </div>
                  </div>
                </div>

                {lastScan.ticketInfo && (
                  <div className='space-y-[10px] p-[20px] bg-muted/30 rounded-none'>
                    <h4 className='text-sm font-medium text-foreground'>
                      Ticket details.
                    </h4>
                    <div className='space-y-1 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Event:</span>
                        <span className='text-foreground font-medium'>
                          {lastScan.ticketInfo.eventName}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Attendee:</span>
                        <span className='text-foreground font-medium'>
                          {lastScan.ticketInfo.attendeeName}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Type:</span>
                        <span className='text-foreground font-medium'>
                          {lastScan.ticketInfo.ticketType}
                        </span>
                      </div>
                      {lastScan.ticketInfo.venueName && (
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Venue:</span>
                          <span className='text-foreground font-medium'>
                            {lastScan.ticketInfo.venueName}
                          </span>
                        </div>
                      )}
                      {lastScan.ticketInfo.checkedInAt && (
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Checked In:</span>
                          <span className='text-foreground font-medium'>
                            {lastScan.ticketInfo.checkedInAt}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <AlertCircle className='h-12 w-12 text-muted-foreground/50 mb-3' />
                <p className='text-sm text-muted-foreground'>
                  No scans yet. Enter a ticket code to begin.
                </p>
              </div>
            )}
          </div>
        </FmCommonCard>
      </div>

      {/* Quick Stats */}
      <FmCommonCard variant='outline' className='p-[20px]'>
        <h3 className='text-lg font-canela mb-[20px]'>
          {formatHeader("today's statistics")}
        </h3>
        {statsLoading ? (
          <div className='text-center py-8 text-muted-foreground'>
            Loading statistics...
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-[20px]'>
            <div className='text-center p-[20px] bg-muted/30 rounded-none'>
              <p className='text-2xl font-canela text-fm-gold'>
                {stats?.uniqueTicketsScanned || 0}
              </p>
              <p className='text-sm text-muted-foreground'>Tickets scanned</p>
            </div>
            <div className='text-center p-[20px] bg-muted/30 rounded-none'>
              <p className='text-2xl font-canela text-green-500'>
                {stats?.successfulScans || 0}
              </p>
              <p className='text-sm text-muted-foreground'>Valid</p>
            </div>
            <div className='text-center p-[20px] bg-muted/30 rounded-none'>
              <p className='text-2xl font-canela text-red-500'>
                {(stats?.invalidScans || 0) + (stats?.duplicateScans || 0) + (stats?.rejectedScans || 0)}
              </p>
              <p className='text-sm text-muted-foreground'>Invalid</p>
            </div>
          </div>
        )}
      </FmCommonCard>

      {/* Camera Scanner Modal */}
      {showCamera && (
        <QRScanner
          onScan={(qrData) => {
            setShowCamera(false);
            setTicketCode(qrData);
            // Auto-trigger validation after scan
            setTimeout(() => {
              handleScan();
            }, 100);
          }}
          onClose={() => setShowCamera(false)}
          onError={(error) => {
            toast({
              title: 'Scanner Error',
              description: error,
              variant: 'destructive',
            });
          }}
        />
      )}
    </FmCommonPageLayout>
    </Layout>
  );
};

export default TicketScanning;
