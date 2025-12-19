import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getQueueProgressPercentage, formatQueuePosition } from '@/shared';
/**
 * Progress bar showing user's position in the ticketing queue.
 * Displays position, total waiting, and visual progress indicator.
 */
export function FmQueueProgressBar({ currentPosition, totalInQueue, activeCount, maxConcurrent, estimatedWaitMinutes, }) {
    const progress = getQueueProgressPercentage(currentPosition, totalInQueue);
    return (_jsxs("div", { className: 'space-y-[10px]', children: [_jsxs("div", { className: 'flex justify-between items-baseline', children: [_jsx("span", { className: 'text-xs uppercase text-muted-foreground font-canela', children: "Your position in queue." }), _jsxs("span", { className: 'text-sm text-fm-gold font-canela', children: [formatQueuePosition(currentPosition), " of ", totalInQueue] })] }), _jsx("div", { className: 'h-[5px] bg-black/60 backdrop-blur-sm border border-white/10 rounded-none overflow-hidden', children: _jsx("div", { className: 'h-full bg-gradient-to-r from-fm-gold to-fm-crimson transition-all duration-500 ease-out shadow-[0_0_10px_rgba(223,186,125,0.5)]', style: { width: `${progress}%` } }) }), _jsxs("div", { className: 'flex justify-between items-center text-xs text-muted-foreground font-canela', children: [_jsxs("span", { children: ["Active: ", activeCount, " / ", maxConcurrent] }), estimatedWaitMinutes !== undefined && estimatedWaitMinutes > 0 && (_jsxs("span", { className: 'text-fm-gold', children: ["Est. wait: ~", estimatedWaitMinutes, " min"] }))] })] }));
}
