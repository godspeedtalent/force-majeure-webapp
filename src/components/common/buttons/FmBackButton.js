import { jsx as _jsx } from "react/jsx-runtime";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FmCommonIconButton } from './FmCommonIconButton';
import { FmCommonButton } from './FmCommonButton';
import { cn } from '@/shared';
/**
 * FmBackButton
 *
 * Consistent back button component for navigation across the application.
 * Follows Force Majeure design system with gold accent colors and sharp edges.
 *
 * Features:
 * - Icon-only or text+icon variants
 * - Floating (absolute positioned) or inline positioning
 * - Default behavior: navigate(-1) using react-router
 * - Design system compliant: gold hover states, sharp corners, 20px positioning
 * - Built-in ripple effects and scale animations
 * - Accessible with tooltips and keyboard navigation
 *
 * @example
 * // Floating icon button (top-left corner)
 * <FmBackButton position="floating" tooltip="Back to list" />
 *
 * @example
 * // Inline text button (in header)
 * <FmBackButton variant="text" position="inline" label="Back" />
 *
 * @example
 * // Custom click handler
 * <FmBackButton onClick={() => navigate('/custom-route')} />
 */
export const FmBackButton = ({ variant = 'text', position = 'floating', onClick, tooltip, className, label, size = 'sm', }) => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const resolvedTooltip = tooltip ?? t('buttons.goBack');
    const resolvedLabel = label ?? t('buttons.back');
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
        else {
            navigate(-1);
        }
    };
    const positionClasses = position === 'floating' ? 'absolute top-[20px] left-[20px] z-20' : '';
    if (variant === 'icon') {
        return (_jsx("div", { className: cn(positionClasses, className), children: _jsx(FmCommonIconButton, { icon: ArrowLeft, onClick: handleClick, tooltip: resolvedTooltip, variant: 'default', size: size }) }));
    }
    return (_jsx("div", { className: cn(positionClasses, className), children: _jsx(FmCommonButton, { icon: ArrowLeft, iconPosition: 'left', onClick: handleClick, variant: 'default', size: size, children: resolvedLabel }) }));
};
