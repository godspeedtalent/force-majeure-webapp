import { ReactNode, ElementType } from 'react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/common/shadcn/skeleton';
import { cn } from '@/shared';

type TranslationNamespace = 'common' | 'pages' | 'validation' | 'toasts';

interface FmI18nStringProps {
  /**
   * The translation key (e.g., 'nav.home' or 'profilePage.title')
   */
  i18nKey: string;

  /**
   * The translation namespace (default: 'common')
   */
  ns?: TranslationNamespace;

  /**
   * Interpolation values for dynamic translations
   * @example { name: 'John', count: 5 }
   */
  values?: Record<string, string | number>;

  /**
   * Additional CSS classes for the text element
   */
  className?: string;

  /**
   * Additional CSS classes for the skeleton element
   */
  skeletonClassName?: string;

  /**
   * The HTML element to render (default: 'span')
   */
  as?: ElementType;

  /**
   * Width of the skeleton (default: auto-calculated from key)
   * Can be a percentage, pixel value, or tailwind class
   */
  skeletonWidth?: string;

  /**
   * Height of the skeleton (default: '1em' to match text)
   */
  skeletonHeight?: string;

  /**
   * Optional children to render alongside the translated string
   */
  children?: ReactNode;

  /**
   * Fallback text to display if translation is not found
   * If not provided, the key will be displayed as fallback
   */
  fallback?: string;
}

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
export const FmI18nString = ({
  i18nKey,
  ns = 'common',
  values,
  className,
  skeletonClassName,
  as: Component = 'span',
  skeletonWidth,
  skeletonHeight = '1em',
  children,
  fallback,
}: FmI18nStringProps) => {
  const { t, ready } = useTranslation(ns);

  // Calculate estimated skeleton width based on key if not provided
  // This provides a reasonable approximation of text width
  const estimatedWidth = skeletonWidth || `${Math.min(i18nKey.length * 8, 200)}px`;

  // Show skeleton while translations are loading
  if (!ready) {
    return (
      <Skeleton
        className={cn(
          'inline-block rounded-none', // Sharp corners per design system
          skeletonClassName
        )}
        style={{
          width: estimatedWidth,
          height: skeletonHeight,
        }}
      />
    );
  }

  // Get the translated string
  const translatedText = t(i18nKey, values);

  // Check if translation was found (i18next returns the key if not found)
  const isTranslationMissing = translatedText === i18nKey;
  const displayText = isTranslationMissing && fallback ? fallback : translatedText;

  return (
    <Component
      className={cn(
        'transition-opacity duration-200', // Smooth fade-in
        'animate-in fade-in',
        className
      )}
    >
      {displayText}
      {children}
    </Component>
  );
};

/**
 * Type-safe namespace-specific variants for common use cases
 */
export const FmI18nCommon = (props: Omit<FmI18nStringProps, 'ns'>) => (
  <FmI18nString {...props} ns="common" />
);

export const FmI18nPages = (props: Omit<FmI18nStringProps, 'ns'>) => (
  <FmI18nString {...props} ns="pages" />
);

export const FmI18nValidation = (props: Omit<FmI18nStringProps, 'ns'>) => (
  <FmI18nString {...props} ns="validation" />
);

export const FmI18nToasts = (props: Omit<FmI18nStringProps, 'ns'>) => (
  <FmI18nString {...props} ns="toasts" />
);
