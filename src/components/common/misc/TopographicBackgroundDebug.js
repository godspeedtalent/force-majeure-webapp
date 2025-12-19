import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
/**
 * DEBUG version of TopographicBackground to test different mirroring configurations
 * This component helps visualize and test which transform combinations create seamless edges
 */
export const TopographicBackgroundDebug = ({ opacity = 0.1, className, showLabels = true, }) => {
    const TILE_SIZE = 1080;
    // Test different configurations for mirroring
    const configs = [
        { name: 'Config 1: No Transforms', tiles: [
                { x: 0, y: 0, scaleX: 1, scaleY: 1, label: 'L: 1,1' },
                { x: 1, y: 0, scaleX: 1, scaleY: 1, label: 'C: 1,1' },
                { x: 2, y: 0, scaleX: 1, scaleY: 1, label: 'R: 1,1' },
            ] },
        { name: 'Config 2: Left Flip Only', tiles: [
                { x: 0, y: 1, scaleX: -1, scaleY: 1, label: 'L: -1,1' },
                { x: 1, y: 1, scaleX: 1, scaleY: 1, label: 'C: 1,1' },
                { x: 2, y: 1, scaleX: 1, scaleY: 1, label: 'R: 1,1' },
            ] },
        { name: 'Config 3: Right Flip Only', tiles: [
                { x: 0, y: 2, scaleX: 1, scaleY: 1, label: 'L: 1,1' },
                { x: 1, y: 2, scaleX: 1, scaleY: 1, label: 'C: 1,1' },
                { x: 2, y: 2, scaleX: -1, scaleY: 1, label: 'R: -1,1' },
            ] },
        { name: 'Config 4: Both Flip X', tiles: [
                { x: 0, y: 3, scaleX: -1, scaleY: 1, label: 'L: -1,1' },
                { x: 1, y: 3, scaleX: 1, scaleY: 1, label: 'C: 1,1' },
                { x: 2, y: 3, scaleX: -1, scaleY: 1, label: 'R: -1,1' },
            ] },
        { name: 'Config 5: Center + Left Flip', tiles: [
                { x: 0, y: 4, scaleX: -1, scaleY: 1, label: 'L: -1,1' },
                { x: 1, y: 4, scaleX: -1, scaleY: 1, label: 'C: -1,1' },
                { x: 2, y: 4, scaleX: 1, scaleY: 1, label: 'R: 1,1' },
            ] },
        { name: 'Config 6: Center + Right Flip', tiles: [
                { x: 0, y: 5, scaleX: 1, scaleY: 1, label: 'L: 1,1' },
                { x: 1, y: 5, scaleX: -1, scaleY: 1, label: 'C: -1,1' },
                { x: 2, y: 5, scaleX: -1, scaleY: 1, label: 'R: -1,1' },
            ] },
    ];
    return (_jsx("div", { className: cn('absolute inset-0 pointer-events-none overflow-auto', className), style: { opacity, backgroundColor: '#000' }, children: _jsx("div", { className: 'relative', style: { minHeight: `${TILE_SIZE * 4}px` }, children: configs.map((config, configIndex) => (_jsxs("div", { children: [showLabels && (_jsx("div", { className: 'absolute text-fm-gold font-bold text-xl bg-black/80 px-4 py-2 border border-fm-gold', style: {
                            left: '20px',
                            top: `${configIndex * TILE_SIZE + 20}px`,
                            zIndex: 10,
                        }, children: config.name })), config.tiles.map((tile, tileIndex) => {
                        const style = {
                            position: 'absolute',
                            left: `${tile.x * TILE_SIZE}px`,
                            top: `${configIndex * TILE_SIZE}px`,
                            width: `${TILE_SIZE}px`,
                            height: `${TILE_SIZE}px`,
                            backgroundImage: 'url(/images/topographic-pattern.png)',
                            backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            transform: `scale(${tile.scaleX}, ${tile.scaleY})`,
                            transformOrigin: 'center center',
                            border: tileIndex === 1 ? '4px solid #dfba7d' : '2px solid rgba(223, 186, 125, 0.3)',
                        };
                        return (_jsxs("div", { children: [_jsx("div", { style: style }), showLabels && (_jsx("div", { className: 'absolute text-white text-sm bg-black/60 px-2 py-1 font-mono', style: {
                                        left: `${tile.x * TILE_SIZE + 10}px`,
                                        top: `${configIndex * TILE_SIZE + 10}px`,
                                        zIndex: 5,
                                    }, children: tile.label }))] }, tileIndex));
                    }), _jsx("div", { className: 'absolute w-px bg-red-500', style: {
                            left: `${TILE_SIZE}px`,
                            top: `${configIndex * TILE_SIZE}px`,
                            height: `${TILE_SIZE}px`,
                            zIndex: 20,
                        } }), _jsx("div", { className: 'absolute w-px bg-blue-500', style: {
                            left: `${TILE_SIZE * 2}px`,
                            top: `${configIndex * TILE_SIZE}px`,
                            height: `${TILE_SIZE}px`,
                            zIndex: 20,
                        } })] }, configIndex))) }) }));
};
