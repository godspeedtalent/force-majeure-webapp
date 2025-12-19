import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
const layoutClasses = {
    stack: 'space-y-[20px]',
    'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-[20px]',
    'grid-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]',
    inline: 'flex flex-wrap gap-[20px]',
};
const paddingClasses = {
    sm: 'p-[10px]',
    md: 'p-[20px]',
    lg: 'p-[40px]',
};
const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
};
const opacityClasses = {
    light: 'bg-card/10',
    medium: 'bg-card/20',
    dark: 'bg-card/30',
};
export const FmFormFieldGroup = ({ title, description, icon: Icon, children, layout = 'stack', className, contentClassName, padding = 'md', required = false, blur = 'lg', opacity = 'medium', }) => {
    return (_jsxs("div", { className: cn(
        // Base container styling - frosted glass effect
        'rounded-none border border-border/30', opacityClasses[opacity], blurClasses[blur], paddingClasses[padding], className), children: [(title || description) && (_jsxs("div", { className: 'mb-[20px]', children: [title && (_jsxs("div", { className: 'flex items-center gap-2', children: [Icon && _jsx(Icon, { className: 'w-5 h-5 text-fm-gold' }), _jsxs("h3", { className: 'text-lg font-canela font-medium text-foreground', children: [title, required && _jsx("span", { className: 'text-destructive ml-1', children: "*" })] })] })), description && (_jsx("p", { className: 'text-sm text-muted-foreground mt-1', children: description }))] })), _jsx("div", { className: cn(layoutClasses[layout], contentClassName), children: children })] }));
};
/**
 * Preset variants for common use cases
 */
/** Contact information group (name, email, phone) */
export const FmContactFieldGroup = ({ children, ...props }) => (_jsx(FmFormFieldGroup, { title: 'Contact Information', layout: 'grid-2', ...props, children: children }));
/** Address fields group */
export const FmAddressFieldGroup = ({ children, ...props }) => (_jsx(FmFormFieldGroup, { title: 'Address', layout: 'grid-2', ...props, children: children }));
/** Account/credentials group (password, etc.) */
export const FmAccountFieldGroup = ({ children, ...props }) => (_jsx(FmFormFieldGroup, { title: 'Account Security', layout: 'stack', ...props, children: children }));
/** Social media links group */
export const FmSocialLinksFieldGroup = ({ children, ...props }) => (_jsx(FmFormFieldGroup, { title: 'Social Media', layout: 'grid-2', ...props, children: children }));
