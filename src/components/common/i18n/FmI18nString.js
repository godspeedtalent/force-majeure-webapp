import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/common/shadcn/skeleton';
import { cn } from '@/shared';
/**
 * FmI18nString - A component that handles i18n loading states with skeleton placeholders.
 *
 * This component solves the problem of translation keys briefly appearing on screen
 * before the translation files are loaded. It shows a skeleton placeholder while
 * translations are loading, then smoothly transitions to the translated text.
 *
 * **Features:**
 * - Automatic skeleton sizing based on translation key length
 * - Support for all translation namespaces
 * - Interpolation support for dynamic values
 * - Customizable skeleton appearance
 * - Smooth fade-in animation when loaded
 *
 * @example
 * // Basic usage
 * <FmI18nString i18nKey="nav.home" />
 *
 * @example
 * // With custom namespace
 * <FmI18nString i18nKey="profile.title" ns="pages" />
 *
 * @example
 * // With interpolation values
 * <FmI18nString
 *   i18nKey="welcome.greeting"
 *   values={{ name: 'John', count: 5 }}
 * />
 *
 * @example
 * // As heading with custom styling
 * <FmI18nString
 *   i18nKey="event.title"
 *   as="h1"
 *   className="text-4xl font-canela text-fm-gold"
 *   skeletonWidth="200px"
 * />
 *
 * @example
 * // With fallback text
 * <FmI18nString
 *   i18nKey="experimental.feature"
 *   fallback="New Feature"
 * />
 */
export const FmI18nString = ({ i18nKey, ns = 'common', values, className, skeletonClassName, as: Component = 'span', skeletonWidth, skeletonHeight = '1em', children, fallback, }) => {
    const { t, ready } = useTranslation(ns);
    // Calculate estimated skeleton width based on key if not provided
    // This provides a reasonable approximation of text width
    const estimatedWidth = skeletonWidth || `${Math.min(i18nKey.length * 8, 200)}px`;
    // Show skeleton while translations are loading
    if (!ready) {
        return (_jsx(Skeleton, { className: cn('inline-block rounded-none', // Sharp corners per design system
            skeletonClassName), style: {
                width: estimatedWidth,
                height: skeletonHeight,
            } }));
    }
    // Get the translated string
    const translatedText = t(i18nKey, values);
    // Check if translation was found (i18next returns the key if not found)
    const isTranslationMissing = translatedText === i18nKey;
    const displayText = isTranslationMissing && fallback ? fallback : translatedText;
    return (_jsxs(Component, { className: cn('transition-opacity duration-200', // Smooth fade-in
        'animate-in fade-in', className), children: [displayText, children] }));
};
/**
 * Type-safe namespace-specific variants for common use cases
 */
export const FmI18nCommon = (props) => (_jsx(FmI18nString, { ...props, ns: "common" }));
export const FmI18nPages = (props) => (_jsx(FmI18nString, { ...props, ns: "pages" }));
export const FmI18nValidation = (props) => (_jsx(FmI18nString, { ...props, ns: "validation" }));
export const FmI18nToasts = (props) => (_jsx(FmI18nString, { ...props, ns: "toasts" }));
export default FmI18nString;
