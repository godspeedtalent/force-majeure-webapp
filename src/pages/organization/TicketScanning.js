import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Scan, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonPageLayout } from '@/components/common/layout';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { toast } from 'sonner';
import { PERMISSIONS } from '@/shared';
import { formatHeader } from '@/shared';
import { supabase } from '@/shared';
import { useScanStatistics } from '@/features/events/hooks/useScanStatistics';
import { logger } from '@/shared';
import { QRScanner } from '@/components/ticketing/QRScanner';
const scanLogger = logger.createNamespace('TicketScanning');
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
    const { t } = useTranslation('pages');
    const { hasPermission, roles } = useUserPermissions();
    const navigate = useNavigate();
    const [ticketCode, setTicketCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [lastScan, setLastScan] = useState(null);
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
            toast.error(t('ticketScanning.invalidInput'), {
                description: t('ticketScanning.pleaseEnterTicketCode'),
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
            const response = data;
            const result = {
                success: response.valid,
                message: response.valid
                    ? t('ticketScanning.ticketValidatedSuccess')
                    : response.error || t('ticketScanning.invalidTicket'),
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
            if (result.success) {
                toast.success(t('ticketScanning.validTicket'), {
                    description: result.message,
                });
            }
            else {
                toast.error(t('ticketScanning.invalidTicket'), {
                    description: result.message,
                });
            }
            scanLogger.info('Scan completed', {
                success: result.success,
                reason: response.reason,
            });
        }
        catch (error) {
            scanLogger.error('Validation error', {
                error: error instanceof Error ? error.message : 'Unknown',
            });
            const result = {
                success: false,
                message: t('ticketScanning.failedToValidate'),
            };
            setLastScan(result);
            toast.error(t('ticketScanning.validationError'), {
                description: t('ticketScanning.unableToValidate'),
            });
        }
        finally {
            setScanning(false);
        }
    };
    if (isLoading) {
        return (_jsx(Layout, { children: _jsx(FmCommonPageLayout, { title: t('ticketScanning.title'), children: _jsx("div", { className: 'flex items-center justify-center min-h-[400px]', children: _jsx("p", { className: 'text-muted-foreground', children: t('ticketScanning.loading') }) }) }) }));
    }
    if (!hasAccess) {
        return null;
    }
    return (_jsx(Layout, { children: _jsxs(FmCommonPageLayout, { title: t('ticketScanning.title'), subtitle: t('ticketScanning.subtitle'), children: [_jsxs("div", { className: 'grid grid-cols-1 lg:grid-cols-2 gap-[20px]', children: [_jsx(FmCommonCard, { variant: 'outline', className: 'p-[20px]', children: _jsxs("div", { className: 'space-y-[20px]', children: [_jsxs("div", { className: 'flex items-center gap-[10px]', children: [_jsx("div", { className: 'p-[10px] rounded-none bg-fm-gold/10 border border-fm-gold/20', children: _jsx(Scan, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { children: [_jsx("h3", { className: 'text-lg font-canela', children: formatHeader(t('ticketScanning.scanTicket')) }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('ticketScanning.enterCodeOrCamera') })] })] }), _jsxs("div", { className: 'space-y-[20px]', children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: 'ticketCode', className: 'text-xs uppercase', children: t('ticketScanning.ticketCode') }), _jsx(Input, { id: 'ticketCode', value: ticketCode, onChange: e => setTicketCode(e.target.value), placeholder: t('ticketScanning.ticketCodePlaceholder'), className: 'font-mono', onKeyDown: e => {
                                                            if (e.key === 'Enter') {
                                                                handleScan();
                                                            }
                                                        } })] }), _jsx(FmCommonButton, { onClick: handleScan, loading: scanning, disabled: scanning || !ticketCode.trim(), className: 'w-full', children: scanning ? t('ticketScanning.validating') : t('ticketScanning.validateTicket') }), _jsx("div", { className: 'text-center', children: _jsxs(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: () => setShowCamera(true), disabled: scanning, children: [_jsx(Scan, { className: 'h-4 w-4 mr-2' }), t('ticketScanning.useCameraScanner')] }) })] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'p-[20px]', children: _jsxs("div", { className: 'space-y-[20px]', children: [_jsx("h3", { className: 'text-lg font-canela', children: formatHeader(t('ticketScanning.lastScanResult')) }), lastScan ? (_jsxs("div", { className: 'space-y-[20px]', children: [_jsx("div", { className: `p-[20px] rounded-none border ${lastScan.success
                                                    ? 'bg-green-500/10 border-green-500/30'
                                                    : 'bg-red-500/10 border-red-500/30'}`, children: _jsxs("div", { className: 'flex items-start gap-[10px]', children: [lastScan.success ? (_jsx(CheckCircle2, { className: 'h-6 w-6 text-green-500 flex-shrink-0' })) : (_jsx(XCircle, { className: 'h-6 w-6 text-red-500 flex-shrink-0' })), _jsxs("div", { children: [_jsx("p", { className: `font-medium ${lastScan.success ? 'text-green-500' : 'text-red-500'}`, children: lastScan.success ? t('ticketScanning.validTicket') : t('ticketScanning.invalidTicket') }), _jsx("p", { className: 'text-sm text-muted-foreground mt-1', children: lastScan.message })] })] }) }), lastScan.ticketInfo && (_jsxs("div", { className: 'space-y-[10px] p-[20px] bg-muted/30 rounded-none', children: [_jsx("h4", { className: 'text-sm font-medium text-foreground', children: t('ticketScanning.ticketDetails') }), _jsxs("div", { className: 'space-y-1 text-sm', children: [_jsxs("div", { className: 'flex justify-between', children: [_jsxs("span", { className: 'text-muted-foreground', children: [t('ticketScanning.event'), ":"] }), _jsx("span", { className: 'text-foreground font-medium', children: lastScan.ticketInfo.eventName })] }), _jsxs("div", { className: 'flex justify-between', children: [_jsxs("span", { className: 'text-muted-foreground', children: [t('ticketScanning.attendee'), ":"] }), _jsx("span", { className: 'text-foreground font-medium', children: lastScan.ticketInfo.attendeeName })] }), _jsxs("div", { className: 'flex justify-between', children: [_jsxs("span", { className: 'text-muted-foreground', children: [t('ticketScanning.type'), ":"] }), _jsx("span", { className: 'text-foreground font-medium', children: lastScan.ticketInfo.ticketType })] }), lastScan.ticketInfo.venueName && (_jsxs("div", { className: 'flex justify-between', children: [_jsxs("span", { className: 'text-muted-foreground', children: [t('ticketScanning.venue'), ":"] }), _jsx("span", { className: 'text-foreground font-medium', children: lastScan.ticketInfo.venueName })] })), lastScan.ticketInfo.checkedInAt && (_jsxs("div", { className: 'flex justify-between', children: [_jsxs("span", { className: 'text-muted-foreground', children: [t('ticketScanning.checkedIn'), ":"] }), _jsx("span", { className: 'text-foreground font-medium', children: lastScan.ticketInfo.checkedInAt })] }))] })] }))] })) : (_jsxs("div", { className: 'flex flex-col items-center justify-center py-12 text-center', children: [_jsx(AlertCircle, { className: 'h-12 w-12 text-muted-foreground/50 mb-3' }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('ticketScanning.noScansYet') })] }))] }) })] }), _jsxs(FmCommonCard, { variant: 'outline', className: 'p-[20px]', children: [_jsx("h3", { className: 'text-lg font-canela mb-[20px]', children: formatHeader(t('ticketScanning.todayStatistics')) }), statsLoading ? (_jsx("div", { className: 'text-center py-8 text-muted-foreground', children: t('ticketScanning.loadingStatistics') })) : (_jsxs("div", { className: 'grid grid-cols-1 sm:grid-cols-3 gap-[20px]', children: [_jsxs("div", { className: 'text-center p-[20px] bg-muted/30 rounded-none', children: [_jsx("p", { className: 'text-2xl font-canela text-fm-gold', children: stats?.uniqueTicketsScanned || 0 }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('ticketScanning.ticketsScanned') })] }), _jsxs("div", { className: 'text-center p-[20px] bg-muted/30 rounded-none', children: [_jsx("p", { className: 'text-2xl font-canela text-green-500', children: stats?.successfulScans || 0 }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('ticketScanning.valid') })] }), _jsxs("div", { className: 'text-center p-[20px] bg-muted/30 rounded-none', children: [_jsx("p", { className: 'text-2xl font-canela text-red-500', children: (stats?.invalidScans || 0) + (stats?.duplicateScans || 0) + (stats?.rejectedScans || 0) }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('ticketScanning.invalid') })] })] }))] }), showCamera && (_jsx(QRScanner, { onScan: (qrData) => {
                        setShowCamera(false);
                        setTicketCode(qrData);
                        // Auto-trigger validation after scan
                        setTimeout(() => {
                            handleScan();
                        }, 100);
                    }, onClose: () => setShowCamera(false), onError: (error) => {
                        toast.error(t('ticketScanning.scannerError'), {
                            description: error,
                        });
                    } }))] }) }));
};
export default TicketScanning;
