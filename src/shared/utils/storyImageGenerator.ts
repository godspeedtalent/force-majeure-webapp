import QRCode from 'qrcode';
import { logger } from '@/shared/services/logger';

/**
 * Story image dimensions (Instagram Story format)
 */
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

/**
 * Force Majeure brand colors
 */
export const STORY_COLORS = {
  gold: '#dfba7d',
  goldLight: 'rgba(223, 186, 125, 0.3)',
  black: '#000000',
  white: '#ffffff',
  whiteTransparent: 'rgba(255, 255, 255, 0.8)',
  whiteMuted: 'rgba(255, 255, 255, 0.6)',
  backgroundOverlay: 'rgba(0, 0, 0, 0.7)',
} as const;

/**
 * Font configuration
 */
export const STORY_FONTS = {
  titleLarge: 'bold 72px Canela, Georgia, serif',
  titleMedium: 'bold 56px Canela, Georgia, serif',
  titleSmall: '48px Canela, Georgia, serif',
  subtitle: '36px Canela, Georgia, serif',
  body: '28px Canela, Georgia, serif',
  small: '24px Canela, Georgia, serif',
  tiny: '20px Canela, Georgia, serif',
  badge: 'bold 22px Canela, Georgia, serif',
  cta: 'bold 28px Canela, Georgia, serif',
} as const;

/**
 * Text style configuration
 */
export interface TextStyle {
  font: string;
  color: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
  lineHeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
}

/**
 * Position configuration
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Rectangle configuration
 */
export interface Rect extends Position {
  width: number;
  height: number;
}

/**
 * Wait for fonts to load before rendering
 */
export async function waitForFonts(): Promise<void> {
  try {
    await document.fonts.ready;
    // Give a small buffer for fonts to be fully available
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    logger.warn('Font loading check failed, proceeding anyway', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'storyImageGenerator.waitForFonts',
    });
  }
}

/**
 * Create a canvas with story dimensions
 */
export function createStoryCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  return { canvas, ctx };
}

/**
 * Fill canvas with solid color
 */
export function fillBackground(
  ctx: CanvasRenderingContext2D,
  color: string = STORY_COLORS.black
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
}

/**
 * Draw topography pattern overlay using the actual topographic pattern image
 * Falls back to generated pattern if image fails to load
 */
export async function drawTopographyPatternImage(
  ctx: CanvasRenderingContext2D,
  opacity: number = 0.2
): Promise<void> {
  try {
    const img = await loadImage('/images/topographic-pattern.png');

    ctx.save();
    ctx.globalAlpha = opacity;

    // Tile the pattern to fill the canvas
    const patternScale = 1; // Use actual size for detail
    const patternWidth = img.width * patternScale;
    const patternHeight = img.height * patternScale;

    for (let y = 0; y < STORY_HEIGHT; y += patternHeight) {
      for (let x = 0; x < STORY_WIDTH; x += patternWidth) {
        ctx.drawImage(img, x, y, patternWidth, patternHeight);
      }
    }

    ctx.restore();
  } catch {
    // Fallback to generated pattern
    drawTopographyPattern(ctx, opacity);
  }
}

/**
 * Draw topography pattern overlay (generated version)
 * More detailed with finer lines
 */
