import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem, } from '@/components/common/shadcn/carousel';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { BasicDetailsStep } from './registration-steps/BasicDetailsStep';
import { SocialImagesStep } from './registration-steps/SocialImagesStep';
import { MusicStep } from './registration-steps/MusicStep';
import { TermsStep } from './registration-steps/TermsStep';
import { ArtistPreviewCard } from './ArtistPreviewCard';
import { MobilePreviewPanel } from './MobilePreviewPanel';
/**
 * ArtistRegisterResponsive
 *
 * Unified responsive component for artist registration.
 * Replaces separate ArtistRegisterDesktop and ArtistRegisterMobile components.
 *
 * - Desktop: 50/50 split layout with live preview on right
 * - Mobile: Full-screen with collapsible bottom preview panel
 */
export function ArtistRegisterResponsive({ formData, currentStep, stepTitles, setCarouselApi, handleInputChange, handleNext, handlePrevious, handleSubmit, isSubmitting, genreBadges, setCurrentStep, previewExpanded = false, setPreviewExpanded, }) {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    // Shared header component
    const Header = () => (_jsxs("div", { className: cn('relative z-10 flex items-center justify-between h-[60px] px-[20px] border-b border-white/10 flex-shrink-0', !isMobile && 'bg-transparent'), children: [_jsxs("button", { onClick: () => navigate('/artists/signup'), className: 'text-white/70 hover:text-fm-gold transition-colors duration-300 flex items-center gap-[10px] font-canela text-sm', children: [_jsx(ArrowLeft, { className: 'h-4 w-4' }), t('buttons.back')] }), _jsxs("div", { className: 'flex flex-col items-end', children: [_jsx("span", { className: 'font-canela text-sm text-muted-foreground', children: t('artistRegistration.stepOf', { current: currentStep + 1, total: 4 }) }), _jsx("span", { className: 'font-canela text-xs text-muted-foreground/70', children: stepTitles[currentStep] })] })] }));
    // Shared carousel content
    const FormCarousel = () => (_jsx(Carousel, { setApi: setCarouselApi, opts: {
            align: 'start',
            watchDrag: false,
        }, className: 'h-full [&>div]:h-full', children: _jsxs(CarouselContent, { className: 'h-full [&>div]:h-full', children: [_jsx(CarouselItem, { className: 'h-full', children: _jsx(BasicDetailsStep, { formData: formData, onInputChange: handleInputChange, onNext: handleNext }) }), _jsx(CarouselItem, { className: 'h-full', children: _jsx(SocialImagesStep, { formData: formData, onInputChange: handleInputChange, onNext: handleNext, onPrevious: handlePrevious }) }), _jsx(CarouselItem, { className: 'h-full', children: _jsx(MusicStep, { formData: formData, onInputChange: handleInputChange, onNext: handleNext, onPrevious: handlePrevious }) }), _jsx(CarouselItem, { className: 'h-full', children: _jsx(TermsStep, { formData: formData, onInputChange: handleInputChange, onSubmit: handleSubmit, onPrevious: handlePrevious, isSubmitting: isSubmitting }) })] }) }));
    // Shared progress indicators
    const ProgressIndicators = ({ className }) => (_jsx("div", { className: cn('flex justify-center gap-[10px]', className), children: [0, 1, 2, 3].map(step => (_jsx("button", { onClick: () => setCurrentStep(step), className: cn('h-2 transition-all duration-300 rounded-none', currentStep === step
                ? 'w-[40px] bg-fm-gold'
                : 'w-[20px] bg-white/30 hover:bg-white/50'), "aria-label": `Go to step ${step + 1}: ${stepTitles[step]}` }, step))) }));
    // Mobile Layout
    if (isMobile) {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: 'fixed inset-0 top-0 flex flex-col', children: [_jsx(TopographicBackground, { opacity: 0.35 }), _jsx(Header, {}), _jsx("div", { className: 'relative z-10 flex-1 min-h-0 pb-[110px]', children: _jsx(FormCarousel, {}) }), _jsx("div", { className: 'fixed left-0 right-0 z-30 py-[10px] border-t border-white/10 bg-black/60 backdrop-blur-sm', style: { bottom: '60px' }, children: _jsx(ProgressIndicators, {}) })] }), _jsx(MobilePreviewPanel, { formData: formData, genreBadges: genreBadges, isExpanded: previewExpanded, onToggle: () => setPreviewExpanded?.(!previewExpanded) })] }));
    }
    // Desktop Layout
    return (_jsxs("div", { className: 'fixed inset-0 top-[64px] flex', children: [_jsxs("div", { className: 'w-1/2 relative flex flex-col border-r border-white/10 z-10 overflow-hidden', children: [_jsx("div", { className: 'absolute inset-0 bg-black/70 backdrop-blur-md' }), _jsx(Header, {}), _jsx("div", { className: 'relative z-10 flex-1 min-h-0', children: _jsx(FormCarousel, {}) }), _jsx("div", { className: 'relative z-10 p-[15px] border-t border-white/10', children: _jsx(ProgressIndicators, {}) })] }), _jsxs("div", { className: 'w-1/2 relative flex flex-col overflow-hidden z-10', children: [_jsxs("div", { className: 'flex-shrink-0 flex items-center justify-between h-[60px] px-[20px] border-b border-white/10 bg-black/30 backdrop-blur-sm', children: [_jsx("h3", { className: 'font-canela text-lg text-white', children: t('nav.profilePreview') }), _jsx("p", { className: 'font-canela text-xs text-muted-foreground', children: t('nav.profilePreviewDescription') })] }), _jsx("div", { className: 'flex-1 flex items-center justify-center overflow-y-auto p-[40px]', children: _jsx("div", { className: 'w-full max-w-2xl', children: _jsx(ArtistPreviewCard, { formData: formData, genreBadges: genreBadges }) }) })] })] }));
}
