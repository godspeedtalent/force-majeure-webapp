import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared';

interface HeaderPreset {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  trailing?: ReactNode;
}

export interface FmDynamicStickyHeaderProps {
  /** Optional structured configuration for the primary (large) header */
  primary?: HeaderPreset;
  /** Custom node to render as the primary header */
  primaryContent?: ReactNode;
  /** Optional structured configuration for the compact sticky header */
  sticky?: HeaderPreset;
  /** Custom node to render as the compact sticky header */
  stickyContent?: ReactNode;
  /** Override the distance (in px) needed for the transition to complete */
  transitionDistance?: number;
  /** If provided, listen to scroll events on this container instead of auto-detecting */
  scrollContainerRef?: React.RefObject<HTMLElement>;
  /** Offset from the top edge when sticky (supports px, rem, etc.) */
  stickyOffset?: number | string;
  className?: string;
  primaryClassName?: string;
  stickyClassName?: string;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const OVERFLOW_REGEX = /(auto|scroll|overlay)/;
const PROGRESS_EPSILON = 0.01;

const renderPreset = (preset: HeaderPreset, variant: 'primary' | 'sticky') => {
  if (variant === 'primary') {
    return (
      <div className='space-y-4'>
        {preset.eyebrow && (
          <p className='text-xs uppercase tracking-[0.35em] text-muted-foreground/80'>
            {preset.eyebrow}
          </p>
        )}

        <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div className='space-y-2'>
            <h2 className='text-2xl font-canela font-medium text-foreground'>
              {preset.title}
            </h2>
            {preset.subtitle && (
              <p className='text-sm text-muted-foreground/90'>
                {preset.subtitle}
              </p>
            )}
          </div>

          {preset.trailing && (
            <div className='sm:flex-shrink-0'>{preset.trailing}</div>
          )}
        </div>

        {preset.meta && (
          <div className='text-sm text-muted-foreground/90'>{preset.meta}</div>
        )}
      </div>
    );
  }

  return (
    <div className='flex items-center justify-between gap-3'>
      <div className='min-w-0 space-y-1'>
        {preset.eyebrow && (
          <p className='text-[10px] uppercase tracking-[0.35em] text-muted-foreground/80'>
            {preset.eyebrow}
          </p>
        )}
        <h3 className='truncate text-sm font-semibold text-foreground'>
          {preset.title}
        </h3>
        {preset.meta && (
          <div className='text-xs text-muted-foreground/80'>{preset.meta}</div>
        )}
      </div>

      {preset.trailing && (
        <div className='flex-shrink-0'>{preset.trailing}</div>
      )}
    </div>
  );
};

const findScrollParent = (element: HTMLElement | null): HTMLElement | null => {
  if (typeof window === 'undefined' || !element) {
    return null;
  }

  let parent = element.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`;

    if (OVERFLOW_REGEX.test(overflow)) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
};

export const FmDynamicStickyHeader = ({
  primary,
  primaryContent,
  sticky,
  stickyContent,
  transitionDistance,
  scrollContainerRef,
  stickyOffset = 0,
  className,
  primaryClassName,
  stickyClassName,
}: FmDynamicStickyHeaderProps) => {
  const mainRef = useRef<HTMLDivElement>(null);
  const stickyInnerRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0);
  const [stickyHeight, setStickyHeight] = useState(0);
  const [scrollElement, setScrollElement] = useState<
    HTMLElement | Window | null
  >(null);

  const initialOffsetRef = useRef<number | null>(null);
  const distanceRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  const hasSticky = Boolean(stickyContent || sticky);

  const primaryNode = useMemo(() => {
    if (primaryContent) {
      return primaryContent;
    }

    if (primary) {
      return renderPreset(primary, 'primary');
    }

    return null;
  }, [primaryContent, primary]);

  const stickyNode = useMemo(() => {
    if (!hasSticky) {
      return null;
    }

    if (stickyContent) {
      return stickyContent;
    }

    if (sticky) {
      return renderPreset(sticky, 'sticky');
    }

    return null;
  }, [hasSticky, stickyContent, sticky]);

  const updateStickyHeight = useCallback(() => {
    if (!hasSticky) {
      setStickyHeight(0);
      return;
    }

    const node = stickyInnerRef.current;
    if (!node) {
      return;
    }

    const { height } = node.getBoundingClientRect();
    setStickyHeight(height);
  }, [hasSticky]);

  const recomputeBaseline = useCallback(
    (root: HTMLElement | Window) => {
      const main = mainRef.current;
      if (!main) return;

      const mainRect = main.getBoundingClientRect();
      const rootTop =
        root instanceof Window ? 0 : root.getBoundingClientRect().top;

      initialOffsetRef.current = mainRect.top - rootTop;

      const distance = transitionDistance ?? mainRect.height;
      distanceRef.current = distance > 0 ? distance : 1;
    },
    [transitionDistance]
  );

  const updateProgress = useCallback(
    (root: HTMLElement | Window) => {
      const main = mainRef.current;
      if (!main) return;

      const mainRect = main.getBoundingClientRect();
      const rootTop =
        root instanceof Window ? 0 : root.getBoundingClientRect().top;
      const currentTop = mainRect.top - rootTop;

      if (initialOffsetRef.current === null) {
        initialOffsetRef.current = currentTop;
      }

      if (distanceRef.current === null) {
        const distance = transitionDistance ?? mainRect.height;
        distanceRef.current = distance > 0 ? distance : 1;
      }

      const diff = (initialOffsetRef.current ?? 0) - currentTop;
      const distance = distanceRef.current ?? 1;
      const next = clamp01(distance === 0 ? 0 : diff / distance);

      if (Math.abs(next - progressRef.current) > PROGRESS_EPSILON) {
        progressRef.current = next;
        setProgress(next);
      }
    },
    [transitionDistance]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const assignScrollElement = () => {
      const main = mainRef.current;
      if (!main) return;

      const provided = scrollContainerRef?.current;
      const resolved = provided ?? findScrollParent(main) ?? window;

      setScrollElement(prev => (prev === resolved ? prev : resolved));
    };

    const frame = window.requestAnimationFrame(assignScrollElement);
    return () => window.cancelAnimationFrame(frame);
  }, [scrollContainerRef]);

  useEffect(() => {
    if (typeof window === 'undefined' || !stickyNode) {
      return;
    }

    const observer = new ResizeObserver(updateStickyHeight);
    const node = stickyInnerRef.current;

    if (node) {
      observer.observe(node);
      updateStickyHeight();
    }

    return () => observer.disconnect();
  }, [stickyNode, updateStickyHeight]);

  useEffect(() => {
    if (typeof window === 'undefined' || !scrollElement) {
      return;
    }

    const root = scrollElement;
    const target = root instanceof Window ? window : root;

    const handleScroll = () => updateProgress(root);
    const handleResize = () => {
      recomputeBaseline(root);
      updateProgress(root);
      updateStickyHeight();
    };

    recomputeBaseline(root);
    updateProgress(root);
    updateStickyHeight();

    target.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      target.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [scrollElement, recomputeBaseline, updateProgress, updateStickyHeight]);

  useEffect(() => {
    if (typeof window === 'undefined' || !scrollElement) {
      return;
    }

    const main = mainRef.current;
    if (!main) {
      return;
    }

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      recomputeBaseline(scrollElement);
      updateProgress(scrollElement);
    });

    observer.observe(main);

    return () => observer.disconnect();
  }, [scrollElement, recomputeBaseline, updateProgress]);

  if (!primaryNode) {
    return null;
  }

  return (
    <div className={cn('relative w-full min-w-0 overflow-hidden', className)}>
      <div
        ref={mainRef}
        className={cn(
          'relative transition-none will-change-[opacity,transform] w-full min-w-0',
          primaryClassName
        )}
        style={{
          opacity: 1 - progress,
          transform: `translateY(-${progress * 32}px)`,
          pointerEvents: progress >= 1 ? 'none' : 'auto',
        }}
      >
        {primaryNode}
      </div>

      {stickyNode && (
        <div
          className='sticky z-30'
          style={{
            top:
              typeof stickyOffset === 'number'
                ? `${stickyOffset}px`
                : stickyOffset,
            height: stickyHeight,
            marginTop: -stickyHeight,
            pointerEvents: progress <= 0 ? 'none' : 'auto',
          }}
        >
          <div
            ref={stickyInnerRef}
            className={cn(
              'transition-none will-change-[opacity,transform] w-full min-w-0 overflow-hidden',
              stickyClassName
            )}
            style={{
              opacity: progress,
              transform: `translateY(${(1 - progress) * 16}px)`,
            }}
          >
            {stickyNode}
          </div>
        </div>
      )}
    </div>
  );
};
