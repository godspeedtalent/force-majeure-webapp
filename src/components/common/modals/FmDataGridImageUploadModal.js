import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { toast } from 'sonner';
import { supabase } from '@/shared';
import { cn } from '@/shared';
import { compressImage } from '@/shared';
/**
 * FmDataGridImageUploadModal
 *
 * Modal for uploading images in data grid cells.
 * - Max resolution: 500x500px
 * - Saves to Supabase Storage
 * - Returns public URL for database update
 * - No URL input - file upload only
 */
export function FmDataGridImageUploadModal({ open, onOpenChange, currentImageUrl, entityName = 'Entity', onImageUploaded, bucket = 'entity-images', storagePath, }) {
    const { t } = useTranslation('common');
    const [selectedFile, setSelectedFile] = React.useState(null);
    const [preview, setPreview] = React.useState(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef(null);
    // Reset state when modal closes
    React.useEffect(() => {
        if (!open) {
            setSelectedFile(null);
            setPreview(null);
            setIsDragging(false);
        }
    }, [open]);
    const handleFileSelect = async (file) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error(t('imageUpload.invalidFileType'), {
                description: t('imageUpload.invalidFileTypeDescription'),
            });
            return;
        }
        try {
            // Compress and resize image automatically
            const processedFile = await compressImage(file, {
                maxWidth: 500,
                maxHeight: 500,
                maxSizeBytes: 5 * 1024 * 1024, // 5MB
                quality: 0.85,
            });
            setSelectedFile(processedFile);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(processedFile);
        }
        catch (error) {
            logger.error('Error processing image:', { error });
            toast.error(t('imageUpload.processingFailed'), {
                description: t('imageUpload.tryDifferentImage'),
            });
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = () => {
        setIsDragging(false);
    };
    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error(t('imageUpload.noFileSelected'), {
                description: t('imageUpload.pleaseSelectImage'),
            });
            return;
        }
        setIsUploading(true);
        try {
            // Generate unique filename
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;
            // Construct storage path
            const fullPath = storagePath
                ? `${storagePath}/${fileName}`
                : `misc/${fileName}`;
            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fullPath, selectedFile, {
                cacheControl: '3600',
                upsert: false,
            });
            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }
            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fullPath);
            if (!urlData?.publicUrl) {
                throw new Error('Failed to get public URL.');
            }
            toast.success(t('imageUpload.uploaded'), {
                description: t('imageUpload.uploadedSuccessfully'),
            });
            // Call the callback with new URL
            onImageUploaded(urlData.publicUrl);
            onOpenChange(false);
        }
        catch (error) {
            logger.error('Upload error:', error);
            toast.error(t('imageUpload.uploadFailed'), {
                description: error.message || t('imageUpload.failedToUpload'),
            });
        }
        finally {
            setIsUploading(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, modal: true, children: _jsxs(DialogContent, { className: 'sm:max-w-[500px] bg-black/90 backdrop-blur-md border border-white/20', onPointerDownOutside: (e) => {
                // Prevent closing when clicking outside if uploading
                if (isUploading) {
                    e.preventDefault();
                }
            }, onEscapeKeyDown: (e) => {
                // Prevent closing with Escape if uploading
                if (isUploading) {
                    e.preventDefault();
                }
            }, children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { className: 'text-fm-gold', children: t('imageUpload.uploadImageFor', { entityName }) }) }), _jsxs("div", { className: 'space-y-[20px] py-[20px]', children: [currentImageUrl && !preview && (_jsxs("div", { className: 'space-y-[10px]', children: [_jsx("p", { className: 'text-sm text-white/70', children: t('imageUpload.currentImage') }), _jsx("div", { className: 'flex items-center justify-center bg-black/20 border border-white/20 p-[10px]', children: _jsx("img", { src: currentImageUrl, alt: 'Current', className: 'max-w-full max-h-[300px] object-contain' }) })] })), _jsx("div", { onDrop: handleDrop, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onClick: () => fileInputRef.current?.click(), className: cn('border-2 border-dashed rounded-none p-[40px]', 'flex flex-col items-center justify-center gap-[20px]', 'cursor-pointer transition-all', isDragging
                                ? 'border-fm-gold bg-fm-gold/10'
                                : 'border-white/20 hover:border-fm-gold/50 hover:bg-white/5'), children: preview ? (_jsxs("div", { className: 'relative w-full flex items-center justify-center', children: [_jsx("img", { src: preview, alt: 'Preview', className: 'max-w-full max-h-[300px] object-contain border border-white/20' }), _jsx("button", { onClick: e => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                            setPreview(null);
                                        }, className: 'absolute top-2 right-2 p-1 bg-black/80 text-white hover:text-fm-danger transition-colors', children: _jsx(X, { className: 'h-4 w-4' }) })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: 'h-16 w-16 rounded-full bg-white/10 flex items-center justify-center', children: _jsx(ImageIcon, { className: 'h-8 w-8 text-white/50' }) }), _jsxs("div", { className: 'text-center', children: [_jsx("p", { className: 'text-white font-medium mb-[5px]', children: t('imageUpload.dropOrBrowse') }), _jsx("p", { className: 'text-white/50 text-sm', children: t('imageUpload.formatSpecs') })] })] })) }), _jsx("input", { ref: fileInputRef, type: 'file', accept: 'image/jpeg,image/jpg,image/png,image/webp', onChange: e => {
                                const file = e.target.files?.[0];
                                if (file)
                                    handleFileSelect(file);
                            }, className: 'hidden' })] }), _jsxs(DialogFooter, { className: 'gap-[10px]', children: [_jsx(Button, { variant: 'outline', onClick: () => onOpenChange(false), disabled: isUploading, className: 'bg-white/5 border-white/20 hover:bg-white/10', children: t('buttons.cancel') }), _jsx(Button, { onClick: handleUpload, disabled: !selectedFile || isUploading, className: 'bg-fm-gold hover:bg-fm-gold/90 text-black', children: isUploading ? (_jsxs("div", { className: 'flex items-center gap-2 whitespace-nowrap', children: [_jsx("div", { className: 'h-4 w-4 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' }), _jsx("span", { children: t('imageUpload.uploading') })] })) : (_jsxs("div", { className: 'flex items-center gap-2 whitespace-nowrap', children: [_jsx(Upload, { className: 'h-4 w-4' }), _jsx("span", { children: t('buttons.upload') })] })) })] })] }) }));
}
