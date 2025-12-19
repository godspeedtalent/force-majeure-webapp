import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { cn } from '@/shared';
/**
 * ParallaxLayerManager
 *
 * Manages multiple parallax background layers with independent scroll speeds.
 * Layers are rendered from back to front, with foreground content on top.
 *
 * @example
 * ```tsx
 * <ParallaxLayerManager
 *   layers={[
 *     {
 *       id: 'topography',
 *       content: <TopographicBackground opacity={0.1} parallax={false} />,
 *       speed: 0.3,
 *       zIndex: 1,
 *     },
 *     {
 *       id: 'gradient',
 *       content: <div className='absolute inset-0 bg-gradient-monochrome' />,
 *       speed: 0.5,
 *       zIndex: 2,
 *       opacity: 0.05,
 *     },
 *   ]}
 * >
 *   <div>Foreground content here</div>
 * </ParallaxLayerManager>
 * ```
 */
export const ParallaxLayerManager = ({ layers, children, className, }) => {
    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    return (_jsxs("div", { className: cn('relative', className), children: [layers.map((layer) => {
                const translateY = scrollY * layer.speed;
                return (_jsx("div", { className: cn('absolute inset-0 pointer-events-none overflow-hidden', layer.className), style: {
                        zIndex: layer.zIndex || 0,
                        opacity: layer.opacity,
                        transform: `translateY(${translateY}px)`,
                        transition: 'transform 0.3s ease-out',
                        willChange: 'transform',
                    }, children: layer.content }, layer.id));
            }), _jsx("div", { className: 'relative z-10', children: children })] }));
};
