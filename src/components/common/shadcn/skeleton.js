import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared';
function Skeleton({ className, ...props }) {
    return (_jsx("div", { className: cn('animate-pulse rounded-md bg-muted', className), ...props }));
}
export { Skeleton };
