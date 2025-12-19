import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Share2, Heart, Clock, MapPin } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { BULLET_SEPARATOR } from './constants';
export function EventHeader({ displayTitle, weekdayLabel, monthLabel, dayNumber, yearNumber, undercard, longDateLabel, formattedTime, venue, onShare, onVenueClick, onArtistClick, }) {
    const { t } = useTranslation('common');
    return (_jsx("div", { className: 'flex flex-col gap-5', children: _jsxs("div", { className: 'flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between', children: [_jsxs("div", { className: 'flex flex-wrap items-center gap-4 lg:flex-nowrap', children: [_jsx(FmDateBox, { weekday: weekdayLabel, month: monthLabel, day: dayNumber, year: yearNumber, size: 'lg' }), _jsxs("div", { className: 'space-y-3', children: [_jsx("h1", { className: 'text-3xl lg:text-4xl font-canela font-medium text-foreground leading-tight', children: displayTitle }), _jsx(FmUndercardList, { artists: undercard, onArtistClick: artist => onArtistClick({
                                        id: artist.id ?? undefined,
                                        name: artist.name,
                                        genre: artist.genre,
                                        image: artist.image,
                                    }) }), _jsxs("div", { className: 'flex flex-col gap-1.5 text-sm text-muted-foreground/90 sm:flex-row sm:flex-wrap sm:items-center', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Clock, { className: 'h-4 w-4 text-fm-gold flex-shrink-0' }), _jsx("span", { children: `${longDateLabel} ${BULLET_SEPARATOR} ${formattedTime}` })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(MapPin, { className: 'h-4 w-4 text-fm-gold flex-shrink-0' }), _jsx(FmTextLink, { onClick: onVenueClick, children: venue || t('eventHeader.venueTBA') })] })] })] })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(FmCommonButton, { "aria-label": t('eventHeader.shareEvent'), variant: 'secondary', size: 'icon', onClick: onShare, className: 'bg-white/5 text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground', children: _jsx(Share2, { className: 'h-4 w-4' }) }), _jsx(FmCommonButton, { "aria-label": t('eventHeader.saveEvent'), variant: 'secondary', size: 'icon', className: 'bg-white/5 text-muted-foreground transition-colors duration-200 hover:bg-white/10 hover:text-foreground', children: _jsx(Heart, { className: 'h-4 w-4' }) })] })] }) }));
}
