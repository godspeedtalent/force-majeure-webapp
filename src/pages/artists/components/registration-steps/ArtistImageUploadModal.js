import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
/**
 * Modal for uploading artist profile and press images
 * Uses FmFlexibleImageUpload with Supabase Storage integration
 */
export function ArtistImageUploadModal({ open, onOpenChange, label, value, onUpload, isPrimary = false, }) {
    const { t } = useTranslation('common');
    const handleImageChange = (url) => {
        onUpload(url);
        if (url) {
            // Close modal after successful upload
            onOpenChange(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-white/20', children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: 'font-canela text-xl flex items-center justify-between', children: [label, _jsx("button", { type: 'button', onClick: () => onOpenChange(false), className: 'rounded-none p-1 hover:bg-white/10 transition-colors', children: _jsx(X, { className: 'h-4 w-4' }) })] }) }), _jsx("div", { className: 'py-4', children: _jsx(FmFlexibleImageUpload, { value: value, onChange: handleImageChange, label: label, bucket: 'artist-images', pathPrefix: 'registrations', isPrimary: isPrimary }) }), _jsx("p", { className: 'text-xs text-muted-foreground font-canela', children: t('upload.supportedFormats') })] }) }));
}
