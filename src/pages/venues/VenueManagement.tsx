import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, MapPin, Save, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Card } from '@/components/common/shadcn/card';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';

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
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [capacity, setCapacity] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: async () => {
      if (!id) throw new Error('No venue ID provided');

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (venue) {
      setName(venue.name || '');
      setAddress(venue.address || '');
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
      const { error } = await supabase
        .from('venues')
        .update({
          name,
          address,
          city,
          state,
          capacity,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Venue updated successfully');
      queryClient.invalidateQueries({ queryKey: ['venue', id] });
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
      const { error } = await supabase.from('venues').delete().eq('id', id);

      if (error) throw error;

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
              onChange={(e) => setName(e.target.value)}
              placeholder='Enter venue name'
            />
          </div>

          <div>
            <Label>Venue Image</Label>
            <FmImageUpload
              currentImageUrl={imageUrl}
              onUploadComplete={setImageUrl}
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='Street address'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label>City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder='City'
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder='State'
              />
            </div>
          </div>

          <div>
            <Label>Capacity</Label>
            <Input
              type='number'
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
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
