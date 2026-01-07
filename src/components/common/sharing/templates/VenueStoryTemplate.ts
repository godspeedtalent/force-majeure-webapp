import {
  BaseStoryTemplate,
  VenueStoryData,
} from './BaseStoryTemplate';
import {
  drawText,
  drawCTAButton,
  drawOutlineCard,
  drawGoldDivider,
  drawEventRow,
  drawImageCover,
  STORY_WIDTH,
  STORY_HEIGHT,
  STORY_COLORS,
  STORY_FONTS,
} from '@/shared/utils/storyImageGenerator';

/**
 * Venue Story Template
 *
 * Sleek layout with event listings:
 * - Hero image fills top ~40%
 * - Content card with outline styling
 * - Venue name and location
 * - Upcoming events (soonest first)
 * - Past events (most recent first)
 * - FM logo centered at bottom
 */
export class VenueStoryTemplate extends BaseStoryTemplate<VenueStoryData> {
  protected async drawContent(): Promise<void> {
    const heroHeightPercent = 0.38;
    const heroHeight = STORY_HEIGHT * heroHeightPercent;
    const padding = 60;

    // Load and draw hero image
    const heroImage = await this.loadHeroImage();
    if (heroImage) {
      drawImageCover(this.ctx, heroImage, {
        x: 0,
        y: 0,
        width: STORY_WIDTH,
        height: heroHeight + 60,
      });
      this.drawSleekGradient(heroHeight);
    } else {
      this.drawPlaceholderHero(heroHeightPercent);
    }

    // Draw content card with outline styling
    const cardPadding = 40;
    const cardY = heroHeight - 30;
    const cardHeight = STORY_HEIGHT - cardY - 120;

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

    // Draw content
    this.drawVenueInfo(cardY + 25, padding);
  }

  /**
   * Draw sleek gradient overlay
   */
  private drawSleekGradient(heroHeight: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
    gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0)');
    const transitionStart = (heroHeight - 80) / STORY_HEIGHT;
    gradient.addColorStop(transitionStart, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(transitionStart + 0.05, 'rgba(0, 0, 0, 0.6)');
    gradient.addColorStop(heroHeight / STORY_HEIGHT, 'rgba(0, 0, 0, 0.95)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  }

  /**
   * Draw venue information and event listings
   */
  private drawVenueInfo(startY: number, padding: number): void {
    let currentY = startY;

    // Venue label
    drawText(
      this.ctx,
      'VENUE',
      { x: padding, y: currentY },
      {
        font: STORY_FONTS.tiny,
        color: STORY_COLORS.whiteMuted,
        uppercase: true,
      }
    );
    currentY += 30;

    // Venue name
    drawText(
      this.ctx,
      this.data.title,
      { x: padding, y: currentY },
      {
        font: STORY_FONTS.titleMedium,
        color: STORY_COLORS.white,
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
    currentY += 30;

    // Location
    if (this.data.location) {
      drawText(
        this.ctx,
        this.data.location,
        { x: padding, y: currentY },
        {
          font: STORY_FONTS.body,
          color: this.getAccentColor(),
        }
      );
      currentY += 40;
    }

    // Capacity
    if (this.data.capacity) {
      drawText(
        this.ctx,
        `Capacity: ${this.data.capacity.toLocaleString()}`,
        { x: padding, y: currentY },
        {
          font: STORY_FONTS.small,
          color: STORY_COLORS.whiteMuted,
        }
      );
      currentY += 40;
    }

    // Event listings
    const hasUpcoming = this.data.upcomingEvents && this.data.upcomingEvents.length > 0;
    const hasPast = this.data.pastEvents && this.data.pastEvents.length > 0;
    const maxEvents = 5;

    if (hasUpcoming || hasPast) {
      currentY += 20;

      // Upcoming events section
      if (hasUpcoming) {
        drawText(
          this.ctx,
          'UPCOMING EVENTS',
          { x: padding, y: currentY },
          {
            font: STORY_FONTS.tiny,
            color: this.getAccentColor(),
            uppercase: true,
          }
        );
        currentY += 25;

        const upcomingToShow = this.data.upcomingEvents!.slice(0, maxEvents);
        for (const event of upcomingToShow) {
          const rowHeight = drawEventRow(
            this.ctx,
            { x: padding, y: currentY },
            { title: event.title, date: event.date, isPast: false },
            { width: STORY_WIDTH - padding * 2, height: 45 }
          );
          currentY += rowHeight + 5;
        }
        currentY += 15;
      }

      // Past events section
      if (hasPast && currentY < STORY_HEIGHT - 300) {
        drawText(
          this.ctx,
          'RECENT EVENTS',
          { x: padding, y: currentY },
          {
            font: STORY_FONTS.tiny,
            color: STORY_COLORS.whiteMuted,
            uppercase: true,
          }
        );
        currentY += 25;

        const remainingSpace = STORY_HEIGHT - 280 - currentY;
        const maxPastEvents = Math.min(
          maxEvents - (this.data.upcomingEvents?.length || 0),
          Math.floor(remainingSpace / 50)
        );
        const pastToShow = this.data.pastEvents!.slice(0, Math.max(1, maxPastEvents));

        for (const event of pastToShow) {
          const rowHeight = drawEventRow(
            this.ctx,
            { x: padding, y: currentY },
            { title: event.title, date: event.date, isPast: true },
            { width: STORY_WIDTH - padding * 2, height: 45 }
          );
          currentY += rowHeight + 5;
        }
      }
    }

    // CTA Button
    const ctaText = this.data.ctaText || 'View Events';
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
}
