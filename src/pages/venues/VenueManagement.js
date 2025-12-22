import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, MapPin, Save, Trash2, Eye } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Card } from '@/components/common/shadcn/card';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { useDebouncedSave } from '@/shared/hooks/useDebouncedSave';
import { venueService } from '@/features/venues/services/venueService';
import { useVenueById, venueKeys } from '@/shared/api/queries/venueQueries';
export default function VenueManagement() {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    // Form state
    const [name, setName] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [capacity, setCapacity] = useState(0);
    const [imageUrl, setImageUrl] = useState('');
    // Debounced auto-save for venue changes
    const saveVenueData = async (data) => {
        if (!id)
            return;
        try {
            await venueService.updateVenue(id, data);
            toast.success(tToast('venues.autoSaved'));
            queryClient.invalidateQueries({ queryKey: venueKeys.detail(id) });
        }
        catch (error) {
            await handleError(error, {
                title: tToast('venues.autoSaveFailed'),
                description: tToast('venues.autoSaveFailedDescription'),
                endpoint: 'VenueManagement',
                method: 'UPDATE',
            });
        }
    };
    const { triggerSave: triggerVenueSave, flushSave: flushVenueSave } = useDebouncedSave({
        saveFn: saveVenueData,
        delay: 5000,
    });
    // Helper to trigger auto-save
    const triggerAutoSave = () => {
        if (name.trim()) {
            triggerVenueSave({
                name,
                address_line_1: addressLine1,
                city,
                state,
                capacity,
                image_url: imageUrl,
            });
        }
    };
    const { data: venue, isLoading } = useVenueById(id);
    useEffect(() => {
        if (venue) {
            setName(venue.name || '');
            setAddressLine1(venue.address_line_1 || '');
            setCity(venue.city || '');
            setState(venue.state || '');
            setCapacity(venue.capacity || 0);
            setImageUrl(venue.image_url || '');
        }
    }, [venue]);
    const navigationGroups = [
        {
            label: t('venueNav.venueDetails'),
            icon: MapPin,
            items: [
                {
                    id: 'view',
                    label: t('venueNav.viewVenue'),
                    icon: Eye,
                    description: t('venueNav.viewVenueDescription'),
                    isExternal: true,
                },
                {
                    id: 'overview',
                    label: t('venueNav.overview'),
                    icon: FileText,
                    description: t('venueNav.overviewDescription'),
                },
            ],
        },
    ];
    const handleSave = async () => {
        if (!id)
            return;
        setIsSaving(true);
        try {
            // Flush any pending debounced save first
            await flushVenueSave();
            await venueService.updateVenue(id, {
                name,
                address_line_1: addressLine1,
                city,
                state,
                capacity,
                image_url: imageUrl,
            });
            toast.success(tToast('venues.updated'));
            queryClient.invalidateQueries({ queryKey: venueKeys.detail(id) });
        }
        catch (error) {
            handleError(error, { title: tToast('venues.updateFailed') });
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };
    const handleDelete = async () => {
        if (!id)
            return;
        setIsDeleting(true);
        try {
            await venueService.deleteVenue(id);
            toast.success(tToast('venues.deleted'));
            setShowDeleteConfirm(false);
            navigate('/developer/database?table=venues');
        }
        catch (error) {
            handleError(error, { title: tToast('venues.deleteFailed') });
        }
        finally {
            setIsDeleting(false);
        }
    };
    const renderOverviewTab = () => (_jsxs("div", { className: 'space-y-6', children: [_jsxs(Card, { className: 'p-6', children: [_jsx("h2", { className: 'text-xl font-semibold mb-6', children: t('venueManagement.basicInformation') }), _jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { children: [_jsxs(Label, { children: [t('venueManagement.venueName'), " *"] }), _jsx(Input, { value: name, onChange: (e) => {
                                            setName(e.target.value);
                                            triggerAutoSave();
                                        }, placeholder: t('venueManagement.enterVenueName') })] }), _jsxs("div", { children: [_jsx(Label, { children: t('venueManagement.venueImage') }), _jsx(FmImageUpload, { currentImageUrl: imageUrl, onUploadComplete: (url) => {
                                            setImageUrl(url);
                                            triggerAutoSave();
                                        } })] }), _jsxs("div", { children: [_jsx(Label, { children: t('venueManagement.address') }), _jsx(Input, { value: addressLine1, onChange: (e) => {
                                            setAddressLine1(e.target.value);
                                            triggerAutoSave();
                                        }, placeholder: t('venueManagement.streetAddress') })] }), _jsxs("div", { className: 'grid grid-cols-2 gap-4', children: [_jsxs("div", { children: [_jsx(Label, { children: t('venueManagement.city') }), _jsx(Input, { value: city, onChange: (e) => {
                                                    setCity(e.target.value);
                                                    triggerAutoSave();
                                                }, placeholder: t('venueManagement.city') })] }), _jsxs("div", { children: [_jsx(Label, { children: t('venueManagement.state') }), _jsx(Input, { value: state, onChange: (e) => {
                                                    setState(e.target.value);
                                                    triggerAutoSave();
                                                }, placeholder: t('venueManagement.state') })] })] }), _jsxs("div", { children: [_jsx(Label, { children: t('venueManagement.capacity') }), _jsx(Input, { type: 'number', value: capacity, onChange: (e) => {
                                            setCapacity(Number(e.target.value));
                                            triggerAutoSave();
                                        }, placeholder: t('venueManagement.capacity') })] })] })] }), _jsxs("div", { className: 'flex justify-between', children: [_jsx(FmCommonButton, { variant: 'destructive', icon: Trash2, onClick: handleDeleteClick, disabled: isDeleting, children: isDeleting ? t('buttons.deleting') : t('venueManagement.deleteVenue') }), _jsx(FmCommonButton, { icon: Save, onClick: handleSave, disabled: isSaving || !name, children: isSaving ? t('buttons.saving') : t('buttons.saveChanges') })] })] }));
    if (isLoading) {
        return (_jsx("div", { className: 'min-h-screen flex items-center justify-center bg-background', children: _jsx("div", { className: 'animate-spin rounded-full h-8 w-8 border-[3px] border-fm-gold border-b-transparent' }) }));
    }
    return (_jsxs(SideNavbarLayout, { navigationGroups: navigationGroups, activeItem: activeTab, onItemChange: (id) => {
            if (id === 'view') {
                navigate(`/venues/${venue?.id}`);
            }
            else {
                setActiveTab(id);
            }
        }, children: [activeTab === 'overview' && renderOverviewTab(), _jsx(FmCommonConfirmDialog, { open: showDeleteConfirm, onOpenChange: setShowDeleteConfirm, title: t('venueManagement.deleteVenue'), description: t('venueManagement.deleteVenueConfirm'), confirmText: t('buttons.delete'), onConfirm: handleDelete, variant: "destructive", isLoading: isDeleting })] }));
}
