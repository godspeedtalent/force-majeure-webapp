import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music, Calendar, ArrowLeft } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Card } from '@/components/common/shadcn/card';
import { useArtistById, useArtistEvents } from '@/shared/api/queries/artistQueries';
import { DetailPageWrapper } from '@/components/layout/DetailPageWrapper';
// Default placeholder image for artists without an image
const ARTIST_PLACEHOLDER_IMAGE = '/images/artist-showcase/DSC02275.jpg';
export default function ArtistDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation('pages');
    const { data: artist, isLoading, error } = useArtistById(id);
    const { data: upcomingEvents } = useArtistEvents(id);
    return (_jsx(DetailPageWrapper, { data: artist, isLoading: isLoading, error: error, entityName: t('artistDetails.entityName'), onBack: () => navigate(-1), notFoundMessage: t('artistDetails.notFound'), useLayout: true, children: (artist) => {
            const heroImage = artist.image_url || ARTIST_PLACEHOLDER_IMAGE;
            return (_jsxs("div", { className: 'min-h-screen', children: [_jsx("div", { className: 'border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10', children: _jsx("div", { className: 'container mx-auto px-4 py-4', children: _jsx("div", { className: 'flex items-center gap-4', children: _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', icon: ArrowLeft, onClick: () => navigate(-1), children: t('artistDetails.back') }) }) }) }), _jsxs("div", { className: 'w-full lg:w-[70%] mx-auto h-[40vh] relative', children: [_jsx("img", { src: heroImage, alt: artist.name, className: 'w-full h-full object-cover' }), _jsx("div", { className: 'absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent' })] }), _jsx("div", { className: 'w-full lg:w-[70%] mx-auto px-4 py-8', children: _jsxs("div", { children: [_jsxs("div", { className: 'mb-8', children: [_jsx("h1", { className: 'text-4xl font-bold mb-4', children: artist.name }), _jsx("div", { className: 'flex flex-wrap gap-4 text-muted-foreground mb-6', children: artist.genre && (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Music, { className: 'h-4 w-4' }), _jsx("span", { children: artist.genre })] })) }), artist.bio && (_jsx("p", { className: 'text-muted-foreground leading-relaxed', children: artist.bio }))] }), upcomingEvents && upcomingEvents.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: 'text-2xl font-bold mb-4 flex items-center gap-2', children: [_jsx(Calendar, { className: 'h-6 w-6' }), t('artistDetails.upcomingEvents')] }), _jsx("div", { className: 'grid gap-4', children: upcomingEvents.map((event) => (_jsx(Card, { className: 'p-4 cursor-pointer hover:bg-muted/50 transition-colors', onClick: () => navigate(`/event/${event.id}`), children: _jsxs("div", { className: 'flex gap-4', children: [event.hero_image && (_jsx("img", { src: event.hero_image, alt: event.title, className: 'w-24 h-24 object-cover rounded' })), _jsxs("div", { className: 'flex-1', children: [_jsx("h3", { className: 'font-semibold text-lg mb-1', children: event.title }), event.venues?.name && (_jsx("p", { className: 'text-muted-foreground mb-2', children: event.venues.name })), _jsx("p", { className: 'text-sm text-muted-foreground', children: new Date(event.start_time).toLocaleDateString('en-US', {
                                                                        weekday: 'long',
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                    }) })] })] }) }, event.id))) })] }))] }) })] }));
        } }));
}
