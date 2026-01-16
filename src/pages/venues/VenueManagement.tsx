import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, MapPin, Trash2, Eye, Images, Share2, Building, AlertTriangle } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SidebarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { UnsavedChangesDialog } from '@/components/common/modals/UnsavedChangesDialog';
import { FmStickyFormFooter } from '@/components/common/forms/FmStickyFormFooter';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Label } from '@/components/common/shadcn/label';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { VenueGallerySection } from '@/components/venue/VenueGallerySection';
import { VenueSocialTab } from './components/manage';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { venueService } from '@/features/venues/services/venueService';
import { useVenueById, venueKeys } from '@/shared/api/queries/venueQueries';
import { useUnsavedChanges } from '@/shared/hooks';

type VenueTab = 'overview' | 'social' | 'gallery' | 'view';

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
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [capacity, setCapacity] = useState<number>(0);
  const [socialEmail, setSocialEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');

  const { data: venue, isLoading } = useVenueById(id);

  // Track initial values for dirty state detection
  const initialValuesRef = useRef<{
    name: string;
    description: string;
    logoUrl: string;
    addressLine1: string;
    city: string;
    state: string;
    capacity: number;
    socialEmail: string;
    website: string;
    instagramHandle: string;
    twitterHandle: string;
    facebookUrl: string;
    youtubeUrl: string;
    tiktokHandle: string;
  } | null>(null);

  useEffect(() => {
    if (venue) {
      const initialValues = {
        name: venue.name || '',
        description: venue.description || '',
        logoUrl: venue.logo_url || '',
        addressLine1: venue.address_line_1 || '',
        city: venue.city || '',
        state: venue.state || '',
        capacity: venue.capacity || 0,
        socialEmail: (venue as { social_email?: string }).social_email || '',
        website: venue.website || '',
        instagramHandle: venue.instagram_handle || '',
        twitterHandle: venue.twitter_handle || '',
        facebookUrl: venue.facebook_url || '',
        youtubeUrl: venue.youtube_url || '',
        tiktokHandle: venue.tiktok_handle || '',
      };

      setName(initialValues.name);
      setDescription(initialValues.description);
      setLogoUrl(initialValues.logoUrl);
      setAddressLine1(initialValues.addressLine1);
      setCity(initialValues.city);
      setState(initialValues.state);
      setCapacity(initialValues.capacity);
      setSocialEmail(initialValues.socialEmail);
      setWebsite(initialValues.website);
      setInstagramHandle(initialValues.instagramHandle);
      setTwitterHandle(initialValues.twitterHandle);
      setFacebookUrl(initialValues.facebookUrl);
      setYoutubeUrl(initialValues.youtubeUrl);
      setTiktokHandle(initialValues.tiktokHandle);

      initialValuesRef.current = initialValues;
    }
  }, [venue]);

  // Calculate if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!initialValuesRef.current) return false;
    const initial = initialValuesRef.current;
    return (
      name !== initial.name ||
      description !== initial.description ||
      logoUrl !== initial.logoUrl ||
      addressLine1 !== initial.addressLine1 ||
      city !== initial.city ||
      state !== initial.state ||
      capacity !== initial.capacity ||
      socialEmail !== initial.socialEmail ||
      website !== initial.website ||
      instagramHandle !== initial.instagramHandle ||
      twitterHandle !== initial.twitterHandle ||
      facebookUrl !== initial.facebookUrl ||
      youtubeUrl !== initial.youtubeUrl ||
      tiktokHandle !== initial.tiktokHandle
    );
  }, [name, description, logoUrl, addressLine1, city, state, capacity, socialEmail, website, instagramHandle, twitterHandle, facebookUrl, youtubeUrl, tiktokHandle]);

  // Unsaved changes warning
  const unsavedChanges = useUnsavedChanges({ isDirty });

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
        {
          id: 'social',
          label: t('venueNav.social', 'Social'),
          icon: Share2,
          description: t('venueNav.socialDescription', 'Manage social media links'),
        },
        {
          id: 'gallery',
          label: t('venueNav.gallery', 'Gallery'),
          icon: Images,
          description: t('venueNav.galleryDescription', 'Manage venue photos and media'),
        },
      ],
    },
  ];

  // Mobile bottom tabs - mirrors navigation groups for mobile
  const mobileTabs: MobileBottomTab[] = [
    { id: 'view', label: t('venueNav.viewVenue'), icon: Eye },
    { id: 'overview', label: t('venueNav.overview'), icon: FileText },
    { id: 'social', label: t('venueNav.social', 'Social'), icon: Share2 },
    { id: 'gallery', label: t('venueNav.gallery', 'Gallery'), icon: Images },
  ];

  const handleSaveOverview = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      await venueService.updateVenue(id, {
        name,
        description,
        logo_url: logoUrl,
        address_line_1: addressLine1,
        city,
        state,
        capacity,
      });

      // Update initial values to reset dirty state
      if (initialValuesRef.current) {
        initialValuesRef.current = {
          ...initialValuesRef.current,
          name,
          description,
          logoUrl,
          addressLine1,
          city,
          state,
          capacity,
        };
      }

      toast.success(tToast('venues.updated'));
      queryClient.invalidateQueries({ queryKey: venueKeys.detail(id) });
    } catch (error) {
      handleError(error, { title: tToast('venues.updateFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSocial = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      await venueService.updateVenue(id, {
        social_email: socialEmail,
        website,
        instagram_handle: instagramHandle,
        twitter_handle: twitterHandle,
        facebook_url: facebookUrl,
        youtube_url: youtubeUrl,
        tiktok_handle: tiktokHandle,
      });

      // Update initial values to reset dirty state
      if (initialValuesRef.current) {
        initialValuesRef.current = {
          ...initialValuesRef.current,
          socialEmail,
          website,
          instagramHandle,
          twitterHandle,
          facebookUrl,
          youtubeUrl,
          tiktokHandle,
        };
      }

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
      <FmFormSection
        title={t('venueManagement.basicInformation')}
        description={t('venueManagement.basicInformationDescription', 'Core details about this venue.')}
        icon={Building}
      >
        {/* Logo and Venue Name row */}
        <div className='flex gap-4 items-start'>
          {/* Small square logo upload */}
          <div className='flex-shrink-0 w-[100px]'>
            <div className='w-[100px] h-[100px] relative'>
              {logoUrl ? (
                <div className='relative w-full h-full border border-border bg-muted overflow-hidden group'>
                  <img
                    src={logoUrl}
                    alt={t('venueManagement.venueLogo')}
                    className='w-full h-full object-cover'
                  />
                  <button
                    type='button'
                    onClick={() => setLogoUrl('')}
                    className='absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    <span className='text-xs text-white'>{t('buttons.change')}</span>
                  </button>
                  <input
                    type='file'
                    accept='image/jpeg,image/jpg,image/png,image/webp,image/gif'
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsLogoUploading(true);
                        try {
                          const { imageUploadService } = await import('@/shared');
                          const result = await imageUploadService.uploadImage({
                            file,
                            bucket: 'images',
                            path: `venues/${id}/logo`,
                          });
                          setLogoUrl(result.publicUrl);
                        } catch {
                          toast.error(t('upload.uploadFailed'));
                        } finally {
                          setIsLogoUploading(false);
                        }
                      }
                    }}
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                  />
                </div>
              ) : (
                <label className='flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-border bg-card hover:border-fm-gold/50 hover:bg-muted/50 cursor-pointer transition-colors'>
                  <Images className='h-6 w-6 text-muted-foreground mb-1' />
                  <span className='text-[10px] text-muted-foreground text-center'>
                    {t('upload.browse')}
                  </span>
                  <input
                    type='file'
                    accept='image/jpeg,image/jpg,image/png,image/webp,image/gif'
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsLogoUploading(true);
                        try {
                          const { imageUploadService } = await import('@/shared');
                          const result = await imageUploadService.uploadImage({
                            file,
                            bucket: 'images',
                            path: `venues/${id}/logo`,
                          });
                          setLogoUrl(result.publicUrl);
                        } catch {
                          toast.error(t('upload.uploadFailed'));
                        } finally {
                          setIsLogoUploading(false);
                        }
                      }
                    }}
                    className='hidden'
                  />
                </label>
              )}
              {isLogoUploading && (
                <div className='absolute inset-0 flex items-center justify-center bg-black/60'>
                  <div className='h-6 w-6 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' />
                </div>
              )}
            </div>
            <Label className='mt-2 block text-xs uppercase tracking-wider text-muted-foreground text-center'>
              {t('venueManagement.logo')}
            </Label>
          </div>

          {/* Venue Name field */}
          <div className='flex-1'>
            <FmCommonTextField
              label={t('venueManagement.venueName')}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('venueManagement.enterVenueName')}
              description={t('venueManagement.venueLogoDescription')}
            />
          </div>
        </div>

        <FmCommonTextField
          label={t('venueManagement.description')}
          multiline
          autoSize
          minRows={3}
          maxRows={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('venueManagement.descriptionPlaceholder')}
        />

        <FmCommonTextField
          label={t('venueManagement.address')}
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          placeholder={t('venueManagement.streetAddress')}
        />

        <div className='grid grid-cols-2 gap-4'>
          <FmCommonTextField
            label={t('venueManagement.city')}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('venueManagement.city')}
          />
          <FmCommonTextField
            label={t('venueManagement.state')}
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder={t('venueManagement.state')}
          />
        </div>

        <FmCommonTextField
          label={t('venueManagement.capacity')}
          type='number'
          value={capacity.toString()}
          onChange={(e) => setCapacity(Number(e.target.value))}
          placeholder={t('venueManagement.capacity')}
        />
      </FmFormSection>

      {/* Danger Zone - Request Venue Deletion */}
      <FmFormSection
        title={t('venueManagement.dangerZone', 'Danger Zone')}
        description={t('venueManagement.dangerZoneDescription', 'Irreversible actions that affect this venue.')}
        icon={AlertTriangle}
        className='border-fm-danger/30'
      >
        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            {t('venueManagement.requestDeletionInfo', 'Requesting deletion will notify administrators who can review and approve the request. The venue will remain active until an administrator processes the request.')}
          </p>
          <FmCommonButton
            variant='destructive-outline'
            icon={Trash2}
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? t('buttons.processing') : t('venueManagement.requestVenueDeletion', 'Request Venue Deletion')}
          </FmCommonButton>
        </div>
      </FmFormSection>
    </div>
  );

  const renderGalleryTab = () => {
    if (!id || !venue) return null;

    return (
      <div className='space-y-6'>
        <FmFormSection
          title={t('venueManagement.gallery', 'Venue Gallery')}
          description={t('venueManagement.galleryDescription', 'Manage photos and media for this venue. The cover image of the default gallery will be used as the venue hero image.')}
          icon={Images}
        >
          <VenueGallerySection
            venueId={id}
            venueName={venue.name || 'Venue'}
          />
        </FmFormSection>
      </div>
    );
  };

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
      onItemChange={(tab: VenueTab) => {
        if (tab === 'view') {
          navigate(`/venues/${venue?.id}`);
        } else {
          setActiveTab(tab);
        }
      }}
      mobileTabBar={
        <MobileBottomTabBar
          tabs={mobileTabs}
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'view') {
              navigate(`/venues/${venue?.id}`);
            } else {
              setActiveTab(tab as VenueTab);
            }
          }}
        />
      }
      contentWidth="READABLE"
    >
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'social' && (
        <VenueSocialTab
          email={socialEmail}
          onEmailChange={setSocialEmail}
          website={website}
          instagram={instagramHandle}
          twitter={twitterHandle}
          facebook={facebookUrl}
          youtube={youtubeUrl}
          tiktok={tiktokHandle}
          onWebsiteChange={setWebsite}
          onInstagramChange={setInstagramHandle}
          onTwitterChange={setTwitterHandle}
          onFacebookChange={setFacebookUrl}
          onYoutubeChange={setYoutubeUrl}
          onTiktokChange={setTiktokHandle}
        />
      )}
      {activeTab === 'gallery' && renderGalleryTab()}

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('venueManagement.requestVenueDeletionTitle', 'Request Venue Deletion')}
        description={t('venueManagement.requestVenueDeletionConfirm', 'This will send a deletion request to administrators for review. The venue will remain active until the request is approved. Are you sure you want to proceed?')}
        confirmText={t('venueManagement.submitRequest', 'Submit Request')}
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />

      <UnsavedChangesDialog
        open={unsavedChanges.showDialog}
        onConfirm={unsavedChanges.confirmNavigation}
        onCancel={unsavedChanges.cancelNavigation}
      />

      {/* Sticky Save Footer - shows on overview and social tabs */}
      {(activeTab === 'overview' || activeTab === 'social') && (
        <FmStickyFormFooter
          isDirty={isDirty}
          isSaving={isSaving}
          disabled={activeTab === 'overview' ? (isLogoUploading || !name) : false}
          onSave={activeTab === 'overview' ? handleSaveOverview : handleSaveSocial}
          hasSidebar
        />
      )}
    </SideNavbarLayout>
  );
}
