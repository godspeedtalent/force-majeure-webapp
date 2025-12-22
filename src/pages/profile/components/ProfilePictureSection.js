import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ProfilePictureSection Component
 *
 * Handles profile picture display and upload functionality.
 */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonUserPhoto } from '@/components/common/display/FmCommonUserPhoto';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';
export function ProfilePictureSection() {
    const { t } = useTranslation('common');
    const { user, profile, updateProfile } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !user)
            return;
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: t('imageUpload.invalidFileType'),
                description: t('imageUpload.pleaseUploadImage'),
                variant: 'destructive',
            });
            return;
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: t('imageUpload.fileTooLarge'),
                description: t('imageUpload.fileTooLargeDescription'),
                variant: 'destructive',
            });
            return;
        }
        setIsUploadingImage(true);
        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('profile-images')
                .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });
            if (uploadError)
                throw uploadError;
            // Get public URL
            const { data: { publicUrl }, } = supabase.storage.from('profile-images').getPublicUrl(filePath);
            // Update profile with new avatar URL
            await updateProfile({ avatar_url: publicUrl });
            toast({
                title: t('profilePicture.updated'),
                description: t('profilePicture.updatedDescription'),
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error uploading image', {
                error: errorMessage,
                source: 'ProfilePictureSection',
                details: 'handleImageUpload',
            });
            toast({
                title: t('imageUpload.uploadFailed'),
                description: errorMessage || t('imageUpload.failedToUpload'),
                variant: 'destructive',
            });
        }
        finally {
            setIsUploadingImage(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    if (!user)
        return null;
    return (_jsx(Card, { className: 'border-border/30 bg-card/20 backdrop-blur-lg', children: _jsxs(CardContent, { className: 'p-8 space-y-6', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-xl font-canela font-medium text-foreground mb-2', children: t('profilePicture.title') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('profilePicture.description') })] }), _jsxs("div", { className: 'flex items-center gap-6', children: [_jsx(FmCommonUserPhoto, { src: profile?.avatar_url, name: profile?.display_name || user.email, size: '2xl', showBorder: true, useAnimatedGradient: !profile?.avatar_url }), _jsxs("div", { className: 'flex-1 space-y-3', children: [_jsx("input", { ref: fileInputRef, type: 'file', accept: 'image/*', onChange: handleImageUpload, className: 'hidden' }), _jsx(FmCommonButton, { variant: 'default', icon: Upload, onClick: () => fileInputRef.current?.click(), loading: isUploadingImage, disabled: !user.email_confirmed_at || isUploadingImage, children: isUploadingImage ? t('imageUpload.uploading') : t('profilePicture.uploadPhoto') }), _jsx("p", { className: 'text-xs text-muted-foreground', children: t('profilePicture.formatSpecs') })] })] })] }) }));
}
