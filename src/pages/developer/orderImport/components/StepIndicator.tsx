import React from 'react';
import { cn } from '@/shared';

interface StepIndicatorProps {
  currentStep: string;
  steps: readonly string[];
  onStepClick: (step: string) => void;
  t: (key: string) => string;
}

export function StepIndicator({
  currentStep,
  steps,
  onStepClick,
  t,
}: StepIndicatorProps) {
  const currentIdx = steps.indexOf(currentStep);

  return (
    <div className='flex items-center justify-center gap-2 text-sm pt-6'>
      {steps.map((s, idx) => {
        const isCompleted = currentIdx > idx;
        const isCurrent = currentStep === s;
        const isClickable = isCompleted;

        return (
          <React.Fragment key={s}>
            <button
              type='button'
              onClick={() => isClickable && onStepClick(s)}
              disabled={!isClickable}
              className={cn(
                'px-3 py-1.5 border backdrop-blur-sm transition-all duration-200',
                'bg-black/40',
                isCurrent && 'bg-fm-gold/90 text-black border-fm-gold font-medium',
                isCompleted && !isCurrent && 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30 cursor-pointer',
                !isCompleted && !isCurrent && 'text-muted-foreground border-white/20 cursor-default'
              )}
            >
              {t(`orderCsvImport.steps.${s}`)}
            </button>
            {idx < steps.length - 1 && <div className='w-8 h-px bg-white/20' />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
