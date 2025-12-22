import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, MapPin, Save, Trash2, Eye } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
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

type VenueTab = 'overview' | 'view';

export default function VenueManagement() {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<VenueTab>('overview');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [capacity, setCapacity] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');

  // Debounced auto-save for venue changes
  const saveVenueData = async (data: {
    name: string;
    address_line_1: string;
    city: string;
    state: string;
    capacity: number;
    image_url: string;
  }) => {
    if (!id) return;

    try {
      await venueService.updateVenue(id, data);
      toast.success(tToast('venues.autoSaved'));
      queryClient.invalidateQueries({ queryKey: venueKeys.detail(id) });
    } catch (error) {
      await handleError(error, {
        title: tToast('venues.autoSaveFailed'),
        description: tToast('venues.autoSaveFailedDescription'),
        endpoint: 'VenueManagement',
        method: 'UPDATE',
      });
    }
  };

  const { triggerSave: triggerVenueSave, flushSave: flushVenueSave } =
    useDebouncedSave({
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

  const navigationGroups: FmCommonSideNavGroup<VenueTab>[] = [
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
    if (!id) return;

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
    } catch (error) {
      handleError(error, { title: tToast('venues.updateFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await venueService.deleteVenue(id);
      toast.success(tToast('venues.deleted'));
      setShowDeleteConfirm(false);
      navigate('/developer/database?table=venues');
    } catch (error) {
      handleError(error, { title: tToast('venues.deleteFailed') });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderOverviewTab = () => (
    <div className='space-y-6'>
      <Card className='p-6'>
        <h2 className='text-xl font-semibold mb-6'>{t('venueManagement.basicInformation')}</h2>

        <div className='space-y-4'>
          <div>
            <Label>{t('venueManagement.venueName')} *</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                triggerAutoSave();
              }}
              placeholder={t('venueManagement.enterVenueName')}
            />
          </div>

          <div>
            <Label>{t('venueManagement.venueImage')}</Label>
            <FmImageUpload
              currentImageUrl={imageUrl}
              onUploadComplete={(url) => {
                setImageUrl(url);
                triggerAutoSave();
              }}
            />
          </div>

          <div>
            <Label>{t('venueManagement.address')}</Label>
            <Input
              value={addressLine1}
              onChange={(e) => {
                setAddressLine1(e.target.value);
                triggerAutoSave();
              }}
              placeholder={t('venueManagement.streetAddress')}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label>{t('venueManagement.city')}</Label>
              <Input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  triggerAutoSave();
                }}
                placeholder={t('venueManagement.city')}
              />
            </div>
            <div>
              <Label>{t('venueManagement.state')}</Label>
              <Input
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  triggerAutoSave();
                }}
                placeholder={t('venueManagement.state')}
              />
            </div>
          </div>

          <div>
            <Label>{t('venueManagement.capacity')}</Label>
            <Input
              type='number'
              value={capacity}
              onChange={(e) => {
                setCapacity(Number(e.target.value));
                triggerAutoSave();
              }}
              placeholder={t('venueManagement.capacity')}
            />
          </div>
        </div>
      </Card>

      <div className='flex justify-between'>
        <FmCommonButton
          variant='destructive'
          icon={Trash2}
          onClick={handleDeleteClick}
          disabled={isDeleting}
        >
          {isDeleting ? t('buttons.deleting') : t('venueManagement.deleteVenue')}
        </FmCommonButton>

        <FmCommonButton
          icon={Save}
          onClick={handleSave}
          disabled={isSaving || !name}
        >
          {isSaving ? t('buttons.saving') : t('buttons.saveChanges')}
        </FmCommonButton>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='animate-spin rounded-full h-8 w-8 border-[3px] border-fm-gold border-b-transparent' />
      </div>
    );
  }

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={(id: VenueTab) => {
        if (id === 'view') {
          navigate(`/venues/${venue?.id}`);
        } else {
          setActiveTab(id);
        }
      }}
    >
      {activeTab === 'overview' && renderOverviewTab()}

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('venueManagement.deleteVenue')}
        description={t('venueManagement.deleteVenueConfirm')}
        confirmText={t('buttons.delete')}
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </SideNavbarLayout>
  );
}
