import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, ExternalLink, Users } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { useVenueById } from '@/shared';
import { DetailPageWrapper } from '@/components/layout/DetailPageWrapper';
import { FmCommonDetailPageLayout } from '@/components/common/layout/FmCommonDetailPageLayout';

export default function VenueDetails() {
  const { t } = useTranslation('common');
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
          <FmCommonDetailPageLayout
            title={venue.name}
            subtitle={t('adminDetails.venueDetails')}
            icon={MapPin}
            entityId={venue.id}
            idLabel={t('adminDetails.venueId')}
            createdAt={venue.created_at}
            updatedAt={venue.updated_at}
            actions={
              <Button
                variant='outline'
                className='w-full border-white/20 hover:bg-white/10'
                onClick={() => navigate(`/admin/venues`)}
              >
                {t('adminDetails.backToVenuesList')}
              </Button>
            }
          >
            <FmCommonCard>
              <FmCommonCardHeader>
                <FmCommonCardTitle>{t('adminDetails.basicInformation')}</FmCommonCardTitle>
              </FmCommonCardHeader>
              <FmCommonCardContent className='space-y-4'>
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
                  <label className='text-sm text-muted-foreground'>{t('labels.name')}</label>
                  <p className='text-lg font-medium'>{venue.name}</p>
                </div>

                {fullAddress && (
                  <div>
                    <label className='text-sm text-muted-foreground flex items-center gap-2'>
                      <MapPin className='h-4 w-4' />
                      {t('labels.address')}
                    </label>
                    <p>{fullAddress}</p>
                    {fullAddress && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-fm-gold hover:underline inline-flex items-center gap-1 mt-1'
                      >
                        {t('adminDetails.openInGoogleMaps')}
                        <ExternalLink className='h-3 w-3' />
                      </a>
                    )}
                  </div>
                )}

                {venue.capacity && (
                  <div>
                    <label className='text-sm text-muted-foreground flex items-center gap-2'>
                      <Users className='h-4 w-4' />
                      {t('labels.capacity')}
                    </label>
                    <p className='text-lg font-semibold text-fm-gold'>
                      {venue.capacity.toLocaleString()} {t('adminDetails.people')}
                    </p>
                  </div>
                )}
              </FmCommonCardContent>
            </FmCommonCard>
          </FmCommonDetailPageLayout>
        );
      }}
    </DetailPageWrapper>
  );
}
