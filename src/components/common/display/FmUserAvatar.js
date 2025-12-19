import { jsx as _jsx } from "react/jsx-runtime";
import { FmUserAvatar as FmUserAvatarComponent } from './FmEntityAvatar';
/**
 * Common user avatar component with fallback for users without profile images.
 * Displays profile image if available, otherwise shows user icon or initials.
 * Used throughout the app for consistent user representation.
 *
 * Re-exported from FmEntityAvatar for backwards compatibility.
 */
export function FmUserAvatar({ avatarUrl, displayName, size = 'md', className, }) {
    return (_jsx(FmUserAvatarComponent, { imageUrl: avatarUrl, displayName: displayName, size: size, className: className }));
}
