import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, ExternalLink, Users } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Separator } from '@/components/common/shadcn/separator';
import { format } from 'date-fns';
import { useVenueById } from '@force-majeure/shared/api/queries/venueQueries';
import { DetailPageWrapper } from '@/components/layout/DetailPageWrapper';

export default function VenueDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: venue, isLoading, error } = useVenueById(id);

  return (
    <DetailPageWrapper
      data={venue}
      isLoading={isLoading}
      error={error}
      entityName='Venue'
      onBack={() => navigate(-1)}
    >
      {(venue) => {
        const fullAddress = [venue.address_line_1, venue.address_line_2, venue.city, venue.state]
          .filter(Boolean)
          .join(', ');

        return (
          <div className='w-full lg:w-[70%] mx-auto py-8 px-4 space-y-6'>
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
                    <MapPin className='h-8 w-8 text-fm-gold' />
                    {venue.name}
                  </h1>
                  <p className='text-muted-foreground mt-1'>Venue Details</p>
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
                    {venue.image_url && (
                      <div>
                        <img
                          src={venue.image_url}
                          alt={venue.name}
                          className='w-full max-h-64 object-cover rounded-none border-2 border-fm-gold/30'
                        />
                      </div>
                    )}

                    <div>
                      <label className='text-sm text-muted-foreground'>Name</label>
                      <p className='text-lg font-medium'>{venue.name}</p>
                    </div>

                    {fullAddress && (
                      <div>
                        <label className='text-sm text-muted-foreground flex items-center gap-2'>
                          <MapPin className='h-4 w-4' />
                          Address
                        </label>
                        <p>{fullAddress}</p>
                        {fullAddress && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-sm text-fm-gold hover:underline inline-flex items-center gap-1 mt-1'
                          >
                            Open in Google Maps
                            <ExternalLink className='h-3 w-3' />
                          </a>
                        )}
                      </div>
                    )}

                    {venue.capacity && (
                      <div>
                        <label className='text-sm text-muted-foreground flex items-center gap-2'>
                          <Users className='h-4 w-4' />
                          Capacity
                        </label>
                        <p className='text-lg font-semibold text-fm-gold'>
                          {venue.capacity.toLocaleString()} people
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Metadata */}
              <div className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div>
                      <label className='text-sm text-muted-foreground'>Venue ID</label>
                      <p className='font-mono text-sm'>{venue.id}</p>
                    </div>

                    <div>
                      <label className='text-sm text-muted-foreground flex items-center gap-2'>
                        <Calendar className='h-4 w-4' />
                        Created
                      </label>
                      <p className='text-sm'>
                        {format(new Date(venue.created_at), 'PPP')}
                      </p>
                    </div>

                    <div>
                      <label className='text-sm text-muted-foreground flex items-center gap-2'>
                        <Calendar className='h-4 w-4' />
                        Last Updated
                      </label>
                      <p className='text-sm'>
                        {format(new Date(venue.updated_at), 'PPP')}
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
                      onClick={() => navigate(`/admin/venues`)}
                    >
                      Back to Venues List
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      }}
    </DetailPageWrapper>
  );
}
