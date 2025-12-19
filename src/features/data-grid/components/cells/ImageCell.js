import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { FmEntityAvatar, } from '@/components/common/display/FmEntityAvatar';
import { FmDataGridImageUploadModal } from '@/components/common/modals/FmDataGridImageUploadModal';
import { Pencil } from 'lucide-react';
import { cn } from '@/shared';
/**
 * ImageCell - Displays an image in a data grid cell
 *
 * Features:
 * - Configurable size and shape
 * - Fallback to entity avatar if no image
 * - Clickable to upload/change image (if editable)
 * - 200x200px fixed size, fills cell
 * - Square aspect ratio with center crop
 * - Consistent with design system
 */
export function ImageCell({ value, alt = 'Image', fallback, shape = 'square', entityType = 'user', entityName, onImageUpdate, editable = false, bucket, storagePath, }) {
    const [uploadModalOpen, setUploadModalOpen] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const handleImageUploaded = (newImageUrl) => {
        if (onImageUpdate) {
            onImageUpdate(newImageUrl);
        }
    };
    const handleClick = (e) => {
        e.stopPropagation(); // Prevent event bubbling
        if (editable) {
            setUploadModalOpen(true);
        }
    };
    // If no image, use entity avatar
    if (!value) {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: cn('relative group', 'h-[75px] w-[75px]', 'flex items-center justify-center', 'p-0 m-0', editable && 'cursor-pointer hover:opacity-80 transition-opacity'), onClick: handleClick, onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), children: [_jsx(FmEntityAvatar, { imageUrl: value, displayName: fallback || entityName, entityType: entityType, size: 'xl', shape: shape, className: 'h-full w-full' }), editable && isHovered && (_jsx("div", { className: 'absolute inset-[12.5px] bg-black/60 flex items-center justify-center backdrop-blur-sm', children: _jsxs("div", { className: 'flex flex-col items-center gap-[5px] text-fm-gold', children: [_jsx(Pencil, { className: 'h-5 w-5' }), _jsx("span", { className: 'text-[10px] font-medium uppercase', children: "Upload" })] }) }))] }), editable && (_jsx(FmDataGridImageUploadModal, { open: uploadModalOpen, onOpenChange: setUploadModalOpen, currentImageUrl: value, entityName: entityName || 'Entity', onImageUploaded: handleImageUploaded, bucket: bucket, storagePath: storagePath }))] }));
    }
    // Display image - 75x75px, fills entire cell, no padding
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: cn('relative group', 'h-[75px] w-[75px]', 'p-0 m-0', editable && 'cursor-pointer'), onClick: handleClick, onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), children: [_jsx("img", { src: value, alt: alt, className: cn('h-full w-full object-cover', 'rounded-none', 'border-none'), style: { objectPosition: 'center' } }), editable && isHovered && (_jsx("div", { className: 'absolute inset-[12.5px] bg-black/60 flex items-center justify-center backdrop-blur-sm', children: _jsxs("div", { className: 'flex flex-col items-center gap-[5px] text-fm-gold', children: [_jsx(Pencil, { className: 'h-5 w-5' }), _jsx("span", { className: 'text-[10px] font-medium uppercase', children: "Change" })] }) }))] }), editable && (_jsx(FmDataGridImageUploadModal, { open: uploadModalOpen, onOpenChange: setUploadModalOpen, currentImageUrl: value, entityName: entityName || 'Entity', onImageUploaded: handleImageUploaded, bucket: bucket, storagePath: storagePath }))] }));
}
