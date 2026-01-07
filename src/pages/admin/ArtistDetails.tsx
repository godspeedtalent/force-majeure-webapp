import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Music, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { format } from 'date-fns';
import { useArtistById } from '@/shared';
import { DetailPageWrapper } from '@/components/layout/DetailPageWrapper';
import { EntityDeletionActions } from '@/components/common/entity/EntityDeletionActions';

export default function ArtistDetails() {
  const { t } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: artist, isLoading, error } = useArtistById(id);

  return (
    <DetailPageWrapper
      data={artist}
      isLoading={isLoading}
      error={error}
      entityName='Artist'
      onBack={() => navigate(-1)}
    >
      {(artist) => (
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
                {t('buttons.back')}
              </Button>
              <div>
                <h1 className='text-3xl font-bold flex items-center gap-3'>
                  <Music className='h-8 w-8 text-fm-gold' />
                  {artist.name}
                </h1>
                <p className='text-muted-foreground mt-1'>{t('adminDetails.artistDetails')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Main Content */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Left Column - Main Info */}
            <div className='md:col-span-2 space-y-6'>
              {/* Basic Information */}
              <FmCommonCard>
                <FmCommonCardHeader>
                  <FmCommonCardTitle>{t('adminDetails.basicInformation')}</FmCommonCardTitle>
                </FmCommonCardHeader>
                <FmCommonCardContent className='space-y-4'>
                  {artist.image_url && (
                    <div>
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className='w-48 h-48 object-cover rounded-none border-2 border-fm-gold/30'
                      />
                    </div>
                  )}

                  <div>
                    <label className='text-sm text-muted-foreground'>{t('labels.name')}</label>
                    <p className='text-lg font-medium'>{artist.name}</p>
                  </div>

                  {artist.artist_genres && artist.artist_genres.length > 0 && (
                    <div>
                      <label className='text-sm text-muted-foreground'>{t('labels.genres')}</label>
                      <div className='mt-1 flex flex-wrap gap-1.5'>
                        {artist.artist_genres
                          .filter((ag) => ag.genres?.name)
                          .map((ag) => (
                          <Badge key={ag.genre_id} variant='secondary' className='bg-fm-gold/20 text-fm-gold'>
                            {ag.genres?.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {artist.bio && (
                    <div>
                      <label className='text-sm text-muted-foreground'>{t('labels.biography')}</label>
                      <p className='whitespace-pre-wrap'>{artist.bio}</p>
                    </div>
                  )}
                </FmCommonCardContent>
              </FmCommonCard>

              {/* Social Links */}
              {artist.website && (
                <FmCommonCard>
                  <FmCommonCardHeader>
                    <FmCommonCardTitle>{t('adminDetails.links')}</FmCommonCardTitle>
                  </FmCommonCardHeader>
                  <FmCommonCardContent className='space-y-3'>
                    <a
                      href={artist.website}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-2 text-fm-gold hover:underline'
                    >
                      <ExternalLink className='h-4 w-4' />
                      {t('labels.website')}
                    </a>
                  </FmCommonCardContent>
                </FmCommonCard>
              )}
            </div>

            {/* Right Column - Metadata */}
            <div className='space-y-6'>
              <FmCommonCard>
                <FmCommonCardHeader>
                  <FmCommonCardTitle>{t('adminDetails.metadata')}</FmCommonCardTitle>
                </FmCommonCardHeader>
                <FmCommonCardContent className='space-y-3'>
                  <div>
                    <label className='text-sm text-muted-foreground'>{t('adminDetails.artistId')}</label>
                    <p className='font-mono text-sm'>{artist.id}</p>
                  </div>

                  <div>
                    <label className='text-sm text-muted-foreground flex items-center gap-2'>
                      <Calendar className='h-4 w-4' />
                      {t('adminDetails.created')}
                    </label>
                    <p className='text-sm'>
                      {format(new Date(artist.created_at), 'PPP')}
                    </p>
                  </div>

                  <div>
                    <label className='text-sm text-muted-foreground flex items-center gap-2'>
                      <Calendar className='h-4 w-4' />
                      {t('adminDetails.lastUpdated')}
                    </label>
                    <p className='text-sm'>
                      {format(new Date(artist.updated_at), 'PPP')}
                    </p>
                  </div>
                </FmCommonCardContent>
              </FmCommonCard>

              <FmCommonCard>
                <FmCommonCardHeader>
                  <FmCommonCardTitle>{t('adminDetails.actions')}</FmCommonCardTitle>
                </FmCommonCardHeader>
                <FmCommonCardContent className='space-y-2'>
                  <Button
                    variant='outline'
                    className='w-full border-white/20 hover:bg-white/10'
                    onClick={() => navigate(`/admin/artists`)}
                  >
                    {t('adminDetails.backToArtistsList')}
                  </Button>
                  <EntityDeletionActions
                    entityType='artist'
                    entityId={artist.id}
                    entityName={artist.name}
                    onDeleted={() => navigate('/admin/artists')}
                  />
                </FmCommonCardContent>
              </FmCommonCard>
            </div>
          </div>
        </div>
      )}
    </DetailPageWrapper>
  );
}
