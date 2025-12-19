import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared';
import { FmCommonRow } from '@/components/common/layout/FmCommonRow';
export const FmArtistRow = ({ artist, onSelect, variant = 'default' }) => {
    const initials = artist.name
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const handleClick = () => {
        if (onSelect) {
            onSelect(artist);
        }
    };
    const isFeatured = variant === 'featured';
    return (_jsx(FmCommonRow, { leading: _jsx("div", { className: cn('relative overflow-hidden rounded-full flex items-center justify-center uppercase', isFeatured
                ? 'h-14 w-14 border-2 border-fm-gold/60 bg-fm-gold/10 text-sm font-bold text-fm-gold shadow-[0_0_12px_rgba(223,186,125,0.3)]'
                : 'h-10 w-10 border border-border/50 bg-background/80 text-xs font-semibold text-fm-gold'), children: artist.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            _jsx("img", { src: artist.image, alt: artist.name, className: 'h-full w-full object-cover' })) : (_jsx("span", { children: initials })) }), title: artist.name, titleClassName: isFeatured ? 'text-base font-semibold text-fm-gold' : undefined, subtitle: artist.roleLabel, subtitleClassName: isFeatured ? 'text-fm-gold/70' : undefined, trailing: artist.callTime ? (_jsx("span", { className: cn('rounded-full px-2 py-1 font-semibold uppercase tracking-wide', isFeatured
                ? 'bg-fm-gold/20 text-xs text-fm-gold border border-fm-gold/40'
                : 'bg-fm-gold/10 text-[10px] text-fm-gold'), children: artist.callTime })) : undefined, onClick: onSelect ? handleClick : undefined, className: cn('rounded-none', isFeatured && 'bg-fm-gold/5 border border-fm-gold/20 p-3') }));
};
