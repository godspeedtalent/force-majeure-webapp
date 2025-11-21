import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { ArrowLeft, Building2, User, Mail, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';

import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  description?: string;
  owner_id?: string;
  profile_picture?: string;
  website?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  owner?: {
    user_id: string;
    display_name: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export default function OrganizationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: organization, isLoading, error } = useQuery<Organization>({
    queryKey: ['organization', id],
    queryFn: async () => {
      if (!id) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('organizations' as any)
        .select(`
          *,
          owner:profiles!organizations_owner_id_fkey(
            user_id,
            display_name,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Organization not found');
      
      // Validate data has required fields before casting
      if (!data.id || !data.name) {
        throw new Error('Invalid organization data structure');
      }
      
      return data as unknown as Organization;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  if (error || !organization) {
    toast.error('Failed to load organization');
    return (
      <Layout>
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>Organization not found</p>
          <Button onClick={() => navigate(-1)} className='mt-4'>
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto py-8 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate(-1)}
            className='border-white/20 hover:bg-white/10'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back
          </Button>
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-3'>
              <Building2 className='h-8 w-8 text-fm-gold' />
              {organization.name}
            </h1>
            <p className='text-muted-foreground mt-1'>Organization Details</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Column - Main Info */}
        <div className='md:col-span-2 space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {organization.profile_picture && (
                <div>
                  <img
                    src={organization.profile_picture}
                    alt={organization.name}
                    className='w-32 h-32 object-cover rounded-none border-2 border-fm-gold/30'
                  />
                </div>
              )}

              <div>
                <label className='text-sm text-muted-foreground'>Name</label>
                <p className='text-lg font-medium'>{organization.name}</p>
              </div>

              {organization.description && (
                <div>
                  <label className='text-sm text-muted-foreground'>Description</label>
                  <p>{organization.description}</p>
                </div>
              )}

              {organization.location && (
                <div>
                  <label className='text-sm text-muted-foreground'>Location</label>
                  <p>{organization.location}</p>
                </div>
              )}

              {organization.website && (
                <div>
                  <label className='text-sm text-muted-foreground'>Website</label>
                  <a
                    href={organization.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-fm-gold hover:underline'
                  >
                    {organization.website}
                    <ExternalLink className='h-4 w-4' />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Information */}
          {organization.owner && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Owner
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center gap-3'>
                  {organization.owner.avatar_url && (
                    <img
                      src={organization.owner.avatar_url}
                      alt={organization.owner.display_name}
                      className='w-12 h-12 rounded-full'
                    />
                  )}
                  <div>
                    <p className='font-medium'>{organization.owner.display_name}</p>
                    {organization.owner.full_name && (
                      <p className='text-sm text-muted-foreground'>
                        {organization.owner.full_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Mail className='h-4 w-4' />
                  {organization.owner.email}
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => navigate(`/admin/users/${organization.owner?.user_id}`)}
                  className='w-full border-white/20 hover:bg-white/10'
                >
                  View User Details
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <label className='text-sm text-muted-foreground'>Organization ID</label>
                <p className='font-mono text-sm'>{organization.id}</p>
              </div>

              <div>
                <label className='text-sm text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  Created
                </label>
                <p className='text-sm'>
                  {format(new Date(organization.created_at), 'PPP')}
                </p>
              </div>

              <div>
                <label className='text-sm text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  Last Updated
                </label>
                <p className='text-sm'>
                  {format(new Date(organization.updated_at), 'PPP')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Button
                variant='outline'
                className='w-full border-white/20 hover:bg-white/10'
                onClick={() => navigate(`/admin/organizations`)}
              >
                Back to Organizations List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </Layout>
  );
}
