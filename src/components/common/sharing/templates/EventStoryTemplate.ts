import {
  BaseStoryTemplate,
  EventStoryData,
} from './BaseStoryTemplate';
import {
  drawText,
  drawCTAButton,
  drawGoldDivider,
  drawImageCover,
  drawOutlineCard,
  STORY_WIDTH,
  STORY_HEIGHT,
  STORY_COLORS,
  STORY_FONTS,
} from '@/shared/utils/storyImageGenerator';

/**
 * Event Story Template
 *
 * Sleek, spotlight-inspired layout:
 * - Hero image fills top ~45% with elegant gradient fade
 * - Content area with outline card styling
 * - Gold accent dividers with glow
 * - Prominent CTA button
 * - FM logo centered at bottom
 */
export class EventStoryTemplate extends BaseStoryTemplate<EventStoryData> {
  protected async drawContent(): Promise<void> {
    const heroHeightPercent = 0.45;
    const heroHeight = STORY_HEIGHT * heroHeightPercent;
    const padding = 60;

    // Load hero image
    const heroImage = await this.loadHeroImage();

    if (heroImage) {
      // Draw hero image
      drawImageCover(this.ctx, heroImage, {
        x: 0,
        y: 0,
        width: STORY_WIDTH,
        height: heroHeight + 80,
      });

      // Draw elegant multi-stop gradient overlay
      this.drawSleekGradient(heroHeight);
    } else {
      this.drawPlaceholderHero(heroHeightPercent);
    }

    // Draw content card with outline styling
    const cardPadding = 40;
    const cardY = heroHeight - 20;
    const cardHeight = STORY_HEIGHT - cardY - 120; // Leave room for logo

    drawOutlineCard(this.ctx, {
      x: cardPadding,
      y: cardY,
      width: STORY_WIDTH - cardPadding * 2,
      height: cardHeight,
    }, {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
    });

    // Draw content inside the card
    this.drawEventInfo(cardY + 30, padding);
  }

  /**
   * Draw a sleek multi-stop gradient for elegant transition
   */
  private drawSleekGradient(heroHeight: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);

    // Top: subtle darkening for text readability
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
    gradient.addColorStop(0.15, 'rgba(0, 0, 0, 0.05)');

    // Middle: clear image area
    gradient.addColorStop(0.25, 'rgba(0, 0, 0, 0)');

    // Bottom transition: smooth fade to black
    const transitionStart = (heroHeight - 100) / STORY_HEIGHT;
    gradient.addColorStop(transitionStart, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(transitionStart + 0.06, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(heroHeight / STORY_HEIGHT, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  }

  /**
   * Draw event information with spotlight styling
   */
  private drawEventInfo(startY: number, padding: number): void {
    let currentY = startY;

    // Event title - large and prominent
    this.ctx.save();
    this.ctx.font = STORY_FONTS.titleLarge;
    this.ctx.fillStyle = STORY_COLORS.white;

    // Measure text to handle wrapping
    const maxTitleWidth = STORY_WIDTH - padding * 2 - 40;
    const titleLines = this.wrapText(this.data.title, maxTitleWidth);

    for (const line of titleLines) {
      this.ctx.fillText(line, padding, currentY);
      currentY += 75;
    }
    this.ctx.restore();

    currentY += 5;

    // Gold divider with glow
    drawGoldDivider(this.ctx, currentY, {
      startX: padding,
      endX: STORY_WIDTH - padding,
      thickness: 2,
    });
    currentY += 35;

    // Date and time in gold
    if (this.data.date || this.data.time) {
      const dateTimeText = [this.data.date, this.data.time]
        .filter(Boolean)
        .join(' \u2022 ');

      drawText(
        this.ctx,
        dateTimeText,
        { x: padding, y: currentY },
        {
          font: STORY_FONTS.subtitle,
          color: this.getAccentColor(),
        }
      );
      currentY += 50;
    }

    // Venue name
    if (this.data.venue) {
      drawText(
        this.ctx,
        this.data.venue,
        { x: padding, y: currentY },
        {
          font: STORY_FONTS.body,
          color: STORY_COLORS.white,
        }
      );
      currentY += 38;
    }

    // Location (city)
    if (this.data.location) {
      drawText(
        this.ctx,
        this.data.location,
        { x: padding, y: currentY },
        {
          font: STORY_FONTS.small,
          color: STORY_COLORS.whiteMuted,
        }
      );
      currentY += 40;
    }

    // Subtitle / additional info
    if (this.data.subtitle) {
      currentY += 10;
      drawText(
        this.ctx,
        this.data.subtitle,
        { x: padding, y: currentY },
        {
          font: STORY_FONTS.small,
          color: STORY_COLORS.whiteMuted,
          uppercase: true,
        }
      );
    }

    // CTA Button - positioned in lower portion of card
    const ctaText = this.data.ctaText || 'Get Tickets';
    const ctaWidth = 260;
    const ctaHeight = 52;
    const ctaX = STORY_WIDTH / 2 - ctaWidth / 2;
    const ctaY = STORY_HEIGHT - 220;

    drawCTAButton(this.ctx, ctaText, { x: ctaX, y: ctaY }, {
      width: ctaWidth,
      height: ctaHeight,
      backgroundColor: this.getAccentColor(),
      textColor: STORY_COLORS.black,
      style: 'glow',
    });
  }

  /**
   * Simple text wrapping helper
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }
}
