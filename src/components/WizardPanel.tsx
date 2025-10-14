import { ArrowLeft } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { Button } from './ui/button';

import { cn } from '@/shared/utils/utils';

export interface WizardStep {
  content: ReactNode;
  canGoBack?: boolean;
}

interface WizardPanelProps {
  steps: WizardStep[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

export const WizardPanel = ({
  steps,
  currentStep: controlledStep,
  onStepChange,
  className,
}: WizardPanelProps) => {
  const [internalStep, setInternalStep] = useState(0);

  // Use controlled or uncontrolled step
  const currentStep =
    controlledStep !== undefined ? controlledStep : internalStep;
  const setCurrentStep = (step: number) => {
    if (controlledStep === undefined) {
      setInternalStep(step);
    }
    onStepChange?.(step);
  };

  const currentStepData = steps[currentStep];
  const canGoBack = currentStep > 0 && currentStepData?.canGoBack !== false;

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className={cn('relative w-full mt-20 mb-20', className)}>
      {/* Back Button */}
      {canGoBack && (
        <Button
          variant='ghost'
          size='sm'
          onClick={handleBack}
          className='absolute -top-12 left-0 text-muted-foreground hover:text-foreground transition-colors'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back
        </Button>
      )}

      {/* Step Content */}
      <div
        className='w-full'
        style={{ marginTop: '20vh', marginBottom: '20vh' }}
      >
        {currentStepData?.content}
      </div>
    </div>
  );
};

// Export a hook for programmatic navigation
export const useWizardNavigation = () => {
  const [currentStep, setCurrentStep] = useState(0);

  return {
    currentStep,
    setCurrentStep,
    nextStep: () => setCurrentStep(prev => prev + 1),
    prevStep: () => setCurrentStep(prev => Math.max(0, prev - 1)),
    goToStep: (step: number) => setCurrentStep(step),
  };
};
