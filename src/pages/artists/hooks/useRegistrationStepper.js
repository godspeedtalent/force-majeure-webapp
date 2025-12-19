import { useState, useEffect } from 'react';
export function useRegistrationStepper(carouselApi) {
    const [currentStep, setCurrentStep] = useState(0);
    // Sync carousel with current step
    useEffect(() => {
        if (carouselApi) {
            carouselApi.scrollTo(currentStep);
        }
    }, [currentStep, carouselApi]);
    // Track carousel changes
    useEffect(() => {
        if (!carouselApi)
            return;
        const onSelect = () => {
            setCurrentStep(carouselApi.selectedScrollSnap());
        };
        carouselApi.on('select', onSelect);
        onSelect();
        return () => {
            carouselApi.off('select', onSelect);
        };
    }, [carouselApi]);
    const handleNext = () => {
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };
    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };
    const goToStep = (step) => {
        setCurrentStep(Math.max(0, Math.min(step, 3)));
    };
    return {
        currentStep,
        handleNext,
        handlePrevious,
        goToStep,
    };
}
