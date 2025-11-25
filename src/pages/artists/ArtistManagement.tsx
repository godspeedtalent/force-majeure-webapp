import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Music, Save, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Card } from '@/components/common/shadcn/card';
import { Textarea } from '@/components/common/shadcn/textarea';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';

type ArtistTab = 'overview' | 'view';

export default function ArtistManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ArtistTab>('overview');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: async () => {
      if (!id) throw new Error('No artist ID provided');

      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (artist) {
      setName(artist.name || '');
      setGenre(artist.genre || '');
      setBio(artist.bio || '');
      setWebsite(artist.website || '');
      setImageUrl(artist.image_url || '');
    }
  }, [artist]);

  const navigationGroups: FmCommonSideNavGroup<ArtistTab>[] = [
    {
      label: 'Artist Details',
      icon: Music,
      items: [
        {
          id: 'view',
          label: 'View Artist',
          icon: Eye,
          description: 'View artist details page',
        },
        {
          id: 'overview',
          label: 'Overview',
          icon: FileText,
          description: 'Basic artist information',
        },
      ],
    },
  ];

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('artists')
        .update({
          name,
          genre,
          bio,
          website,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Artist updated successfully');
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
    } catch (error) {
      handleError(error, { title: 'Failed to update artist' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this artist?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('artists').delete().eq('id', id);

      if (error) throw error;

      toast.success('Artist deleted successfully');
      navigate('/developer/database?table=artists');
    } catch (error) {
      handleError(error, { title: 'Failed to delete artist' });
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
            <Label>Artist Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Enter artist name'
            />
          </div>

          <div>
            <Label>Artist Image</Label>
            <FmImageUpload
              currentImageUrl={imageUrl}
              onUploadComplete={setImageUrl}
            />
          </div>

          <div>
            <Label>Genre</Label>
            <Input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder='e.g., House, Techno, Bass'
            />
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder='Artist biography...'
              rows={5}
            />
          </div>

          <div>
            <Label>Website</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder='https://...'
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
          {isDeleting ? 'Deleting...' : 'Delete Artist'}
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
      onItemChange={(id: ArtistTab) => {
        if (id === 'view') {
          navigate(`/artists/${artist?.id}`);
        } else {
          setActiveTab(id);
        }
      }}
    >
      {activeTab === 'overview' && renderOverviewTab()}
    </SideNavbarLayout>
  );
}
