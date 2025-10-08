/**
 * Image anchor position enum for controlling object positioning
 */
export enum ImageAnchor {
  TOP = 'TOP',
  TOP_RIGHT = 'TOP_RIGHT',
  RIGHT = 'RIGHT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
  BOTTOM = 'BOTTOM',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  LEFT = 'LEFT',
  TOP_LEFT = 'TOP_LEFT',
  CENTER = 'CENTER'
}

/**
 * Convert ImageAnchor enum to Tailwind CSS object-position class
 */
export const getObjectPositionClass = (anchor: ImageAnchor): string => {
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