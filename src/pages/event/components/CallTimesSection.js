import { jsx as _jsx } from "react/jsx-runtime";
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonStackLayout } from '@/components/common/layout';
import { FmArtistRow, } from '@/components/artist/FmArtistRow';
export function CallTimesSection({ callTimeLineup, hasDescription, onArtistSelect, }) {
    if (callTimeLineup.length === 0) {
        return null;
    }
    return (_jsx(FmCommonCollapsibleSection, { title: 'Call times', defaultExpanded: true, className: !hasDescription ? 'lg:col-span-2' : '', children: _jsx(FmCommonStackLayout, { spacing: 'md', children: callTimeLineup.map((artist, index) => (_jsx(FmArtistRow, { artist: artist, onSelect: onArtistSelect }, `${artist.name}-${index}`))) }) }));
}
