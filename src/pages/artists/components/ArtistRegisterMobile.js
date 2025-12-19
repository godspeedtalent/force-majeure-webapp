import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/shared';
import { Carousel, CarouselContent, CarouselItem, } from '@/components/common/shadcn/carousel';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { BasicDetailsStep } from './registration-steps/BasicDetailsStep';
import { SocialImagesStep } from './registration-steps/SocialImagesStep';
import { MusicStep } from './registration-steps/MusicStep';
import { PerformanceHistoryStep } from './registration-steps/PerformanceHistoryStep';
import { TermsStep } from './registration-steps/TermsStep';
import { MobilePreviewPanel } from './MobilePreviewPanel';
export function ArtistRegisterMobile({ formData, currentStep, stepTitles, setCarouselApi, handleInputChange, handleNext, handlePrevious, handleSubmit, isSubmitting, genreBadges, setCurrentStep, previewExpanded, setPreviewExpanded, }) {
    const navigate = useNavigate();
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: 'fixed inset-0 top-0 flex flex-col', children: [_jsx(TopographicBackground, { opacity: 0.35 }), _jsxs("div", { className: 'relative z-10 flex items-center justify-between h-[60px] px-[20px] border-b border-white/10 flex-shrink-0', children: [_jsxs("button", { onClick: () => navigate('/artists/signup'), className: 'text-white/70 hover:text-fm-gold transition-colors duration-300 flex items-center gap-[10px] font-canela text-sm', children: [_jsx(ArrowLeft, { className: 'h-4 w-4' }), "Back"] }), _jsxs("div", { className: 'flex flex-col items-end', children: [_jsxs("span", { className: 'font-canela text-sm text-muted-foreground', children: ["Step ", currentStep + 1, " of 5"] }), _jsx("span", { className: 'font-canela text-xs text-muted-foreground/70', children: stepTitles[currentStep] })] })] }), _jsx("div", { className: 'relative z-10 flex-1 min-h-0 pb-[110px]', children: _jsx(Carousel, { setApi: setCarouselApi, opts: {
                                align: 'start',
                                watchDrag: false,
                            }, className: 'h-full [&>div]:h-full', children: _jsxs(CarouselContent, { className: 'h-full [&>div]:h-full', children: [_jsx(CarouselItem, { className: 'h-full', children: _jsx(BasicDetailsStep, { formData: formData, onInputChange: handleInputChange, onNext: handleNext }) }), _jsx(CarouselItem, { className: 'h-full', children: _jsx(SocialImagesStep, { formData: formData, onInputChange: handleInputChange, onNext: handleNext, onPrevious: handlePrevious }) }), _jsx(CarouselItem, { className: 'h-full', children: _jsx(MusicStep, { formData: formData, onInputChange: handleInputChange, onNext: handleNext, onPrevious: handlePrevious }) }), _jsx(CarouselItem, { className: 'h-full', children: _jsx(PerformanceHistoryStep, { formData: formData, onInputChange: handleInputChange, onNext: handleNext, onPrevious: handlePrevious }) }), _jsx(CarouselItem, { className: 'h-full', children: _jsx(TermsStep, { formData: formData, onInputChange: handleInputChange, onSubmit: handleSubmit, onPrevious: handlePrevious, isSubmitting: isSubmitting }) })] }) }) }), _jsx("div", { className: 'fixed left-0 right-0 z-30 flex justify-center gap-[10px] py-[10px] border-t border-white/10 bg-black/60 backdrop-blur-sm', style: { bottom: '60px' }, children: [0, 1, 2, 3, 4].map(step => (_jsx("button", { onClick: () => setCurrentStep(step), className: cn('h-2 transition-all duration-300 rounded-none', currentStep === step
                                ? 'w-[40px] bg-fm-gold'
                                : 'w-[20px] bg-white/30 hover:bg-white/50'), "aria-label": `Go to step ${step + 1}: ${stepTitles[step]}` }, step))) })] }), _jsx(MobilePreviewPanel, { formData: formData, genreBadges: genreBadges, isExpanded: previewExpanded, onToggle: () => setPreviewExpanded(!previewExpanded), onInputChange: handleInputChange })] }));
}
