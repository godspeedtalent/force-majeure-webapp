import { FmGoldenGridLoader } from './FmGoldenGridLoader';

interface FmCommonLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * @deprecated Use FmGoldenGridLoader directly instead.
 *
 * This component now wraps FmGoldenGridLoader for backwards compatibility.
 * Migrate to FmGoldenGridLoader which supports an additional 'xl' size.
 *
 * @example
 * ```tsx
 * // Old (deprecated)
 * import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
 * <FmCommonLoadingSpinner size="md" />
 *
 * // New (preferred)
 * import { FmGoldenGridLoader } from '@/components/common/feedback/FmGoldenGridLoader';
 * <FmGoldenGridLoader size="md" />
 * ```
 */
export function FmCommonLoadingSpinner({
  size = 'md',
  className,
}: FmCommonLoadingSpinnerProps) {
  return <FmGoldenGridLoader size={size} className={className} />;
}