export function drawTopographyPattern(
  ctx: CanvasRenderingContext2D,
  opacity: number = 0.15,
  options: {
    accentColor?: string;
    accentOpacity?: number;
    density?: 'low' | 'medium' | 'high';
  } = {}
): void {
  const {
    accentColor = STORY_COLORS.gold,
    accentOpacity = 0.06,
    density = 'medium',
  } = options;

  // More lines for finer detail
  const lineCount = density === 'low' ? 40 : density === 'high' ? 80 : 60;
  const lineSpacing = STORY_HEIGHT / lineCount;

  ctx.save();

  // Draw main white topography lines - finer detail
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = STORY_COLORS.white;
  ctx.lineWidth = 0.8;

  for (let i = 0; i < lineCount; i++) {
    ctx.beginPath();
    const baseY = i * lineSpacing + Math.sin(i * 0.3) * 15;

    ctx.moveTo(0, baseY);

    // Smaller step for smoother curves
    for (let x = 0; x <= STORY_WIDTH; x += 20) {
      const y =
        baseY +
        Math.sin((x + i * 80) * 0.008) * 20 +
        Math.cos((x + i * 40) * 0.012) * 15 +
        Math.sin((x * 0.004 + i * 0.2)) * 10;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  // Draw subtle accent color highlight lines (every 8th line)
  ctx.globalAlpha = accentOpacity;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;

  for (let i = 0; i < lineCount; i += 8) {
    ctx.beginPath();
    const baseY = i * lineSpacing + Math.sin(i * 0.3) * 15;

    ctx.moveTo(0, baseY);

    for (let x = 0; x <= STORY_WIDTH; x += 20) {
      const y =
        baseY +
        Math.sin((x + i * 80) * 0.008) * 20 +
        Math.cos((x + i * 40) * 0.012) * 15 +
        Math.sin((x * 0.004 + i * 0.2)) * 10;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw a gradient overlay
 */
export function drawGradientOverlay(
  ctx: CanvasRenderingContext2D,
  direction: 'top' | 'bottom' | 'full' = 'bottom',
  startOpacity: number = 0.8,
  endOpacity: number = 0
): void {
  let gradient: CanvasGradient;

  switch (direction) {
    case 'top':
      gradient = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT * 0.4);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${startOpacity})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${endOpacity})`);
      break;
    case 'bottom':
      gradient = ctx.createLinearGradient(
        0,
        STORY_HEIGHT * 0.5,
        0,
        STORY_HEIGHT
      );
      gradient.addColorStop(0, `rgba(0, 0, 0, ${endOpacity})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${startOpacity})`);
      break;
    case 'full':
      gradient = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${startOpacity * 0.5})`);
      gradient.addColorStop(0.3, `rgba(0, 0, 0, ${endOpacity})`);
      gradient.addColorStop(0.7, `rgba(0, 0, 0, ${endOpacity})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${startOpacity})`);
      break;
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
}

/**
 * Load an image from URL with CORS support
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => {
      logger.warn('Failed to load image', {
        url,
        source: 'storyImageGenerator.loadImage',
      });
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Draw an image to fill a rectangle (cover mode)
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rect: Rect
): void {
  const imgRatio = img.width / img.height;
  const rectRatio = rect.width / rect.height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.width;
  let sourceHeight = img.height;

  if (imgRatio > rectRatio) {
    // Image is wider - crop sides
    sourceWidth = img.height * rectRatio;
    sourceX = (img.width - sourceWidth) / 2;
  } else {
    // Image is taller - crop top/bottom
    sourceHeight = img.width / rectRatio;
    sourceY = (img.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    rect.x,
    rect.y,
    rect.width,
    rect.height
  );
}

/**
 * Draw an image to fit within a rectangle (contain mode)
 */
export function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rect: Rect
): void {
  const imgRatio = img.width / img.height;
  const rectRatio = rect.width / rect.height;

  let destWidth = rect.width;
  let destHeight = rect.height;
  let destX = rect.x;
  let destY = rect.y;

  if (imgRatio > rectRatio) {
    // Image is wider - fit to width
    destHeight = rect.width / imgRatio;
    destY = rect.y + (rect.height - destHeight) / 2;
  } else {
    // Image is taller - fit to height
    destWidth = rect.height * imgRatio;
    destX = rect.x + (rect.width - destWidth) / 2;
  }

  ctx.drawImage(img, destX, destY, destWidth, destHeight);
}

