import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * QRScanner Component
 *
 * Camera-based QR code scanner with Force Majeure design system styling.
 * Uses html5-qrcode library for cross-platform compatibility.
 *
 * Features:
 * - Rear camera preference for mobile devices
 * - Gold border overlay matching design system
 * - Error handling and permission management
 * - Auto-stop on successful scan
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { logger } from '@/shared';
const scannerLogger = logger.createNamespace('QRScanner');
/**
 * QRScanner component for scanning QR codes with device camera
 */
export const QRScanner = ({ onScan, onClose, onError, }) => {
    const { t } = useTranslation('common');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const elementId = 'qr-scanner-region';
    useEffect(() => {
        startScanner();
        return () => {
            stopScanner();
        };
    }, []);
    const startScanner = async () => {
        try {
            setIsScanning(true);
            setError(null);
            // Create scanner instance
            const scanner = new Html5Qrcode(elementId);
            scannerRef.current = scanner;
            // Get available cameras
            const devices = await Html5Qrcode.getCameras();
            if (!devices || devices.length === 0) {
                throw new Error(t('qrScanner.noCamerasFound'));
            }
            // Prefer rear camera (environment-facing)
            const rearCamera = devices.find(device => device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('environment'));
            const cameraId = rearCamera ? rearCamera.id : devices[0].id;
            scannerLogger.info('Starting camera scanner', {
                cameraId,
                cameraLabel: rearCamera?.label || devices[0].label,
            });
            // Start scanning
            await scanner.start(cameraId, {
                fps: 10, // Frames per second
                qrbox: { width: 250, height: 250 }, // Scanning box size
            }, (decodedText, _decodedResult) => {
                scannerLogger.info('QR code scanned successfully', {
                    length: decodedText.length,
                });
                // Stop scanner before calling callback
                stopScanner();
                // Call parent callback
                onScan(decodedText);
            }, (_errorMessage) => {
                // Scanning errors are frequent (no QR in view), don't log them
                // Only log if it's a permission or initialization error
            });
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to start camera';
            scannerLogger.error('Error starting scanner', {
                error: errorMessage,
            });
            setError(errorMessage);
            setIsScanning(false);
            if (onError) {
                onError(errorMessage);
            }
        }
    };
    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                const scanner = scannerRef.current;
                // Check if scanner is running before stopping
                if (scanner.getState() === 2) {
                    // 2 = Html5QrcodeScannerState.SCANNING
                    await scanner.stop();
                }
                await scanner.clear();
                scannerRef.current = null;
                scannerLogger.info('Scanner stopped');
            }
            catch (err) {
                scannerLogger.error('Error stopping scanner', {
                    error: err instanceof Error ? err.message : 'Unknown',
                });
            }
        }
        setIsScanning(false);
    };
    const handleClose = () => {
        stopScanner();
        onClose();
    };
    return (_jsx("div", { className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm', children: _jsxs("div", { className: 'relative w-full max-w-md mx-4', children: [_jsx("div", { className: 'absolute -top-12 right-0 z-10', children: _jsxs(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: handleClose, className: 'bg-black/60 backdrop-blur-sm', children: [_jsx(X, { className: 'h-4 w-4 mr-2' }), t('buttons.close')] }) }), _jsxs("div", { className: 'relative bg-black border-2 border-fm-gold rounded-none overflow-hidden', children: [_jsxs("div", { className: 'p-4 bg-black/80 backdrop-blur-sm border-b border-fm-gold/30', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Camera, { className: 'h-5 w-5 text-fm-gold' }), _jsx("h3", { className: 'text-lg font-canela text-fm-gold', children: t('qrScanner.scanQRCode') })] }), _jsx("p", { className: 'text-sm text-muted-foreground mt-1', children: t('qrScanner.positionQRCode') })] }), _jsxs("div", { className: 'relative', children: [_jsx("div", { id: elementId, className: 'w-full', style: { minHeight: '300px' } }), isScanning && !error && (_jsxs("div", { className: 'absolute inset-0 pointer-events-none', children: [_jsx("div", { className: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-fm-gold' }), _jsx("div", { className: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 border border-fm-gold/30' })] }))] }), error && (_jsxs("div", { className: 'p-6 bg-red-500/10 border-t border-red-500/30', children: [_jsx("p", { className: 'text-sm text-red-500 text-center', children: error }), _jsxs("div", { className: 'mt-4 flex justify-center gap-2', children: [_jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: startScanner, children: t('buttons.retry') }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: handleClose, children: t('buttons.cancel') })] })] })), isScanning && !error && (_jsx("div", { className: 'p-4 bg-black/60 backdrop-blur-sm border-t border-fm-gold/30', children: _jsx("p", { className: 'text-xs text-center text-muted-foreground', children: t('qrScanner.pointCamera') }) }))] })] }) }));
};
