import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ArtistProfile Component
 *
 * A reusable component for displaying artist profiles.
 * Used in both the artist profile page (/artists/{artist-id}) and the registration preview.
 */
import { useTranslation } from 'react-i18next';
import { Music2, ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/shared';
import { FmI18nCommon } from '@/components/common/i18n';
/**
 * Artist profile display component
 *
 * @example
 * ```tsx
 * <ArtistProfile
 *   artist={{
 *     name: "DJ Example",
 *     bio: "Electronic music producer...",
 *     imageUrl: "/path/to/image.jpg",
 *     primaryGenre: "Techno",
 *     socialLinks: { instagram: "djexample", soundcloud: "djexample" }
 *   }}
 * />
 * ```
 */
export const ArtistProfile = ({ artist, compact = false, className, isPreview = false, }) => {
    const { t } = useTranslation('common');
    const hasImage = artist.imageUrl && artist.imageUrl.trim() !== '';
    const hasBio = artist.bio && artist.bio.trim() !== '';
    const hasGenre = artist.primaryGenre && artist.primaryGenre.trim() !== '';
    return (_jsxs("div", { className: cn('w-full h-full flex flex-col', compact ? 'gap-[20px]' : 'gap-[40px]', className), children: [_jsxs("div", { className: 'space-y-[10px]', children: [_jsx("h1", { className: cn('font-canela tracking-tight', compact ? 'text-4xl' : 'text-6xl md:text-7xl'), children: artist.name || (isPreview ? t('artistProfile.yourArtistName') : t('artistProfile.artistName')) }), hasGenre && (_jsxs("div", { className: 'flex items-center gap-[10px]', children: [_jsx(Music2, { className: 'h-4 w-4 text-fm-gold' }), _jsx("p", { className: 'font-canela text-sm text-fm-gold uppercase tracking-wider', children: artist.primaryGenre })] }))] }), hasImage ? (_jsxs("div", { className: cn('relative w-full bg-black/60 backdrop-blur-sm border border-white/20 rounded-none overflow-hidden', compact ? 'h-[300px]' : 'h-[400px] md:h-[500px]'), children: [_jsx("img", { src: artist.imageUrl || '', alt: artist.name, className: 'w-full h-full object-cover' }), _jsx("div", { className: 'absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' })] })) : (_jsx("div", { className: cn('relative w-full bg-black/60 backdrop-blur-sm border border-white/20 rounded-none flex items-center justify-center', compact ? 'h-[300px]' : 'h-[400px] md:h-[500px]'), children: _jsxs("div", { className: 'text-center space-y-[10px]', children: [_jsx(Music2, { className: 'h-16 w-16 text-fm-gold/30 mx-auto' }), _jsx("p", { className: 'font-canela text-muted-foreground text-sm uppercase tracking-wider', children: isPreview ? t('artistProfile.uploadYourPhoto') : t('artistProfile.artistPhoto') })] }) })), _jsxs("div", { className: 'space-y-[10px]', children: [_jsx(FmI18nCommon, { i18nKey: 'artistProfile.about', as: 'h2', className: 'font-canela text-2xl' }), _jsx("div", { className: 'bg-black/60 backdrop-blur-sm border border-white/20 rounded-none p-[20px]', children: _jsx("p", { className: cn('font-canela leading-relaxed', compact ? 'text-sm' : 'text-base', hasBio ? 'text-foreground' : 'text-muted-foreground italic'), children: hasBio
                                ? artist.bio
                                : isPreview
                                    ? t('artistProfile.bioPreviewPlaceholder')
                                    : t('artistProfile.noBioAvailable') }) })] }), artist.genres && artist.genres.length > 0 && (_jsxs("div", { className: 'space-y-[10px]', children: [_jsx(FmI18nCommon, { i18nKey: 'artistProfile.genres', as: 'h3', className: 'font-canela text-xl' }), _jsx("div", { className: 'flex flex-wrap gap-[10px]', children: artist.genres.map((genre, index) => (_jsx("div", { className: 'px-[15px] py-[8px] bg-black/60 backdrop-blur-sm border border-white/20 rounded-none', children: _jsx("span", { className: 'font-canela text-sm text-muted-foreground uppercase tracking-wider', children: genre }) }, index))) })] })), artist.website && (_jsxs("div", { className: 'space-y-[10px]', children: [_jsx(FmI18nCommon, { i18nKey: 'artistProfile.connect', as: 'h3', className: 'font-canela text-xl' }), _jsx("div", { className: 'flex flex-wrap gap-[10px]', children: _jsxs("a", { href: artist.website ?? undefined, target: '_blank', rel: 'noopener noreferrer', className: 'flex items-center gap-[10px] px-[15px] py-[10px] bg-black/60 backdrop-blur-sm border border-white/20 rounded-none hover:border-fm-gold hover:bg-fm-gold/10 transition-all duration-300', children: [_jsx(Globe, { className: 'h-4 w-4' }), _jsx("span", { className: 'font-canela text-sm', children: t('artistProfile.website') }), _jsx(ExternalLink, { className: 'h-3 w-3 text-muted-foreground' })] }) })] }))] }));
};
