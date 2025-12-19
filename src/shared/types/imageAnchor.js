/**
 * Image anchor position enum for controlling object positioning
 */
export var ImageAnchor;
(function (ImageAnchor) {
    ImageAnchor["TOP"] = "TOP";
    ImageAnchor["TOP_RIGHT"] = "TOP_RIGHT";
    ImageAnchor["RIGHT"] = "RIGHT";
    ImageAnchor["BOTTOM_RIGHT"] = "BOTTOM_RIGHT";
    ImageAnchor["BOTTOM"] = "BOTTOM";
    ImageAnchor["BOTTOM_LEFT"] = "BOTTOM_LEFT";
    ImageAnchor["LEFT"] = "LEFT";
    ImageAnchor["TOP_LEFT"] = "TOP_LEFT";
    ImageAnchor["CENTER"] = "CENTER";
})(ImageAnchor || (ImageAnchor = {}));
/**
 * Convert ImageAnchor enum to Tailwind CSS object-position class
 */
export const getObjectPositionClass = (anchor) => {
    switch (anchor) {
        case ImageAnchor.TOP:
            return 'object-top';
        case ImageAnchor.TOP_RIGHT:
            return 'object-top object-right';
        case ImageAnchor.RIGHT:
            return 'object-right';
        case ImageAnchor.BOTTOM_RIGHT:
            return 'object-bottom object-right';
        case ImageAnchor.BOTTOM:
            return 'object-bottom';
        case ImageAnchor.BOTTOM_LEFT:
            return 'object-bottom object-left';
        case ImageAnchor.LEFT:
            return 'object-left';
        case ImageAnchor.TOP_LEFT:
            return 'object-top object-left';
        case ImageAnchor.CENTER:
        default:
            return 'object-center';
    }
};
