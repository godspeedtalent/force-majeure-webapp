import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared';

/**
 * Converts text with newlines into React elements with proper line breaks
 */
const renderTextWithLineBreaks = (text: string): React.ReactNode => {
  const lines = text.split(/\n/);
  return lines.map((line, index) => (
    <span key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </span>
  ));
};

interface FmCommonExpandableTextProps {
  /** The text content to display */
  text: string;
  /** Number of lines to show when collapsed (default: 3) */
  lineClamp?: number;
  /** Additional CSS classes for the text */
  className?: string;
  /** Additional CSS classes for the container */
  containerClassName?: string;
  /** Label for "show more" button (default: "Show more") */
  showMoreLabel?: string;
  /** Label for "show less" button (default: "Show less") */
  showLessLabel?: string;
  /** Whether to preserve line breaks in the text (default: true) */
  preserveLineBreaks?: boolean;
}

/**
 * FmCommonExpandableText - A text component that truncates with ellipsis and allows expansion
 *
 * Features:
 * - Truncates text with line-clamp and ellipsis when collapsed
 * - Properly expands parent container when expanded (no overflow issues)
 * - Chevron icon that rotates on toggle
 * - Only shows toggle button when text actually overflows
 * - Customizable line clamp count
 * - Preserves paragraph breaks (newlines) in text
 *
 * Usage:
 * ```tsx
 * <FmCommonExpandableText
 *   text={venue.description}
 *   lineClamp={3}
 *   className="text-sm text-white/60 italic"
 * />
 * ```
 */
export const FmCommonExpandableText = ({
  text,
  lineClamp = 3,
  className,
  containerClassName,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  preserveLineBreaks = true,
}: FmCommonExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);

  // Measure the collapsed and full heights
  const measureHeights = useCallback(() => {
    if (measureRef.current && textRef.current) {
      const measureElement = measureRef.current;
      const lineHeight =
        parseFloat(getComputedStyle(measureElement).lineHeight) || 20;
      const maxCollapsedHeight = lineHeight * lineClamp;

      // Get full height from the hidden measure element
      const fullHeight = measureElement.scrollHeight;

      setCollapsedHeight(maxCollapsedHeight);
      setIsOverflowing(fullHeight > maxCollapsedHeight + 2); // 2px tolerance
    }
  }, [lineClamp]);

  // Check overflow on mount, text change, and window resize
  useEffect(() => {
    measureHeights();
    window.addEventListener('resize', measureHeights);
    return () => window.removeEventListener('resize', measureHeights);
  }, [text, lineClamp, measureHeights]);

  // Memoize the rendered content with line breaks
  const renderedContent = useMemo(
    () => (preserveLineBreaks ? renderTextWithLineBreaks(text) : text),
    [text, preserveLineBreaks]
  );

  return (
    <div className={cn('relative', containerClassName)}>
      {/* Hidden element to measure full text height */}
      <p
        ref={measureRef}
        aria-hidden='true'
        className={cn(
          'leading-relaxed font-canela absolute opacity-0 pointer-events-none',
          className
        )}
        style={{ width: '100%', visibility: 'hidden' }}
      >
        {renderedContent}
      </p>

      {/* Visible text with animated height */}
      <div
        className='overflow-hidden transition-[max-height] duration-300 ease-in-out'
        style={{
          maxHeight: isExpanded
            ? '2000px'
            : collapsedHeight
              ? `${collapsedHeight}px`
              : undefined,
        }}
      >
        <p
          ref={textRef}
          className={cn('leading-relaxed font-canela', className)}
        >
          {renderedContent}
        </p>
      </div>

      {/* Gradient fade when collapsed and overflowing */}
      {isOverflowing && !isExpanded && (
        <div className='absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/60 to-transparent pointer-events-none' />
      )}

      {isOverflowing && (
        <button
          type='button'
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-1 mt-2',
            'text-xs uppercase tracking-wider',
            'text-fm-gold/70 hover:text-fm-gold',
            'transition-colors duration-200',
            'group cursor-pointer'
          )}
        >
          <span>{isExpanded ? showLessLabel : showMoreLabel}</span>
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform duration-300',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
      )}
    </div>
  );
};
