import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FmTextLink } from './FmTextLink';
const BULLET_SEPARATOR = '\u2022';
export const FmUndercardList = ({ artists, onArtistClick, className = '', size = 'md', }) => {
    if (!artists || artists.length === 0) {
        return null;
    }
    const sizeClasses = size === 'sm' ? 'text-xs gap-x-2' : 'text-sm gap-x-3';
    return (_jsx("div", { className: `flex flex-wrap items-center gap-y-1 text-muted-foreground/75 ${sizeClasses} ${className}`, children: artists.map((artist, index) => (_jsxs("span", { className: 'flex items-center gap-2', children: [onArtistClick ? (_jsx(FmTextLink, { onClick: () => onArtistClick(artist), className: size === 'sm' ? 'text-xs' : 'text-sm', children: artist.name })) : (_jsx("span", { children: artist.name })), index < artists.length - 1 && (_jsx("span", { className: 'text-muted-foreground/40', children: BULLET_SEPARATOR }))] }, `${artist.id ?? artist.name}-${index}`))) }));
};