/**
 * Draw text with styling
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Position,
  style: TextStyle
): void {
  ctx.save();

  ctx.font = style.font;
  ctx.fillStyle = style.color;
  ctx.textAlign = style.align || 'left';
  ctx.textBaseline = style.baseline || 'top';

  const displayText = style.uppercase ? text.toUpperCase() : text;

  if (style.maxWidth) {
    ctx.fillText(displayText, position.x, position.y, style.maxWidth);
  } else {
    ctx.fillText(displayText, position.x, position.y);
  }

  ctx.restore();
}

/**
 * Draw multi-line text with word wrapping
 */
export function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Position,
  style: TextStyle,
  maxWidth: number
): number {
  ctx.save();
  ctx.font = style.font;
  ctx.fillStyle = style.color;
  ctx.textAlign = style.align || 'left';
  ctx.textBaseline = style.baseline || 'top';

  const lineHeight = style.lineHeight || 40;
  const words = text.split(' ');
  let line = '';
  let y = position.y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && i > 0) {
      const displayLine = style.uppercase ? line.toUpperCase() : line;
      ctx.fillText(displayLine.trim(), position.x, y);
      line = words[i] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  const displayLine = style.uppercase ? line.toUpperCase() : line;
  ctx.fillText(displayLine.trim(), position.x, y);

  ctx.restore();

  return y + lineHeight - position.y; // Return total height used
}

/**
 * Draw a badge with text
 */
export function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Position,
  options: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    padding?: { x: number; y: number };
    font?: string;
  } = {}
): number {
  const {
    backgroundColor = 'transparent',
    borderColor = STORY_COLORS.gold,
    textColor = STORY_COLORS.gold,
    padding = { x: 16, y: 8 },
    font = STORY_FONTS.badge,
  } = options;

  ctx.save();
  ctx.font = font;

  const metrics = ctx.measureText(text.toUpperCase());
  const width = metrics.width + padding.x * 2;
  const height = 32 + padding.y * 2;

  // Draw background
  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(position.x, position.y, width, height);
  }

  // Draw border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(position.x, position.y, width, height);

  // Draw text
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    text.toUpperCase(),
    position.x + width / 2,
    position.y + height / 2
  );

  ctx.restore();

  return width;
}

/**
 * Draw multiple badges in a row
 */
export function drawBadgeRow(
  ctx: CanvasRenderingContext2D,
  badges: string[],
  position: Position,
  gap: number = 12,
  options?: Parameters<typeof drawBadge>[3]
): void {
  let currentX = position.x;

  for (const badge of badges) {
    const width = drawBadge(ctx, badge, { x: currentX, y: position.y }, options);
    currentX += width + gap;
  }
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCodeDataUrl(
  url: string,
  size: number = 150
): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: {
        dark: STORY_COLORS.white,
        light: '#00000000', // Transparent background (RGBA hex)
      },
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    logger.error('Failed to generate QR code', {
      error: error instanceof Error ? error.message : String(error),
      url,
      source: 'storyImageGenerator.generateQRCodeDataUrl',
    });
    throw error;
  }
}

/**
 * Draw QR code on canvas
 */
export async function drawQRCode(
  ctx: CanvasRenderingContext2D,
  url: string,
  position: Position,
  size: number = 150
): Promise<void> {
  const dataUrl = await generateQRCodeDataUrl(url, size);
  const img = await loadImage(dataUrl);
  ctx.drawImage(img, position.x, position.y, size, size);
}

/**
 * Draw the Force Majeure logo image
 * Uses the actual logo PNG with optional glow effect
 */
export async function drawFMLogoImage(
  ctx: CanvasRenderingContext2D,
  position: Position,
  options: {
    width?: number;
    height?: number;
    glow?: boolean;
    glowColor?: string;
    align?: 'left' | 'center' | 'right';
  } = {}
): Promise<void> {
  const {
    width = 200,
    height = 60,
    glow = true,
    glowColor = STORY_COLORS.gold,
    align = 'right',
  } = options;

  try {
    const img = await loadImage('/images/fm-logo-light.png');

    ctx.save();

    // Calculate x position based on alignment
    let x = position.x;
    if (align === 'right') {
      x = position.x - width;
    } else if (align === 'center') {
      x = position.x - width / 2;
    }

    // Draw glow effect
    if (glow) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 25;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Draw logo
    ctx.drawImage(img, x, position.y - height, width, height);

    ctx.restore();
  } catch {
    // Fallback to text logo
    drawFMLogoText(ctx, position, { glow, glowColor });
  }
}

