import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, MapPin, Save, Trash2, Eye } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Card } from '@/components/common/shadcn/card';
import { toast } from 'sonner';
import { handleError } from '@force-majeure/shared/services/errorHandler';
import { useDebouncedSave } from '@force-majeure/shared/hooks/useDebouncedSave';
import { venueService } from '@/features/venues/services/venueService';
import { useVenueById, venueKeys } from '@force-majeure/shared/api/queries/venueQueries';

type VenueTab = 'overview' | 'view';

export default function VenueManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<VenueTab>('overview');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      toast.success('Changes saved automatically');
      queryClient.invalidateQueries({ queryKey: venueKeys.detail(id) });
    } catch (error) {
      await handleError(error, {
        title: 'Auto-save Failed',
        description: 'Could not save changes automatically',
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
      label: 'Venue Details',
      icon: MapPin,
      items: [
        {
          id: 'view',
          label: 'View Venue',
          icon: Eye,
          description: 'View venue details page',
          isExternal: true,
        },
        {
          id: 'overview',
          label: 'Overview',
          icon: FileText,
          description: 'Basic venue information',
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

      toast.success('Venue updated successfully');
      queryClient.invalidateQueries({ queryKey: venueKeys.detail(id) });
    } catch (error) {
      handleError(error, { title: 'Failed to update venue' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this venue?')) return;

    setIsDeleting(true);
    try {
      await venueService.deleteVenue(id);
      toast.success('Venue deleted successfully');
      navigate('/developer/database?table=venues');
    } catch (error) {
      handleError(error, { title: 'Failed to delete venue' });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderOverviewTab = () => (
    <div className='space-y-6'>
      <Card className='p-6'>
        <h2 className='text-xl font-semibold mb-6'>Basic Information</h2>
        
        <div className='space-y-4'>
          <div>
            <Label>Venue Name *</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                triggerAutoSave();
              }}
              placeholder='Enter venue name'
            />
          </div>

          <div>
            <Label>Venue Image</Label>
            <FmImageUpload
              currentImageUrl={imageUrl}
              onUploadComplete={(url) => {
                setImageUrl(url);
                triggerAutoSave();
              }}
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={addressLine1}
              onChange={(e) => {
                setAddressLine1(e.target.value);
                triggerAutoSave();
              }}
              placeholder='Street address'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label>City</Label>
              <Input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  triggerAutoSave();
                }}
                placeholder='City'
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  triggerAutoSave();
                }}
                placeholder='State'
              />
            </div>
          </div>

          <div>
            <Label>Capacity</Label>
            <Input
              type='number'
              value={capacity}
              onChange={(e) => {
                setCapacity(Number(e.target.value));
                triggerAutoSave();
              }}
              placeholder='Capacity'
            />
          </div>
        </div>
      </Card>

      <div className='flex justify-between'>
        <FmCommonButton
          variant='destructive'
          icon={Trash2}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Venue'}
        </FmCommonButton>

        <FmCommonButton
          icon={Save}
          onClick={handleSave}
          disabled={isSaving || !name}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
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
    </SideNavbarLayout>
  );
}
