import { jsx as _jsx } from "react/jsx-runtime";
import { FmImageCard } from '@/components/common/display/FmImageCard';
import { getImageUrl } from '@/shared';
export const MerchCard = ({ name, description, price, type, image_url, in_stock: _in_stock, children, onClick, }) => {
    return (_jsx(FmImageCard, { image: getImageUrl(image_url), imageAlt: name, title: name, subtitle: description
            ? undefined
            : `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`, badge: type, badgeVariant: 'secondary', onClick: onClick, showHoverEffect: !onClick, children: children }));
};
