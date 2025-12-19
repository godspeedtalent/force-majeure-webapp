import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FmCardCarousel
 *
 * A horizontal scrollable carousel for feature cards
 * Design system compliant with FM styling
 */
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared';
import { Carousel, CarouselContent, CarouselItem, } from '@/components/common/shadcn/carousel';
/**
 * A carousel component for displaying feature cards horizontally
 *
 * @example
 * ```tsx
 * <FmCardCarousel autoPlayInterval={3000}>
 *   <FeatureCard icon={Music2} title="Feature 1" description="..." />
 *   <FeatureCard icon={Users} title="Feature 2" description="..." />
 *   <FeatureCard icon={Sparkles} title="Feature 3" description="..." />
 * </FmCardCarousel>
 * ```
 */
export const FmCardCarousel = ({ children, className, autoPlayInterval = 0, }) => {
    const [carouselApi, setCarouselApi] = useState();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    // Track current slide and scroll capabilities
    useEffect(() => {
        if (!carouselApi)
            return;
        const updateState = () => {
            setCurrentSlide(carouselApi.selectedScrollSnap());
            setCanScrollPrev(carouselApi.canScrollPrev());
            setCanScrollNext(carouselApi.canScrollNext());
        };
        carouselApi.on('select', updateState);
        updateState();
        return () => {
            carouselApi.off('select', updateState);
        };
    }, [carouselApi]);
    // Auto-play functionality
    useEffect(() => {
        if (!carouselApi || autoPlayInterval === 0)
            return;
        const interval = setInterval(() => {
            if (carouselApi.canScrollNext()) {
                carouselApi.scrollNext();
            }
            else {
                carouselApi.scrollTo(0);
            }
        }, autoPlayInterval);
        return () => clearInterval(interval);
    }, [carouselApi, autoPlayInterval]);
    return (_jsxs("div", { className: cn('relative flex flex-col', className), children: [_jsx(Carousel, { setApi: setCarouselApi, opts: {
                    align: 'start',
                    loop: false,
                }, className: 'w-full', children: _jsx(CarouselContent, { className: '-ml-[10px]', children: children.map((child, index) => (_jsx(CarouselItem, { className: 'pl-[10px] basis-full', children: child }, index))) }) }), _jsxs("div", { className: 'flex items-center justify-between mt-[clamp(0.5rem,0.8vh,0.75rem)] flex-shrink-0', children: [_jsxs("div", { className: 'flex items-center gap-[0.5vw]', children: [_jsx("button", { onClick: () => carouselApi?.scrollPrev(), disabled: !canScrollPrev, className: cn('h-[clamp(1.75rem,2.2vw,2.25rem)] w-[clamp(1.75rem,2.2vw,2.25rem)] flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/20 rounded-none transition-all duration-300', canScrollPrev
                                    ? 'hover:border-fm-gold hover:bg-fm-gold/10 cursor-pointer'
                                    : 'opacity-30 cursor-not-allowed'), "aria-label": 'Previous card', children: _jsx(ChevronLeft, { className: 'h-[clamp(0.875rem,1.1vw,1.125rem)] w-[clamp(0.875rem,1.1vw,1.125rem)]' }) }), _jsx("button", { onClick: () => carouselApi?.scrollNext(), disabled: !canScrollNext, className: cn('h-[clamp(1.75rem,2.2vw,2.25rem)] w-[clamp(1.75rem,2.2vw,2.25rem)] flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/20 rounded-none transition-all duration-300', canScrollNext
                                    ? 'hover:border-fm-gold hover:bg-fm-gold/10 cursor-pointer'
                                    : 'opacity-30 cursor-not-allowed'), "aria-label": 'Next card', children: _jsx(ChevronRight, { className: 'h-[clamp(0.875rem,1.1vw,1.125rem)] w-[clamp(0.875rem,1.1vw,1.125rem)]' }) })] }), _jsx("div", { className: 'flex gap-[0.4vw]', children: children.map((_, index) => (_jsx("button", { onClick: () => carouselApi?.scrollTo(index), className: cn('h-[clamp(0.1875rem,0.3vw,0.3125rem)] transition-all duration-300 rounded-none', currentSlide === index
                                ? 'w-[clamp(1.25rem,1.8vw,1.75rem)] bg-fm-gold'
                                : 'w-[clamp(0.625rem,0.9vw,0.875rem)] bg-white/30 hover:bg-white/50'), "aria-label": `Go to card ${index + 1}` }, index))) })] })] }));
};