/**
 * Draw the Force Majeure logo as text (fallback)
 */
export function drawFMLogoText(
  ctx: CanvasRenderingContext2D,
  position: Position,
  options: {
    scale?: number;
    color?: string;
    glow?: boolean;
    glowColor?: string;
  } = {}
): void {
  const {
    scale = 1,
    color = STORY_COLORS.white,
    glow = true,
    glowColor = STORY_COLORS.gold,
  } = options;

  ctx.save();

  const fontSize = Math.round(24 * scale);
  ctx.font = `${fontSize}px Canela, Georgia, serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  // Draw glow effect
  if (glow) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fillText('FORCE MAJEURE', position.x, position.y);

    // Reset shadow for main text
    ctx.shadowBlur = 0;
  }

  // Draw main text
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color;
  ctx.fillText('FORCE MAJEURE', position.x, position.y);

  ctx.restore();
}

/**
 * @deprecated Use drawFMLogoImage instead
 */
export const drawFMLogo = drawFMLogoText;

/**
 * Draw a horizontal divider line
 */
export function drawDivider(
  ctx: CanvasRenderingContext2D,
  y: number,
  options: {
    startX?: number;
    endX?: number;
    color?: string;
    opacity?: number;
    gradient?: boolean;
  } = {}
): void {
  const {
    startX = 60,
    endX = STORY_WIDTH - 60,
    color = STORY_COLORS.white,
    opacity = 0.3,
    gradient = true,
  } = options;

  ctx.save();

  if (gradient) {
    const gradientLine = ctx.createLinearGradient(startX, y, endX, y);
    gradientLine.addColorStop(0, 'transparent');
    gradientLine.addColorStop(0.2, `rgba(255, 255, 255, ${opacity})`);
    gradientLine.addColorStop(0.8, `rgba(255, 255, 255, ${opacity})`);
    gradientLine.addColorStop(1, 'transparent');
    ctx.strokeStyle = gradientLine;
  } else {
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
  }

  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw an elegant gold accent divider with glow
 */
export function drawGoldDivider(
  ctx: CanvasRenderingContext2D,
  y: number,
  options: {
    startX?: number;
    endX?: number;
    thickness?: number;
  } = {}
): void {
  const {
    startX = 60,
    endX = STORY_WIDTH - 60,
    thickness = 2,
  } = options;

  ctx.save();

  // Draw glow
  ctx.shadowColor = STORY_COLORS.gold;
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Create gradient
  const gradient = ctx.createLinearGradient(startX, y, endX, y);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.15, STORY_COLORS.gold);
  gradient.addColorStop(0.85, STORY_COLORS.gold);
  gradient.addColorStop(1, 'transparent');

  ctx.strokeStyle = gradient;
  ctx.lineWidth = thickness;
  ctx.globalAlpha = 0.8;

  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a CTA (call to action) button
 * Enhanced with glow effect and sleek styling
 */
export function drawCTAButton(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Position,
  options: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    textColor?: string;
    style?: 'solid' | 'outline' | 'glow';
  } = {}
): void {
  const {
    width = 280,
    height = 56,
    backgroundColor = STORY_COLORS.gold,
    textColor = STORY_COLORS.black,
    style = 'glow',
  } = options;

  ctx.save();

  if (style === 'glow') {
    // Draw glow effect
    ctx.shadowColor = backgroundColor;
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw button background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(position.x, position.y, width, height);

    // Reset shadow
    ctx.shadowBlur = 0;
  } else if (style === 'outline') {
    // Draw outline style
    ctx.strokeStyle = backgroundColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(position.x, position.y, width, height);
  } else {
    // Solid style
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(position.x, position.y, width, height);
  }

  // Draw button text
  ctx.font = STORY_FONTS.cta;
  ctx.fillStyle = style === 'outline' ? backgroundColor : textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    text.toUpperCase(),
    position.x + width / 2,
    position.y + height / 2
  );

  ctx.restore();
}

/**
 * Convert canvas to blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Convert canvas to data URL
 */
export function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  quality: number = 0.9
): string {
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Draw a semi-transparent rectangle (for content areas)
 */
export function drawContentBox(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  options: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  } = {}
): void {
  const {
    backgroundColor = 'rgba(0, 0, 0, 0.6)',
    borderColor = 'rgba(255, 255, 255, 0.2)',
    borderWidth = 1,
  } = options;

  ctx.save();

  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

  // Draw border
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }

  ctx.restore();
}

/**
 * Draw an outline card with frosted glass effect (Force Majeure design system)
 */
export function drawOutlineCard(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  options: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    glow?: boolean;
    glowColor?: string;
  } = {}
): void {
  const {
    backgroundColor = 'rgba(0, 0, 0, 0.6)',
    borderColor = 'rgba(255, 255, 255, 0.2)',
    borderWidth = 1,
    glow = false,
    glowColor = STORY_COLORS.gold,
  } = options;

  ctx.save();

  // Draw glow effect if enabled
  if (glow) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

  // Reset shadow for border
  ctx.shadowBlur = 0;

  // Draw border
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }

  ctx.restore();
}

/**
 * Draw an event row item (for venue/artist event lists)
 */
export function drawEventRow(
  ctx: CanvasRenderingContext2D,
  position: Position,
  data: {
    title: string;
    date: string;
    isPast?: boolean;
  },
  options: {
    width?: number;
    height?: number;
  } = {}
): number {
  const {
    width = STORY_WIDTH - 120,
    height = 50,
  } = options;

  ctx.save();

  const { title, date, isPast = false } = data;

  // Draw subtle background
  ctx.fillStyle = isPast ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(position.x, position.y, width, height);

  // Draw left accent line
  ctx.fillStyle = isPast ? 'rgba(255, 255, 255, 0.2)' : STORY_COLORS.gold;
  ctx.fillRect(position.x, position.y, 3, height);

  // Draw date
  ctx.font = STORY_FONTS.tiny;
  ctx.fillStyle = isPast ? STORY_COLORS.whiteMuted : STORY_COLORS.gold;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(date.toUpperCase(), position.x + 15, position.y + height / 2);

  // Draw title
  ctx.font = STORY_FONTS.small;
  ctx.fillStyle = isPast ? STORY_COLORS.whiteMuted : STORY_COLORS.white;
  ctx.textAlign = 'right';

  // Truncate title if too long
  let displayTitle = title;
  const maxTitleWidth = width - 150;
  while (ctx.measureText(displayTitle).width > maxTitleWidth && displayTitle.length > 3) {
    displayTitle = displayTitle.slice(0, -4) + '...';
  }

  ctx.fillText(displayTitle, position.x + width - 15, position.y + height / 2);

  ctx.restore();

  return height;
}

/**
 * Draw icon placeholder (for when actual icons aren't available)
 */
export function drawIconCircle(
  ctx: CanvasRenderingContext2D,
  position: Position,
  radius: number,
  options: {
    backgroundColor?: string;
    iconColor?: string;
    iconText?: string;
  } = {}
): void {
  const {
    backgroundColor = 'rgba(223, 186, 125, 0.2)',
    iconColor = STORY_COLORS.gold,
    iconText = '?',
  } = options;

  ctx.save();

  // Draw circle background
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw icon text
  ctx.font = `bold ${radius}px Canela, Georgia, serif`;
  ctx.fillStyle = iconColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(iconText, position.x, position.y);

  ctx.restore();
}
