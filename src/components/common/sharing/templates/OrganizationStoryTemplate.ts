import {
  BaseStoryTemplate,
  OrganizationStoryData,
} from './BaseStoryTemplate';
import {
  drawText,
  drawWrappedText,
  drawCTAButton,
  drawOutlineCard,
  drawGoldDivider,
  loadImage,
  drawImageContain,
  STORY_WIDTH,
  STORY_HEIGHT,
  STORY_COLORS,
  STORY_FONTS,
} from '@/shared/utils/storyImageGenerator';

/**
 * Organization Story Template
 *
 * Sleek logo-centric layout:
 * - Organization logo (centered)
 * - Content card with outline styling
 * - Organization name and tagline
 * - CTA button
 * - FM logo centered at bottom
 */
export class OrganizationStoryTemplate extends BaseStoryTemplate<OrganizationStoryData> {
  protected async drawContent(): Promise<void> {
    const padding = 60;
    const centerX = STORY_WIDTH / 2;

    // Draw a subtle radial gradient for depth
    const gradient = this.ctx.createRadialGradient(
      centerX,
      STORY_HEIGHT * 0.3,
      0,
      centerX,
      STORY_HEIGHT * 0.3,
      STORY_WIDTH * 0.9
    );
    gradient.addColorStop(0, 'rgba(223, 186, 125, 0.06)');
    gradient.addColorStop(0.5, 'rgba(223, 186, 125, 0.02)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

    // Draw "PRESENTED BY" header
    let currentY = 120;

    drawText(
      this.ctx,
      'PRESENTED BY',
      { x: centerX, y: currentY },
      {
        font: STORY_FONTS.tiny,
        color: STORY_COLORS.whiteMuted,
        align: 'center',
        uppercase: true,
      }
    );
    currentY += 60;

    // Load and draw logo
    const logoSize = 240;
    const logoY = currentY;

    if (this.data.logoUrl || this.data.heroImage) {
      const logoUrl = this.data.logoUrl || this.data.heroImage;
      try {
        const logoImage = await loadImage(logoUrl!);

        // Draw logo container with outline
        drawOutlineCard(this.ctx, {
          x: centerX - logoSize / 2 - 4,
          y: logoY - 4,
          width: logoSize + 8,
          height: logoSize + 8,
        }, {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderColor: this.getAccentColor(),
          borderWidth: 2,
        });

        // Draw logo image
        drawImageContain(this.ctx, logoImage, {
          x: centerX - logoSize / 2,
          y: logoY,
          width: logoSize,
          height: logoSize,
        });
      } catch {
        this.drawLogoPlaceholder(centerX, logoY, logoSize);
      }
    } else {
      this.drawLogoPlaceholder(centerX, logoY, logoSize);
    }

    currentY = logoY + logoSize + 50;

    // Draw content card with outline styling
    const cardPadding = 40;
    const cardY = currentY;
    const cardHeight = STORY_HEIGHT - cardY - 120;

    drawOutlineCard(this.ctx, {
      x: cardPadding,
      y: cardY,
      width: STORY_WIDTH - cardPadding * 2,
      height: cardHeight,
    }, {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
    });

    // Draw organization name
    currentY = cardY + 35;
    drawText(
      this.ctx,
      this.data.title,
      { x: centerX, y: currentY },
      {
        font: STORY_FONTS.titleMedium,
        color: STORY_COLORS.white,
        align: 'center',
        maxWidth: STORY_WIDTH - padding * 2,
      }
    );
    currentY += 60;

    // Gold divider
    drawGoldDivider(this.ctx, currentY, {
      startX: padding,
      endX: STORY_WIDTH - padding,
      thickness: 2,
    });
    currentY += 35;

    // Draw tagline if provided
    if (this.data.tagline) {
      const textHeight = drawWrappedText(
        this.ctx,
        this.data.tagline,
        { x: centerX, y: currentY },
        {
          font: STORY_FONTS.body,
          color: STORY_COLORS.whiteTransparent,
          align: 'center',
          lineHeight: 36,
        },
        STORY_WIDTH - padding * 2
      );
      currentY += textHeight + 20;
    }

    // Draw subtitle if provided
    if (this.data.subtitle) {
      drawWrappedText(
        this.ctx,
        this.data.subtitle,
        { x: centerX, y: currentY },
        {
          font: STORY_FONTS.small,
          color: STORY_COLORS.whiteMuted,
          align: 'center',
          lineHeight: 30,
        },
        STORY_WIDTH - padding * 2
      );
    }

    // Draw CTA button
    const ctaText = this.data.ctaText || 'Explore Events';
    const ctaWidth = 240;
    const ctaHeight = 50;
    const ctaX = STORY_WIDTH / 2 - ctaWidth / 2;
    const ctaY = STORY_HEIGHT - 210;

    drawCTAButton(this.ctx, ctaText, { x: ctaX, y: ctaY }, {
      width: ctaWidth,
      height: ctaHeight,
      backgroundColor: this.getAccentColor(),
      textColor: STORY_COLORS.black,
      style: 'glow',
    });
  }

  /**
   * Draw a placeholder when no logo is available
   */
  private drawLogoPlaceholder(
    centerX: number,
    y: number,
    size: number
  ): void {
    drawOutlineCard(this.ctx, {
      x: centerX - size / 2,
      y: y,
      width: size,
      height: size,
    }, {
      backgroundColor: 'rgba(30, 30, 30, 0.8)',
      borderColor: this.getAccentColor(),
      borderWidth: 2,
    });

    // Draw organization initial
    const initial = this.data.title.charAt(0).toUpperCase();

    this.ctx.save();
    this.ctx.font = `bold ${size * 0.45}px Canela, Georgia, serif`;
    this.ctx.fillStyle = this.getAccentColor();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(initial, centerX, y + size / 2);
    this.ctx.restore();
  }
}
