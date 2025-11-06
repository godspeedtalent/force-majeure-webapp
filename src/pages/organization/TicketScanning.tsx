import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonPageLayout } from '@/components/common/layout';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useToast } from '@/shared/hooks/use-toast';
import { PERMISSIONS } from '@/shared/auth/permissions';

interface ScanResult {
  success: boolean;
  message: string;
  ticketInfo?: {
    eventName: string;
    attendeeName: string;
    ticketType: string;
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
  const isLoading = !roles;

  // Check for scanning permission
  const hasAccess = hasPermission(PERMISSIONS.SCAN_TICKETS);

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

    // Simulate ticket validation (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock response - replace with actual validation
    const isValid = Math.random() > 0.3;
    const result: ScanResult = {
      success: isValid,
      message: isValid 
        ? 'Ticket validated successfully!' 
        : 'Invalid ticket or already used',
      ticketInfo: isValid ? {
        eventName: 'Force Majeure - November 2025',
        attendeeName: 'John Doe',
        ticketType: 'General Admission',
      } : undefined,
    };

    setLastScan(result);
    setScanning(false);
    setTicketCode('');

    toast({
      title: result.success ? 'Valid Ticket' : 'Invalid Ticket',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  if (isLoading) {
    return (
      <FmCommonPageLayout title='Ticket Scanning'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </FmCommonPageLayout>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <FmCommonPageLayout 
      title='Ticket Scanning'
      subtitle='Scan and validate event tickets'
    >
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Scanner Card */}
        <FmCommonCard variant='outline' className='p-6'>
          <div className='space-y-6'>
            <div className='flex items-center gap-3'>
              <div className='p-3 rounded-lg bg-fm-gold/10 border border-fm-gold/20'>
                <Scan className='h-6 w-6 text-fm-gold' />
              </div>
              <div>
                <h3 className='text-lg font-canela'>Scan Ticket</h3>
                <p className='text-sm text-muted-foreground'>
                  Enter ticket code or use camera to scan
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              <div>
                <Label htmlFor='ticketCode'>Ticket Code</Label>
                <Input
                  id='ticketCode'
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder='Enter ticket code or barcode'
                  className='font-mono'
                  onKeyDown={(e) => {
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
                  onClick={() => {
                    toast({
                      title: 'Camera Scanner',
                      description: 'QR/Barcode camera scanner coming soon',
                    });
                  }}
                >
                  <Scan className='h-4 w-4 mr-2' />
                  Use Camera Scanner
                </FmCommonButton>
              </div>
            </div>
          </div>
        </FmCommonCard>

        {/* Last Scan Result Card */}
        <FmCommonCard variant='outline' className='p-6'>
          <div className='space-y-4'>
            <h3 className='text-lg font-canela'>Last Scan Result</h3>
            
            {lastScan ? (
              <div className='space-y-4'>
                <div className={`p-4 rounded-lg border ${
                  lastScan.success 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className='flex items-start gap-3'>
                    {lastScan.success ? (
                      <CheckCircle2 className='h-6 w-6 text-green-500 flex-shrink-0' />
                    ) : (
                      <XCircle className='h-6 w-6 text-red-500 flex-shrink-0' />
                    )}
                    <div>
                      <p className={`font-medium ${
                        lastScan.success ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {lastScan.success ? 'Valid Ticket' : 'Invalid Ticket'}
                      </p>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {lastScan.message}
                      </p>
                    </div>
                  </div>
                </div>

                {lastScan.ticketInfo && (
                  <div className='space-y-2 p-4 bg-muted/30 rounded-lg'>
                    <h4 className='text-sm font-medium text-foreground'>Ticket Details</h4>
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
      <FmCommonCard variant='outline' className='p-6'>
        <h3 className='text-lg font-canela mb-4'>Today's Statistics</h3>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='text-center p-4 bg-muted/30 rounded-lg'>
            <p className='text-2xl font-canela text-fm-gold'>0</p>
            <p className='text-sm text-muted-foreground'>Tickets Scanned</p>
          </div>
          <div className='text-center p-4 bg-muted/30 rounded-lg'>
            <p className='text-2xl font-canela text-green-500'>0</p>
            <p className='text-sm text-muted-foreground'>Valid</p>
          </div>
          <div className='text-center p-4 bg-muted/30 rounded-lg'>
            <p className='text-2xl font-canela text-red-500'>0</p>
            <p className='text-sm text-muted-foreground'>Invalid</p>
          </div>
        </div>
      </FmCommonCard>
    </FmCommonPageLayout>
  );
};

export default TicketScanning;
