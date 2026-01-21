import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Building2,
  Eye,
  Images,
  Users,
  Calendar,
  Shield,
  AlertTriangle,
  Trash2,
  Share2,
} from 'lucide-react';
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
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { OrganizationStaffManagement } from '@/components/organizations/OrganizationStaffManagement';
import { OrganizationSocialTab } from './components/manage/OrganizationSocialTab';
import { OrganizationEventsTab } from './components/manage/OrganizationEventsTab';
import { toast } from 'sonner';
import { handleError, supabase } from '@/shared';
import {
  useOrganizationById,
  organizationKeys,
} from '@/shared/api/queries/organizationQueries';
import { useUnsavedChanges } from '@/shared/hooks';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';
import type { UpdateOrganizationInput } from '@/types/organization';

type OrganizationTab = 'view' | 'overview' | 'social' | 'gallery' | 'staff' | 'events' | 'admin';

export default function OrganizationManagement() {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);

  const [activeTab, setActiveTab] = useState<OrganizationTab>('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state - Overview
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Form state - Social Media
  const [socialEmail, setSocialEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');

  const { data: organization, isLoading, error } = useOrganizationById(id);

  // Track initial values for dirty state detection
  const initialValuesRef = useRef<{
    name: string;
    profilePicture: string;
    socialEmail: string;
    website: string;
    instagram: string;
    twitter: string;
    tiktok: string;
    facebook: string;
    youtube: string;
  } | null>(null);

  useEffect(() => {
    if (organization) {
      const initialValues = {
        name: organization.name || '',
        profilePicture: organization.profile_picture || '',
        socialEmail: organization.social_email || '',
        website: organization.website || '',
        instagram: organization.instagram_handle || '',
        twitter: organization.twitter_handle || '',
        tiktok: organization.tiktok_handle || '',
        facebook: organization.facebook_url || '',
        youtube: organization.youtube_url || '',
      };

      setName(initialValues.name);
      setProfilePicture(initialValues.profilePicture);
      setSocialEmail(initialValues.socialEmail);
      setWebsite(initialValues.website);
      setInstagram(initialValues.instagram);
      setTwitter(initialValues.twitter);
      setTiktok(initialValues.tiktok);
      setFacebook(initialValues.facebook);
      setYoutube(initialValues.youtube);

      initialValuesRef.current = initialValues;
    }
  }, [organization]);

  // Calculate if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!initialValuesRef.current) return false;
    const initial = initialValuesRef.current;
    return (
      name !== initial.name ||
      profilePicture !== initial.profilePicture ||
      socialEmail !== initial.socialEmail ||
      website !== initial.website ||
      instagram !== initial.instagram ||
      twitter !== initial.twitter ||
      tiktok !== initial.tiktok ||
      facebook !== initial.facebook ||
      youtube !== initial.youtube
    );
  }, [name, profilePicture, socialEmail, website, instagram, twitter, tiktok, facebook, youtube]);

  // Unsaved changes warning
  const unsavedChanges = useUnsavedChanges({ isDirty });

  const navigationGroups: FmCommonSideNavGroup<OrganizationTab>[] = [
    {
      label: t('organizationNav.organizationDetails'),
      icon: Building2,
      items: [
        {
          id: 'view',
          label: t('organizationNav.viewOrganization'),
          icon: Eye,
          description: t('organizationNav.viewOrganizationDescription'),
          isExternal: true,
        },
        {
          id: 'overview',
          label: t('organizationNav.overview'),
          icon: FileText,
          description: t('organizationNav.overviewDescription'),
        },
        {
          id: 'social',
          label: t('organizationNav.social'),
          icon: Share2,
          description: t('organizationNav.socialDescription'),
        },
        {
          id: 'gallery',
          label: t('organizationNav.gallery'),
          icon: Images,
          description: t('organizationNav.galleryDescription'),
        },
      ],
    },
    {
      label: t('organizationNav.management'),
      icon: Users,
      items: [
        {
          id: 'staff',
          label: t('organizationNav.staff'),
          icon: Users,
          description: t('organizationNav.staffDescription'),
        },
        {
          id: 'events',
          label: t('organizationNav.events'),
          icon: Calendar,
          description: t('organizationNav.eventsDescription'),
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: t('organizationNav.administration'),
            icon: Shield,
            items: [
              {
                id: 'admin' as OrganizationTab,
                label: t('organizationNav.admin'),
                icon: Shield,
                description: t('organizationNav.adminDescription'),
              },
            ],
          },
        ]
      : []),
  ];

  // Mobile bottom tabs - mirrors navigation groups for mobile
  const mobileTabs: MobileBottomTab[] = [
    { id: 'view', label: t('organizationNav.viewOrganization'), icon: Eye },
    { id: 'overview', label: t('organizationNav.overview'), icon: FileText },
    { id: 'social', label: t('organizationNav.social'), icon: Share2 },
    { id: 'gallery', label: t('organizationNav.gallery'), icon: Images },
    { id: 'staff', label: t('organizationNav.staff'), icon: Users },
    { id: 'events', label: t('organizationNav.events'), icon: Calendar },
    ...(isAdmin
      ? [{ id: 'admin', label: t('organizationNav.admin'), icon: Shield }]
      : []),
  ];

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      const updateData: UpdateOrganizationInput = {
        name,
        profile_picture: profilePicture || null,
        social_email: socialEmail || null,
        website: website || null,
        instagram_handle: instagram || null,
        twitter_handle: twitter || null,
        tiktok_handle: tiktok || null,
        facebook_url: facebook || null,
        youtube_url: youtube || null,
      };

      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update initial values to reset dirty state
      if (initialValuesRef.current) {
        initialValuesRef.current = {
          name,
          profilePicture,
          socialEmail,
          website,
          instagram,
          twitter,
          tiktok,
          facebook,
          youtube,
        };
      }

      toast.success(tToast('organizations.updated'));
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(id) });
    } catch (err) {
      handleError(err, { title: tToast('organizations.updateFailed') });
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
      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success(tToast('organizations.deleted'));
      setShowDeleteConfirm(false);
      navigate('/developer/database?table=organizations');
    } catch (err) {
      handleError(err, { title: tToast('organizations.deleteFailed') });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderOverviewTab = () => (
    <div className='space-y-6'>
      <FmFormSection
        title={t('organizationManagement.basicInformation')}
        description={t('organizationManagement.basicInformationDescription')}
        icon={Building2}
      >
        {/* Logo and Name row */}
        <div className='flex gap-4 items-start'>
          {/* Small square logo upload */}
          <div className='flex-shrink-0 w-[100px]'>
            <div className='w-[100px] h-[100px] relative'>
              {profilePicture ? (
                <div className='relative w-full h-full border border-border bg-muted overflow-hidden group'>
                  <img
                    src={profilePicture}
                    alt={t('organizationManagement.organizationLogo')}
                    className='w-full h-full object-cover'
                  />
                  <button
                    type='button'
                    onClick={() => setProfilePicture('')}
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
                        setIsImageUploading(true);
                        try {
                          const { imageUploadService } = await import('@/shared');
                          const result = await imageUploadService.uploadImage({
                            file,
                            bucket: 'images',
                            path: `organizations/${id}/logo`,
                          });
                          setProfilePicture(result.publicUrl);
                        } catch {
                          toast.error(t('upload.uploadFailed'));
                        } finally {
                          setIsImageUploading(false);
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
                        setIsImageUploading(true);
                        try {
                          const { imageUploadService } = await import('@/shared');
                          const result = await imageUploadService.uploadImage({
                            file,
                            bucket: 'images',
                            path: `organizations/${id}/logo`,
                          });
                          setProfilePicture(result.publicUrl);
                        } catch {
                          toast.error(t('upload.uploadFailed'));
                        } finally {
                          setIsImageUploading(false);
                        }
                      }
                    }}
                    className='hidden'
                  />
                </label>
              )}
              {isImageUploading && (
                <div className='absolute inset-0 flex items-center justify-center bg-black/60'>
                  <div className='h-6 w-6 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' />
                </div>
              )}
            </div>
            <Label className='mt-2 block text-xs uppercase tracking-wider text-muted-foreground text-center'>
              {t('organizationManagement.logo')}
            </Label>
          </div>

          {/* Organization Name field */}
          <div className='flex-1'>
            <FmCommonTextField
              label={t('organizationManagement.organizationName')}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('organizationManagement.enterOrganizationName')}
              description={t('organizationManagement.organizationNameDescription')}
            />
          </div>
        </div>
      </FmFormSection>
    </div>
  );

  const renderSocialTab = () => (
    <OrganizationSocialTab
      email={socialEmail}
      onEmailChange={setSocialEmail}
      website={website}
      onWebsiteChange={setWebsite}
      instagram={instagram}
      onInstagramChange={setInstagram}
      twitter={twitter}
      onTwitterChange={setTwitter}
      tiktok={tiktok}
      onTiktokChange={setTiktok}
      facebook={facebook}
      onFacebookChange={setFacebook}
      youtube={youtube}
      onYoutubeChange={setYoutube}
    />
  );

  const renderGalleryTab = () => (
    <div className='space-y-6'>
      <FmFormSection
        title={t('organizationManagement.gallery')}
        description={t('organizationManagement.galleryDescription')}
        icon={Images}
      >
        <div className='py-8 text-center text-muted-foreground'>
          <Images className='h-12 w-12 mx-auto mb-4 opacity-50' />
          <p>{t('organizationManagement.galleryComingSoon')}</p>
        </div>
      </FmFormSection>
    </div>
  );

  const renderStaffTab = () => (
    <OrganizationStaffManagement organizationId={id!} />
  );

  const renderEventsTab = () => (
    <OrganizationEventsTab
      organizationId={id!}
      organizationName={organization?.name}
    />
  );

  const renderAdminTab = () => (
    <div className='space-y-6'>
      <FmFormSection
        title={t('organizationManagement.adminControls')}
        description={t('organizationManagement.adminControlsDescription')}
        icon={Shield}
      >
        <div className='space-y-4'>
          <p className='text-sm text-muted-foreground'>
            {t('organizationManagement.adminInfo')}
          </p>
        </div>
      </FmFormSection>

      {/* Danger Zone - Delete Organization */}
      <FmFormSection
        title={t('organizationManagement.dangerZone')}
        description={t('organizationManagement.dangerZoneDescription')}
        icon={AlertTriangle}
        className='border-fm-danger/30'
      >
        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            {t('organizationManagement.deletionWarning')}
          </p>
          <FmCommonButton
            variant='destructive-outline'
            icon={Trash2}
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting
              ? t('buttons.processing')
              : t('organizationManagement.deleteOrganization')}
          </FmCommonButton>
        </div>
      </FmFormSection>
    </div>
  );

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <FmCommonLoadingSpinner size='lg' />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4'>
            {t('organization.notFound')}
          </p>
          <FmCommonButton onClick={() => navigate(-1)}>
            {t('buttons.goBack')}
          </FmCommonButton>
        </div>
      </div>
    );
  }

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={(tab: OrganizationTab) => {
        if (tab === 'view') {
          navigate(`/admin/organizations/${id}`);
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
              navigate(`/admin/organizations/${id}`);
            } else {
              setActiveTab(tab as OrganizationTab);
            }
          }}
        />
      }
      contentWidth='READABLE'
    >
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'social' && renderSocialTab()}
      {activeTab === 'gallery' && renderGalleryTab()}
      {activeTab === 'staff' && renderStaffTab()}
      {activeTab === 'events' && renderEventsTab()}
      {activeTab === 'admin' && isAdmin && renderAdminTab()}

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('organizationManagement.deleteOrganizationTitle')}
        description={t('organizationManagement.deleteOrganizationConfirm')}
        confirmText={t('buttons.delete')}
        onConfirm={handleDelete}
        variant='destructive'
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
          disabled={isImageUploading || !name}
          onSave={handleSave}
          hasSidebar
        />
      )}
    </SideNavbarLayout>
  );
}
