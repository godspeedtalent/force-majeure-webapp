import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
/**
 * A reusable back button component with consistent styling
 * Can navigate to a specific path or use browser history
 */
export function FmCommonBackButton({ text, icon: Icon = ArrowLeft, to, onClick, variant = 'ghost', className, }) {
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const resolvedText = text || t('buttons.back');
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
        else if (to) {
            navigate(to);
        }
        else {
            navigate(-1);
        }
    };
    return (_jsxs(Button, { onClick: handleClick, variant: variant, className: cn('gap-2', className), children: [_jsx(Icon, { className: 'h-4 w-4' }), resolvedText] }));
}
