import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
/**
 * RelationCell - Displays a related entity with optional link
 *
 * Use for foreign key relationships (venue, organization, etc.)
 */
export function RelationCell({ value, label, href, external = false, emptyText = '—', }) {
    const displayText = label || value;
    if (!displayText) {
        return _jsx("span", { className: 'text-muted-foreground text-sm', children: emptyText });
    }
    if (!href) {
        return _jsx("span", { className: 'text-sm', children: displayText });
    }
    if (external) {
        return (_jsxs("a", { href: href, target: '_blank', rel: 'noopener noreferrer', className: 'inline-flex items-center gap-1 text-sm text-fm-gold hover:text-fm-gold/80 transition-colors', children: [displayText, _jsx(ExternalLink, { className: 'h-3 w-3' })] }));
    }
    return (_jsx(Link, { to: href, className: 'text-sm text-fm-gold hover:text-fm-gold/80 transition-colors', children: displayText }));
}
