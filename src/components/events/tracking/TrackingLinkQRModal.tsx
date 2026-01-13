import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';

interface TrackingLinkQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkName: string;
  linkCode: string;
}

export function TrackingLinkQRModal({
  open,
  onOpenChange,
  linkName,
  linkCode,
}: TrackingLinkQRModalProps) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const trackingUrl = `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/track-link?code=${linkCode}`;

  useEffect(() => {
    if (open && canvasRef.current) {
      generateQRCode();
    }
  }, [open, linkCode]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    try {
      await QRCode.toCanvas(canvasRef.current, trackingUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // Also generate data URL for download
      const dataUrl = await QRCode.toDataURL(trackingUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${linkName.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(tToast('tracking.qrDownloaded'));
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob(resolve, 'image/png');
      });

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        toast.success(tToast('tracking.qrCopied'));
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      // Fallback: copy the data URL as text
      if (qrDataUrl) {
        await navigator.clipboard.writeText(qrDataUrl);
        setCopied(true);
        toast.success(tToast('tracking.qrCopied'));
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('tracking.qrCodeTitle')}
      description={t('tracking.qrCodeDescription', { name: linkName })}
    >
      <div className="flex flex-col items-center gap-6 py-4">
        {/* QR Code Display */}
        <div className="bg-white p-4 rounded-none">
          <canvas ref={canvasRef} />
        </div>

        {/* Link Info */}
        <div className="w-full text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('tracking.scanToVisit')}</p>
          <code className="text-xs bg-muted px-2 py-1 rounded break-all">
            /t/{linkCode}
          </code>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <FmCommonButton
            variant="secondary"
            icon={copied ? Check : Copy}
            onClick={handleCopyToClipboard}
          >
            {copied ? t('buttons.copied') : t('tracking.copyQr')}
          </FmCommonButton>
          <FmCommonButton
            variant="gold"
            icon={Download}
            onClick={handleDownload}
          >
            {t('tracking.downloadQr')}
          </FmCommonButton>
        </div>
      </div>
    </FmCommonModal>
  );
}
