import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useState, useEffect, useRef } from 'react';
import { cn } from '@/shared';
/**
 * FmBigButton - Premium CTA with Professional Styling
 *
 * A sophisticated call-to-action button designed with outline-based styling.
 * Features:
 *
 * - Elegant outline design with subtle glow
 * - Animated border shimmer effect
 * - Hover state with intensified effects
 * - Active/press state with ripple feedback
 * - Loading state with animated border
 * - Sparkle particle effects (subtle)
 * - Urgency indicators for scarcity
 * - Sold out / waitlist variant
 * - Fully accessible with keyboard support
 * - Respects reduced motion preferences
 */
export const FmBigButton = forwardRef(({ children, className, isLoading = false, isSoldOut = false, urgency = 'none', showWaitlist = false, disableAnimations = false, disabled, onClick, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [ripples, setRipples] = useState([]);
    const [sparkles, setSparkles] = useState([]);
    const buttonRef = useRef(null);
    const sparkleIntervalRef = useRef();
    // Merge refs
    useEffect(() => {
        if (ref) {
            if (typeof ref === 'function') {
                ref(buttonRef.current);
            }
            else {
                ref.current = buttonRef.current;
            }
        }
    }, [ref]);
    // Generate sparkles on hover (more subtle)
    useEffect(() => {
        if (isHovered && !disableAnimations && !isSoldOut && !isLoading) {
            sparkleIntervalRef.current = setInterval(() => {
                const newSparkle = {
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    id: Date.now() + Math.random(),
                    delay: Math.random() * 0.5,
                };
                setSparkles(prev => [...prev.slice(-5), newSparkle]);
            }, 400);
        }
        else {
            if (sparkleIntervalRef.current) {
                clearInterval(sparkleIntervalRef.current);
            }
            setSparkles([]);
        }
        return () => {
            if (sparkleIntervalRef.current) {
                clearInterval(sparkleIntervalRef.current);
            }
        };
    }, [isHovered, disableAnimations, isSoldOut, isLoading]);
    const handleClick = (e) => {
        if (disabled || isLoading)
            return;
        // Create ripple effect
        const button = buttonRef.current;
        if (button && !disableAnimations) {
            const rect = button.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            const ripple = { x, y, id: Date.now() };
            setRipples(prev => [...prev, ripple]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== ripple.id));
            }, 600);
        }
        onClick?.(e);
    };
    const urgencyConfig = {
        limited: { label: 'Limited Tickets', pulseSpeed: 'animate-pulse' },
        'selling-fast': {
            label: 'Selling Fast',
            pulseSpeed: 'animate-[pulse_1s_ease-in-out_infinite]',
        },
        'last-chance': {
            label: 'Last Chance',
            pulseSpeed: 'animate-[pulse_0.8s_ease-in-out_infinite]',
        },
    };
    const showUrgency = urgency !== 'none' && !isSoldOut && !isLoading;
    const urgencyInfo = urgency !== 'none' ? urgencyConfig[urgency] : null;
    const buttonText = isSoldOut
        ? showWaitlist
            ? 'Join Waitlist'
            : 'Sold Out'
        : children || 'Get Tickets';
    return (_jsxs("button", { ref: buttonRef, type: 'button', disabled: disabled || isLoading || (isSoldOut && !showWaitlist), onClick: handleClick, onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), className: cn('group relative overflow-hidden', 'w-full px-8 py-3.5', 'font-canela text-base font-light tracking-[0.15em] uppercase', 'transition-all duration-300', 'focus:outline-none focus-visible:ring-4 focus-visible:ring-fm-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background', 'disabled:cursor-not-allowed', 
        // Cursor
        !disabled && !isLoading && 'cursor-pointer', 
        // Base state with dusty gold
        isSoldOut && !showWaitlist
            ? 'border-2 border-border bg-background text-muted-foreground'
            : 'border-2 border-[#B8956A]/50 bg-background text-[#B8956A]', 
        // Hover transform
        !disabled &&
            !isLoading &&
            !isSoldOut &&
            'hover:border-[#B8956A]/70 hover:bg-[#B8956A]/5 hover:scale-[1.02]', 
        // Active state
        !disabled && !isLoading && !isSoldOut && 'active:scale-[0.99]', className), style: {
            boxShadow: isSoldOut
                ? 'none'
                : isHovered
                    ? '0 0 24px rgba(184, 149, 106, 0.2), 0 0 12px rgba(184, 149, 106, 0.1), inset 0 0 20px rgba(184, 149, 106, 0.06)'
                    : '0 0 16px rgba(184, 149, 106, 0.12), inset 0 0 12px rgba(184, 149, 106, 0.04)',
            animation: !disabled && !isLoading && !isSoldOut && isHovered
                ? 'border-ripple-1 2s ease-out infinite, border-ripple-2 2s ease-out infinite 0.4s, border-ripple-3 2s ease-out infinite 0.8s'
                : undefined,
        }, ...props, children: [!isSoldOut && !disableAnimations && (_jsx("div", { className: cn('absolute inset-0 border-2 border-transparent', 'motion-safe:animate-[border-glow_3s_ease-in-out_infinite]', 'pointer-events-none opacity-0 group-hover:opacity-100', 'transition-opacity duration-300'), style: {
                    background: 'linear-gradient(90deg, transparent, rgba(184, 149, 106, 0.3), transparent) border-box',
                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                } })), !isSoldOut && !disableAnimations && !isLoading && isHovered && (_jsx("div", { className: cn('absolute inset-0 bg-gradient-to-r from-transparent via-[#B8956A]/10 to-transparent', 'motion-safe:animate-[shimmer_2s_ease-in-out_infinite]', 'pointer-events-none'), style: {
                    transform: 'translateX(-100%)',
                } })), !isSoldOut && !disableAnimations && isHovered && (_jsx("div", { className: cn('absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent', 'motion-safe:animate-[metallic-sheen_4s_ease-in-out_infinite]', 'pointer-events-none opacity-0 group-hover:opacity-100', 'transition-opacity duration-500 blur-sm'), style: {
                    transform: 'translateX(-100%) rotate(-45deg)',
                    width: '200%',
                    left: '-50%',
                } })), showUrgency && urgencyInfo && (_jsx("span", { className: cn('absolute -top-2 -right-2 px-2 py-0.5', 'bg-destructive text-destructive-foreground', 'text-[10px] font-bold tracking-wider border border-destructive', urgencyInfo.pulseSpeed), children: urgencyInfo.label })), ripples.map(ripple => (_jsx("span", { className: 'absolute rounded-full bg-[#B8956A]/30 pointer-events-none animate-ripple', style: {
                    left: `${ripple.x}%`,
                    top: `${ripple.y}%`,
                    width: '20px',
                    height: '20px',
                    transform: 'translate(-50%, -50%)',
                } }, ripple.id))), !disableAnimations &&
                sparkles.map(sparkle => (_jsx("span", { className: 'absolute w-1 h-1 bg-[#B8956A]/60 rounded-full pointer-events-none', style: {
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}%`,
                        animation: `sparkle-float 1.5s ease-out forwards`,
                        animationDelay: `${sparkle.delay}s`,
                        opacity: 0,
                    } }, sparkle.id))), _jsx("span", { className: 'relative z-10 flex items-center justify-center gap-2', children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: 'h-4 w-4 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' }), _jsx("span", { children: "Processing..." })] })) : (_jsx("span", { className: cn('transition-all duration-200', isHovered && !disableAnimations && 'tracking-[0.18em]'), children: buttonText })) })] }));
});
FmBigButton.displayName = 'FmBigButton';
