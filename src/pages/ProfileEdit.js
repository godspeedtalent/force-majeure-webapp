import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { User, Settings, Upload, Mail, AlertCircle, Mic2, Check, X, Lock, Trash2, } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { MobileBottomTabBar } from '@/components/mobile';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from '@/components/common/shadcn/alert-dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmCommonPageHeader } from '@/components/common/display/FmCommonPageHeader';
import { FmCommonUserPhoto } from '@/components/common/display/FmCommonUserPhoto';
import { useAuth } from '@/features/auth/services/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { compressImage } from '@/shared/utils/imageUtils';
import { UserArtistTab } from '@/components/profile/UserArtistTab';
import { LanguageSelector } from '@/components/common/i18n/LanguageSelector';
import { useLocaleSync } from '@/hooks/useLocaleSync';
const ProfileEdit = () => {
    const { user, profile, updateProfile, resendVerificationEmail, updatePassword, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation('pages');
    const { t: tCommon } = useTranslation('common');
    const { currentLocale, changeLocale } = useLocaleSync();
    // Read initial active section from navigation state
    const locationState = location.state;
    const initialSection = locationState?.activeTab || 'profile';
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const fileInputRef = useRef(null);
    // Form state - split full_name into first and last
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [gender, setGender] = useState(profile?.gender || 'unspecified');
    const [billingAddress, setBillingAddress] = useState(profile?.billing_address_line_1 || '');
    const [billingCity, setBillingCity] = useState(profile?.billing_city || '');
    const [billingState, setBillingState] = useState(profile?.billing_state || '');
    const [billingZip, setBillingZip] = useState(profile?.billing_zip_code || '');
    const [activeSection, setActiveSection] = useState(initialSection);
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    // Password requirements
    const passwordRequirements = [
        {
            key: 'minLength',
            label: t('auth.passwordRequirements.minLength'),
            test: (password) => password.length >= 8,
        },
        {
            key: 'uppercase',
            label: t('auth.passwordRequirements.uppercase'),
            test: (password) => /[A-Z]/.test(password),
        },
        {
            key: 'lowercase',
            label: t('auth.passwordRequirements.lowercase'),
            test: (password) => /[a-z]/.test(password),
        },
        {
            key: 'number',
            label: t('auth.passwordRequirements.number'),
            test: (password) => /\d/.test(password),
        },
    ];
    const allPasswordRequirementsMet = passwordRequirements.every(req => req.test(newPassword));
    // Account deletion state
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    useEffect(() => {
        if (profile) {
            // Split full_name into first and last name
            const nameParts = (profile.full_name || '').trim().split(' ');
            setFirstName(nameParts[0] || '');
            setLastName(nameParts.slice(1).join(' ') || '');
            setDisplayName(profile.display_name || '');
            setGender(profile.gender || 'unspecified');
            setBillingAddress(profile.billing_address_line_1 || '');
            setBillingCity(profile.billing_city || '');
            setBillingState(profile.billing_state || '');
            setBillingZip(profile.billing_zip_code || '');
        }
    }, [profile]);
    const handleUpdateProfileInfo = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Combine first and last name into full_name
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        await updateProfile({
            full_name: fullName || null,
            display_name: displayName || null,
            gender: gender === 'unspecified' ? null : gender || null,
        });
        setIsLoading(false);
    };
    const handleUpdateBillingAddress = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await updateProfile({
            billing_address_line_1: billingAddress || null,
            billing_city: billingCity || null,
            billing_state: billingState || null,
            billing_zip_code: billingZip || null,
        });
        setIsLoading(false);
    };
    const handleResendVerification = async () => {
        setIsSendingVerification(true);
        await resendVerificationEmail();
        setIsSendingVerification(false);
    };
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordError(t('auth.passwordsDoNotMatch'));
            return;
        }
        if (!allPasswordRequirementsMet) {
            return;
        }
        setPasswordError('');
        setIsChangingPassword(true);
        const { error } = await updatePassword(newPassword);
        if (!error) {
            // Clear the form on success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setIsChangingPassword(false);
    };
    const handleDeleteAccount = async () => {
        if (!user)
            return;
        setIsDeletingAccount(true);
        try {
            // Soft delete: set deleted_at timestamp on profile
            // Note: deleted_at column added in migration 20251221000000_add_deleted_at_to_profiles.sql
            const { error } = await supabase
                .from('profiles')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', user.id);
            if (error) {
                logger.error('Failed to delete account', {
                    error: error.message,
                    source: 'ProfileEdit.tsx',
                });
                toast.error(t('profile.deleteAccountFailed'));
                setIsDeletingAccount(false);
                return;
            }
            toast.success(t('profile.accountDeleted'));
            // Sign out and redirect to home
            await signOut();
            navigate('/');
        }
        catch (error) {
            logger.error('Unexpected error deleting account', {
                error: error instanceof Error ? error.message : 'Unknown error',
                source: 'ProfileEdit.tsx',
            });
            toast.error(t('profile.deleteAccountFailed'));
            setIsDeletingAccount(false);
        }
    };
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !user)
            return;
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error(t('profile.uploadImageError'));
            return;
        }
        setIsUploadingImage(true);
        try {
            // Compress and resize image - smallest dimension will be 1080px max, maintains aspect ratio
            const compressedFile = await compressImage(file, {
                maxWidth: 1080,
                maxHeight: 1080,
                maxSizeBytes: 2 * 1024 * 1024, // 2MB max for profile photos
                quality: 0.85,
                outputFormat: 'jpeg',
                forceResize: true, // Always resize to ensure consistent dimensions
            });
            // Upload to Supabase Storage - use consistent filename per user to replace existing
            const fileName = `${user.id}.jpg`;
            const filePath = `avatars/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('profile-images')
                .upload(filePath, compressedFile, {
                cacheControl: '3600',
                upsert: true, // Replace existing file
            });
            if (uploadError)
                throw uploadError;
            // Get public URL
            const { data: { publicUrl }, } = supabase.storage.from('profile-images').getPublicUrl(filePath);
            // Update profile with new avatar URL
            await updateProfile({ avatar_url: publicUrl });
            toast.success(t('profile.profileUpdated'));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error uploading image', {
                error: errorMessage,
                source: 'ProfileEdit.tsx',
                details: 'handleImageUpload',
            });
            toast.error(errorMessage || t('profile.uploadFailed'));
        }
        finally {
            setIsUploadingImage(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    // Navigation groups configuration
    const navigationGroups = [
        {
            label: tCommon('nav.settings'),
            icon: Settings,
            items: [
                {
                    id: 'profile',
                    label: t('profile.title'),
                    icon: User,
                    description: t('profile.personalInfoDescription'),
                },
                {
                    id: 'artist',
                    label: t('profile.artist'),
                    icon: Mic2,
                    description: t('profile.manageArtistProfile'),
                },
            ],
        },
    ];
    // Mobile bottom tabs configuration
    const mobileTabs = [
        { id: 'profile', label: t('profile.title'), icon: User },
        { id: 'artist', label: t('profile.artist'), icon: Mic2 },
    ];
    if (!user) {
        return (_jsx("div", { className: 'flex items-center justify-center min-h-screen', children: _jsx(Card, { className: 'border-border/30 bg-card/20 backdrop-blur-lg', children: _jsxs(CardContent, { className: 'p-12 text-center', children: [_jsx("p", { className: 'text-muted-foreground mb-6', children: t('profile.signInRequired') }), _jsx(FmCommonButton, { variant: 'gold', onClick: () => navigate('/auth'), children: tCommon('nav.signIn') })] }) }) }));
    }
    return (_jsx(SideNavbarLayout, { navigationGroups: navigationGroups, activeItem: activeSection, onItemChange: setActiveSection, showDividers: false, defaultOpen: true, showBackButton: true, onBack: () => navigate('/profile'), backButtonLabel: t('profile.title'), backButtonActions: _jsx(FmCommonButton, { variant: 'default', size: 'sm', onClick: () => navigate('/profile'), children: t('profile.viewProfile') }), mobileTabBar: _jsx(MobileBottomTabBar, { tabs: mobileTabs, activeTab: activeSection, onTabChange: tab => setActiveSection(tab) }), children: _jsxs("div", { className: 'space-y-6 pt-[80px]', children: [activeSection === 'profile' && (_jsxs(_Fragment, { children: [_jsx(FmCommonPageHeader, { title: t('profile.editProfile'), description: t('profile.accountSettings'), showDivider: true }), user && !user.email_confirmed_at && (_jsx(Card, { className: 'border-fm-gold/50 bg-fm-gold/10 backdrop-blur-lg', children: _jsx(CardContent, { className: 'p-6', children: _jsxs("div", { className: 'flex items-start gap-4', children: [_jsx(AlertCircle, { className: 'h-6 w-6 text-fm-gold flex-shrink-0 mt-0.5' }), _jsxs("div", { className: 'flex-1', children: [_jsx("h3", { className: 'text-lg font-medium text-fm-gold mb-2', children: t('profile.verifyEmailTitle') }), _jsxs("p", { className: 'text-sm text-muted-foreground mb-4', children: [t('profile.verifyEmailDescription'), ' ', _jsx("span", { className: 'font-medium text-foreground', children: user.email }), "."] }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', icon: Mail, onClick: handleResendVerification, loading: isSendingVerification, disabled: isSendingVerification, children: t('profile.resendVerification') })] })] }) }) })), _jsx(Card, { className: 'border-border/30 bg-card/20 backdrop-blur-lg', children: _jsxs(CardContent, { className: 'p-8 space-y-6', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-xl font-canela font-medium text-foreground mb-2', children: t('profile.profilePicture') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('profile.profilePictureDescription') })] }), _jsxs("div", { className: 'flex items-center gap-6', children: [_jsx(FmCommonUserPhoto, { src: profile?.avatar_url, name: profile?.display_name || user.email, size: '2xl', showBorder: true, useAnimatedGradient: !profile?.avatar_url }), _jsxs("div", { className: 'flex-1 space-y-3', children: [_jsx("input", { ref: fileInputRef, type: 'file', accept: 'image/*', onChange: handleImageUpload, className: 'hidden' }), _jsx(FmCommonButton, { variant: 'default', icon: Upload, onClick: () => fileInputRef.current?.click(), loading: isUploadingImage, disabled: !user.email_confirmed_at || isUploadingImage, children: isUploadingImage ? t('profile.uploading') : t('profile.uploadPhoto') }), _jsx("p", { className: 'text-xs text-muted-foreground', children: t('profile.photoHint') })] })] })] }) }), _jsx(Card, { className: 'border-border/30 bg-card/20 backdrop-blur-lg', children: _jsxs(CardContent, { className: 'p-8 space-y-6', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-xl font-canela font-medium text-foreground mb-2', children: t('profile.personalInfo') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('profile.personalInfoDescription') })] }), _jsxs("form", { onSubmit: handleUpdateProfileInfo, className: 'space-y-6', children: [_jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-2 gap-6', children: [_jsx(FmCommonTextField, { label: tCommon('labels.email'), id: 'email', type: 'email', value: user.email || '', disabled: true, className: 'opacity-60', description: t('profile.emailCannotBeChanged') }), _jsx(FmCommonTextField, { label: tCommon('labels.username'), id: 'displayName', type: 'text', placeholder: t('profile.usernamePlaceholder'), value: displayName, onChange: e => setDisplayName(e.target.value), description: t('profile.usernameDescription'), disabled: !user.email_confirmed_at }), _jsx(FmCommonTextField, { label: tCommon('labels.firstName'), id: 'firstName', type: 'text', placeholder: t('profile.firstNamePlaceholder'), value: firstName, onChange: e => setFirstName(e.target.value), description: tCommon('labels.optional'), disabled: !user.email_confirmed_at }), _jsx(FmCommonTextField, { label: tCommon('labels.lastName'), id: 'lastName', type: 'text', placeholder: t('profile.lastNamePlaceholder'), value: lastName, onChange: e => setLastName(e.target.value), description: tCommon('labels.optional'), disabled: !user.email_confirmed_at }), _jsx(FmCommonSelect, { label: t('profile.selectGender'), id: 'gender', value: gender, onChange: setGender, options: [
                                                            { value: 'unspecified', label: t('profile.preferNotToSay') },
                                                            { value: 'male', label: t('profile.male') },
                                                            { value: 'female', label: t('profile.female') },
                                                            { value: 'non-binary', label: t('profile.nonBinary') },
                                                            { value: 'other', label: t('profile.other') },
                                                        ], placeholder: t('profile.selectGender'), description: tCommon('labels.optional'), disabled: !user.email_confirmed_at })] }), _jsx("div", { className: 'h-px bg-border/50' }), _jsx(FmCommonButton, { type: 'submit', variant: 'secondary', loading: isLoading, disabled: !user.email_confirmed_at || isLoading, children: t('profile.updateProfile') })] })] }) }), _jsx(Card, { className: 'border-border/30 bg-card/20 backdrop-blur-lg', children: _jsxs(CardContent, { className: 'p-8 space-y-6', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-xl font-canela font-medium text-foreground mb-2', children: t('profile.billingAddress') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('profile.billingAddressDescription') })] }), _jsxs("form", { onSubmit: handleUpdateBillingAddress, className: 'space-y-6', children: [_jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-2 gap-6', children: [_jsx("div", { className: 'md:col-span-2', children: _jsx(FmCommonTextField, { label: t('profile.streetAddress'), id: 'billingAddress', type: 'text', placeholder: t('profile.streetAddressPlaceholder'), value: billingAddress, onChange: e => setBillingAddress(e.target.value), description: tCommon('labels.optional'), disabled: !user.email_confirmed_at }) }), _jsx(FmCommonTextField, { label: tCommon('labels.city'), id: 'billingCity', type: 'text', placeholder: t('profile.cityPlaceholder'), value: billingCity, onChange: e => setBillingCity(e.target.value), description: tCommon('labels.optional'), disabled: !user.email_confirmed_at }), _jsx(FmCommonTextField, { label: tCommon('labels.state'), id: 'billingState', type: 'text', placeholder: t('profile.statePlaceholder'), value: billingState, onChange: e => setBillingState(e.target.value), description: tCommon('labels.optional'), disabled: !user.email_confirmed_at }), _jsx(FmCommonTextField, { label: tCommon('labels.zipCode'), id: 'billingZip', type: 'text', placeholder: t('profile.zipCodePlaceholder'), value: billingZip, onChange: e => setBillingZip(e.target.value), description: tCommon('labels.optional'), disabled: !user.email_confirmed_at })] }), _jsx("div", { className: 'h-px bg-border/50' }), _jsx(FmCommonButton, { type: 'submit', variant: 'secondary', loading: isLoading, disabled: !user.email_confirmed_at || isLoading, children: t('profile.updateBillingAddress') })] })] }) }), _jsx(Card, { className: 'border-border/30 bg-card/20 backdrop-blur-lg', children: _jsxs(CardContent, { className: 'p-8 space-y-6', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-xl font-canela font-medium text-foreground mb-2', children: t('profile.preferences') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('profile.languageDescription') })] }), _jsx("div", { className: 'max-w-xs', children: _jsx(LanguageSelector, { value: currentLocale, onChange: async (locale) => {
                                                await changeLocale(locale);
                                                // Toast will now use the new locale since i18n has been updated
                                                toast.success(t('profile.languageSaved'));
                                            } }) })] }) }), _jsx(Card, { className: 'border-border/30 bg-card/20 backdrop-blur-lg', children: _jsxs(CardContent, { className: 'p-8 space-y-6', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-xl font-canela font-medium text-foreground mb-2', children: t('profile.changePassword') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('profile.changePasswordDescription') })] }), _jsxs("form", { onSubmit: handleChangePassword, className: 'space-y-6', children: [_jsxs("div", { className: 'grid grid-cols-1 gap-6 max-w-md', children: [_jsx(FmCommonTextField, { label: t('profile.currentPassword'), id: 'currentPassword', password: true, placeholder: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', value: currentPassword, onChange: e => setCurrentPassword(e.target.value), disabled: !user.email_confirmed_at }), _jsxs("div", { children: [_jsx(FmCommonTextField, { label: t('profile.newPassword'), id: 'newPassword', password: true, placeholder: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', value: newPassword, onChange: e => {
                                                                    setNewPassword(e.target.value);
                                                                    if (passwordError)
                                                                        setPasswordError('');
                                                                }, disabled: !user.email_confirmed_at }), newPassword && (_jsx("div", { className: 'mt-2 space-y-1', children: passwordRequirements.map((req) => {
                                                                    const isMet = req.test(newPassword);
                                                                    return (_jsxs("div", { className: `flex items-center gap-2 text-xs transition-colors ${isMet ? 'text-green-500' : 'text-muted-foreground'}`, children: [isMet ? (_jsx(Check, { className: 'h-3 w-3' })) : (_jsx(X, { className: 'h-3 w-3' })), _jsx("span", { className: 'font-canela', children: req.label })] }, req.key));
                                                                }) }))] }), _jsx(FmCommonTextField, { label: t('profile.confirmNewPassword'), id: 'confirmNewPassword', password: true, placeholder: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', value: confirmPassword, onChange: e => {
                                                            setConfirmPassword(e.target.value);
                                                            if (passwordError)
                                                                setPasswordError('');
                                                        }, error: passwordError, disabled: !user.email_confirmed_at })] }), _jsx("div", { className: 'h-px bg-border/50' }), _jsx(FmCommonButton, { type: 'submit', variant: 'secondary', icon: Lock, loading: isChangingPassword, disabled: !user.email_confirmed_at || isChangingPassword || !allPasswordRequirementsMet || !currentPassword, children: t('profile.updatePassword') })] })] }) }), _jsx(Card, { className: 'border-fm-danger/30 bg-card/20 backdrop-blur-lg', children: _jsxs(CardContent, { className: 'p-8 space-y-6', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-xl font-canela font-medium text-fm-danger mb-2', children: t('profile.deleteAccount') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: t('profile.deleteAccountDescription') })] }), _jsx("div", { className: 'p-4 bg-fm-danger/10 border border-fm-danger/20', children: _jsx("p", { className: 'text-sm text-muted-foreground', children: t('profile.deleteAccountWarning') }) }), _jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsx(FmCommonButton, { variant: 'destructive', icon: Trash2, disabled: !user.email_confirmed_at || isDeletingAccount, loading: isDeletingAccount, children: t('profile.deleteAccountButton') }) }), _jsxs(AlertDialogContent, { className: 'bg-background border-border', children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { className: 'text-fm-danger', children: t('profile.deleteAccountConfirmTitle') }), _jsx(AlertDialogDescription, { children: t('profile.deleteAccountConfirmDescription') })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: tCommon('actions.cancel') }), _jsx(AlertDialogAction, { onClick: handleDeleteAccount, className: 'bg-fm-danger hover:bg-fm-danger/90', children: t('profile.deleteAccountConfirmButton') })] })] })] })] }) })] })), activeSection === 'artist' && (_jsxs(_Fragment, { children: [_jsx(FmCommonPageHeader, { title: t('profile.artistProfile'), description: t('profile.artistProfileDescription'), showDivider: true }), _jsx(UserArtistTab, {})] }))] }) }));
};
export default ProfileEdit;
