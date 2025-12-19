import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
export const WizardPanel = ({ steps, currentStep: controlledStep, onStepChange, className, }) => {
    const [internalStep, setInternalStep] = useState(0);
    // Use controlled or uncontrolled step
    const currentStep = controlledStep !== undefined ? controlledStep : internalStep;
    const setCurrentStep = (step) => {
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
    return (_jsxs("div", { className: cn('relative w-full mt-20 mb-20', className), children: [canGoBack && (_jsxs(Button, { variant: 'ghost', size: 'sm', onClick: handleBack, className: 'absolute -top-12 left-0 text-muted-foreground hover:text-foreground transition-colors', children: [_jsx(ArrowLeft, { className: 'w-4 h-4 mr-2' }), "Back"] })), _jsx("div", { className: 'w-full', style: { marginTop: '20vh', marginBottom: '20vh' }, children: currentStepData?.content })] }));
};
// Export a hook for programmatic navigation
export const useWizardNavigation = () => {
    const [currentStep, setCurrentStep] = useState(0);
    return {
        currentStep,
        setCurrentStep,
        nextStep: () => setCurrentStep(prev => prev + 1),
        prevStep: () => setCurrentStep(prev => Math.max(0, prev - 1)),
        goToStep: (step) => setCurrentStep(step),
    };
};
