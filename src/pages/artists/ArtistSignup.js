import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Music2, Users, Heart, Sparkles, PartyPopper } from 'lucide-react';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { ImageAnchor } from '@/shared';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { Carousel, CarouselContent, CarouselItem, } from '@/components/common/shadcn/carousel';
const PAST_SHOW_IMAGES = [
    {
        id: 1,
        placeholder: false,
        icon: Music2,
        url: '/images/artist-showcase/DSC01097.jpg',
        alt: 'Force Majeure event showcase',
        objectPosition: 'center',
        credit: 'Photo by Force Majeure'
    },
    {
        id: 2,
        placeholder: false,
        icon: Users,
        url: '/images/artist-showcase/_KAK4846.jpg',
        alt: 'Force Majeure event showcase',
        objectPosition: 'center',
        credit: 'Photo by Force Majeure'
    },
];
const ArtistSignup = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('pages');
    const [carouselApi, setCarouselApi] = useState();
    const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
    useEffect(() => {
        if (!carouselApi)
            return;
        const interval = setInterval(() => {
            carouselApi.scrollNext();
        }, 5000);
        return () => clearInterval(interval);
    }, [carouselApi]);
    const handleNavigateToRegister = () => {
        navigate('/artists/register');
    };
    return (_jsx(ArtistRegistrationLayout, { children: _jsxs("div", { className: 'relative overflow-hidden z-10 h-full', children: [_jsx("div", { className: 'absolute inset-0 lg:left-[35%] w-full lg:w-[65%] h-full', onMouseEnter: () => setIsHoveringCarousel(true), onMouseLeave: () => setIsHoveringCarousel(false), children: _jsx(Carousel, { setApi: setCarouselApi, opts: {
                            loop: true,
                            align: 'center',
                        }, className: 'h-full w-full [&>div]:h-full', children: _jsx(CarouselContent, { className: 'h-full ml-0 [&>div]:h-full', children: PAST_SHOW_IMAGES.map((image) => {
                                const IconComponent = image.icon;
                                return (_jsx(CarouselItem, { className: 'h-full p-0 basis-full pl-0', children: _jsxs("div", { className: 'absolute inset-0', children: [image.placeholder ? (_jsx("div", { className: 'absolute inset-0 bg-gradient-to-br from-black via-fm-navy/30 to-black flex items-center justify-center', children: _jsxs("div", { className: 'text-center space-y-[20px]', children: [_jsx(IconComponent, { className: 'h-32 w-32 text-fm-gold/20 mx-auto' }), _jsx("p", { className: 'font-canela text-muted-foreground text-sm uppercase tracking-wider', children: "Past Performance Showcase" })] }) })) : (_jsx(ImageWithSkeleton, { src: image.url, alt: image.alt || 'Force Majeure showcase', className: 'w-full h-full object-cover', skeletonClassName: 'bg-black/40 backdrop-blur-sm', anchor: ImageAnchor.CENTER })), _jsx("div", { className: 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' }), _jsx("div", { className: 'absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/60 lg:hidden' }), _jsx("div", { className: 'absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent hidden lg:block' }), !image.placeholder && (_jsxs(_Fragment, { children: [_jsx("svg", { className: 'absolute inset-0 w-0 h-0', children: _jsx("defs", { children: _jsx("filter", { id: 'selective-desaturate', children: _jsxs("feComponentTransfer", { children: [_jsx("feFuncR", { type: 'discrete', tableValues: '0.3 0.3 0.3 0.3 0.3 0.5 0.7 0.87 1 1' }), _jsx("feFuncG", { type: 'discrete', tableValues: '0.3 0.3 0.3 0.3 0.4 0.5 0.6 0.73 0.85 1' }), _jsx("feFuncB", { type: 'discrete', tableValues: '0.2 0.2 0.2 0.2 0.3 0.35 0.4 0.49 0.6 0.8' })] }) }) }) }), _jsx("div", { className: 'absolute inset-0 pointer-events-none', style: {
                                                            filter: 'url(#selective-desaturate) contrast(1.1)',
                                                        } })] })), !image.placeholder && isHoveringCarousel && (_jsx("div", { className: 'absolute bottom-[20px] right-[20px] bg-black/70 backdrop-blur-md px-[15px] py-[8px] border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300', children: _jsx("p", { className: 'font-canela text-xs text-muted-foreground', children: t('artistSignup.photoCredit') }) }))] }) }, image.id));
                            }) }) }) }), _jsxs("div", { className: 'absolute left-0 top-0 w-full lg:w-[35%] h-full z-20 flex items-center justify-center', children: [_jsx("div", { className: 'absolute inset-0 bg-black/30 backdrop-blur-sm border-r border-white/10 lg:border-r-white/20' }), _jsx("div", { className: 'relative z-10 h-full flex items-center justify-center py-8 px-6 lg:py-[6vh] lg:px-[2vw]', children: _jsxs("div", { className: 'w-[80vw] lg:w-[90%] flex flex-col justify-center gap-5 lg:gap-[2.5vh] max-w-md lg:max-w-sm mx-auto', children: [_jsx("div", { className: 'flex justify-center', children: _jsx(ForceMajeureLogo, { size: 'md', className: 'opacity-90' }) }), _jsxs("div", { className: 'space-y-3 lg:space-y-[1.5vh]', children: [_jsx("h1", { className: 'font-canela text-3xl sm:text-4xl lg:text-[clamp(1.5rem,2.5vw,2rem)] leading-[1.1] tracking-tight text-center lg:text-left', children: t('artistSignup.heroTitle') }), _jsxs("div", { className: 'font-canela text-sm lg:text-[clamp(0.75rem,0.9vw,0.875rem)] text-white leading-relaxed space-y-4 lg:space-y-3 text-center lg:text-left', children: [_jsxs("div", { className: 'flex items-start gap-2 justify-center lg:justify-start', children: [_jsx(Heart, { className: 'w-3.5 h-3.5 text-fm-gold/70 flex-shrink-0 mt-0.5' }), _jsx("p", { children: t('artistSignup.valueProposition1') })] }), _jsxs("div", { className: 'flex items-start gap-2 justify-center lg:justify-start', children: [_jsx(Sparkles, { className: 'w-3.5 h-3.5 text-fm-gold/70 flex-shrink-0 mt-0.5' }), _jsx("p", { children: t('artistSignup.valueProposition2') })] }), _jsxs("div", { className: 'flex items-start gap-2 justify-center lg:justify-start', children: [_jsx(PartyPopper, { className: 'w-3.5 h-3.5 text-fm-gold/70 flex-shrink-0 mt-0.5' }), _jsxs("p", { children: [t('artistSignup.valueProposition3'), _jsx("span", { className: 'block mt-1 text-fm-gold', children: t('artistSignup.closingLine') })] })] })] })] }), _jsx("div", { className: 'mt-2 lg:mt-0', children: _jsx(FmCommonButton, { onClick: handleNavigateToRegister, variant: 'default', className: 'w-full text-sm lg:text-[clamp(0.6875rem,0.9vw,0.8125rem)] py-3 lg:py-[clamp(0.375rem,0.75vh,0.5rem)] font-canela', children: t('artistSignup.registerButton') }) })] }) })] })] }) }));
};
export default ArtistSignup;
