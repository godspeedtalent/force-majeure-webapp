import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FmBadge } from './FmBadge';
import { cn } from '@/shared';
const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
};
/**
 * FmCommonBadgeGroup Component
 *
 * A reusable component for displaying groups of FmBadge components.
 * Commonly used for artists, genres, tags, etc.
 * Supports limiting display count with expandable "+X more" indicator.
 *
 * Composed of: FmBadge components
 */
export function FmCommonBadgeGroup({ badges, maxDisplay, className, badgeClassName, gap = 'md', wrap = true, pageSize = 5, }) {
    const [currentDisplay, setCurrentDisplay] = useState(maxDisplay);
    if (!badges || badges.length === 0) {
        return null;
    }
    const displayCount = currentDisplay || badges.length;
    const displayBadges = badges.slice(0, displayCount);
    const remainingCount = badges.length > displayCount ? badges.length - displayCount : 0;
    const handleExpand = () => {
        if (currentDisplay) {
            setCurrentDisplay(Math.min(currentDisplay + pageSize, badges.length));
        }
    };
    return (_jsxs("div", { className: cn('flex items-center', gapClasses[gap], wrap && 'flex-wrap', className), children: [displayBadges.map((badge, index) => (_jsx(FmBadge, { label: badge.label, variant: badge.variant || 'secondary', className: cn(badgeClassName, badge.className) }, index))), remainingCount > 0 && (_jsx("button", { onClick: handleExpand, className: 'inline-flex', children: _jsx(FmBadge, { label: `+${remainingCount} more`, variant: 'secondary', className: cn('opacity-70 cursor-pointer', badgeClassName) }) }))] }));
}
