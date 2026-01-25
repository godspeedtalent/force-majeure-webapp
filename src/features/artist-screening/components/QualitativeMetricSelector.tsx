import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import {
  ChevronDown,
  ChevronsDown,
  Minus,
  ChevronUp,
  ChevronsUp,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { QUALITATIVE_RATING_OPTIONS } from '../config/reviewMetrics';
import type {
  QualitativeScore,
  ReviewMetricConfig,
} from '../types';

interface QualitativeMetricSelectorProps {
  metric: ReviewMetricConfig;
  value: QualitativeScore;
  onChange: (value: QualitativeScore) => void;
}

const RATING_ICONS: Record<QualitativeScore, LucideIcon> = {
  0: ChevronsDown,
  1: ChevronDown,
  2: Minus,
  3: ChevronUp,
  4: ChevronsUp,
};

export function QualitativeMetricSelector({
  metric,
  value,
  onChange,
}: QualitativeMetricSelectorProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5">
      <div>
        <p className="text-sm font-medium text-white">{metric.title}</p>
        <p className="text-xs text-white/60">{metric.descriptor}</p>
      </div>

      <TooltipProvider delayDuration={120}>
        <div
          role="radiogroup"
          aria-label={metric.title}
          className="grid gap-2 sm:grid-cols-5"
        >
          {QUALITATIVE_RATING_OPTIONS.map(option => {
            const selected = option.value === value;
            const Icon = RATING_ICONS[option.value];
            return (
              <Tooltip key={option.value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${metric.title}: ${option.label}`}
                    onClick={() => onChange(option.value)}
                    className={cn(
                      'group flex flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-[10px] font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/40',
                      selected
                        ? 'border-fm-gold/50 bg-fm-gold/15 text-white shadow-[0_0_15px_rgba(212,177,106,0.25)]'
                        : 'border-white/10 bg-black/40 text-white/70 hover:border-white/30 hover:text-white'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        selected
                          ? 'text-fm-gold'
                          : 'text-current group-hover:text-white'
                      )}
                    />
                    <span>{option.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="max-w-xs border-white/20 bg-black/95 text-xs text-white">
                  {metric.tooltips[option.value]}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
