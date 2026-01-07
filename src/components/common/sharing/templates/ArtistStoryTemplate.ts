import {
  BaseStoryTemplate,
  ArtistStoryData,
} from './BaseStoryTemplate';
import {
  drawText,
  drawBadgeRow,
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
 * Artist Story Template
 *
 * Sleek spotlight-inspired layout with event listings:
 * - Hero image fills top ~40%
 * - Content card with outline styling
 * - "ARTIST SPOTLIGHT" header
 * - Artist name and genre badges
 * - Upcoming events (soonest first)
 * - Past events (most recent first)
 * - FM logo centered at bottom
 */
export class ArtistStoryTemplate extends BaseStoryTemplate<ArtistStoryData> {
  protected async drawContent(): Promise<void> {
    const heroHeightPercent = 0.4;
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
    this.drawArtistInfo(cardY + 25, padding);
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
   * Draw artist information and event listings
   */
  private drawArtistInfo(startY: number, padding: number): void {
    let currentY = startY;

    // "ARTIST SPOTLIGHT" label
    drawText(
      this.ctx,
      'ARTIST SPOTLIGHT',
      { x: padding, y: currentY },
      {
        font: STORY_FONTS.tiny,
        color: STORY_COLORS.whiteMuted,
        uppercase: true,
      }
    );
    currentY += 30;

    // Artist name
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

    // Genre badges
    if (this.data.genres && this.data.genres.length > 0) {
      drawBadgeRow(
        this.ctx,
        this.data.genres.slice(0, 3),
        { x: padding, y: currentY },
        12,
        {
          borderColor: this.getAccentColor(),
          textColor: this.getAccentColor(),
          backgroundColor: 'rgba(223, 186, 125, 0.1)',
        }
      );
      currentY += 60;
    }

    // Event listings
    const hasUpcoming = this.data.upcomingEvents && this.data.upcomingEvents.length > 0;
    const hasPast = this.data.pastEvents && this.data.pastEvents.length > 0;
    // Legacy support for single upcoming event
    const hasLegacyUpcoming = this.data.upcomingEvent && !hasUpcoming;
    const maxEvents = 5;

    if (hasUpcoming || hasPast || hasLegacyUpcoming) {
      currentY += 15;

      // Upcoming events section
      if (hasUpcoming) {
        drawText(
          this.ctx,
          'UPCOMING SHOWS',
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
      } else if (hasLegacyUpcoming) {
        // Legacy single event support
        drawText(
          this.ctx,
          'UPCOMING',
          { x: padding, y: currentY },
          {
            font: STORY_FONTS.tiny,
            color: this.getAccentColor(),
            uppercase: true,
          }
        );
        currentY += 25;

        const rowHeight = drawEventRow(
          this.ctx,
          { x: padding, y: currentY },
          { title: this.data.upcomingEvent!.title, date: this.data.upcomingEvent!.date, isPast: false },
          { width: STORY_WIDTH - padding * 2, height: 45 }
        );
        currentY += rowHeight + 20;
      }

      // Past events section
      if (hasPast && currentY < STORY_HEIGHT - 250) {
        drawText(
          this.ctx,
          'RECENT SHOWS',
          { x: padding, y: currentY },
          {
            font: STORY_FONTS.tiny,
            color: STORY_COLORS.whiteMuted,
            uppercase: true,
          }
        );
        currentY += 25;

        const remainingSpace = STORY_HEIGHT - 230 - currentY;
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

    // Subtitle if no events
    if (this.data.subtitle && !hasUpcoming && !hasPast && !hasLegacyUpcoming) {
      currentY += 10;
      drawText(
        this.ctx,
        this.data.subtitle,
        { x: padding, y: currentY },
        {
          font: STORY_FONTS.body,
          color: STORY_COLORS.whiteMuted,
          maxWidth: STORY_WIDTH - padding * 2,
        }
      );
    }
  }
}
