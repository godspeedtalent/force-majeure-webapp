import {
  createStoryCanvas,
  fillBackground,
  drawTopographyPatternImage,
  drawTopographyPattern,
  drawGradientOverlay,
  drawFMLogoImage,
  drawDivider,
  loadImage,
  drawImageCover,
  waitForFonts,
  canvasToBlob,
  canvasToDataUrl,
  STORY_WIDTH,
  STORY_HEIGHT,
  STORY_COLORS,
} from '@/shared/utils/storyImageGenerator';
import { logger } from '@/shared/services/logger';

/**
 * Entity types supported by story templates
 */
export type StoryEntityType = 'event' | 'artist' | 'venue' | 'organization';

/**
 * Base configuration for all story templates
 */
export interface BaseStoryConfig {
  entityType: StoryEntityType;
  heroImage: string | null;
  title: string;
  subtitle?: string;
  url: string;
  accentColor?: string;
}

/**
 * Event-specific story data
 */
export interface EventStoryData extends BaseStoryConfig {
  entityType: 'event';
  date?: string;
  time?: string;
  venue?: string;
  location?: string;
  ctaText?: string;
}

/**
 * Event row data for artist/venue story templates
 */
export interface StoryEventRow {
  title: string;
  date: string;
  isPast?: boolean;
}

/**
 * Artist-specific story data
 */
export interface ArtistStoryData extends BaseStoryConfig {
  entityType: 'artist';
  genres?: string[];
  /** Upcoming events (soonest first) */
  upcomingEvents?: StoryEventRow[];
  /** Past events (most recent first) */
  pastEvents?: StoryEventRow[];
  /** @deprecated Use upcomingEvents instead */
  upcomingEvent?: {
    title: string;
    date: string;
  };
}

/**
 * Venue-specific story data
 */
export interface VenueStoryData extends BaseStoryConfig {
  entityType: 'venue';
  location?: string;
  capacity?: number;
  ctaText?: string;
  /** Upcoming events (soonest first) */
  upcomingEvents?: StoryEventRow[];
  /** Past events (most recent first) */
  pastEvents?: StoryEventRow[];
}

/**
 * Organization-specific story data
 */
export interface OrganizationStoryData extends BaseStoryConfig {
  entityType: 'organization';
  logoUrl?: string;
  tagline?: string;
  ctaText?: string;
}

/**
 * Union type for all story data types
 */
export type StoryData =
  | EventStoryData
  | ArtistStoryData
  | VenueStoryData
  | OrganizationStoryData;

/**
 * Result of story generation
 */
export interface StoryGenerationResult {
  blob: Blob;
  dataUrl: string;
}

/**
 * Base class for story template rendering
 * Provides common functionality for all entity types
 */
export abstract class BaseStoryTemplate<T extends StoryData> {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected data: T;

  constructor(data: T) {
    this.data = data;
    const { canvas, ctx } = createStoryCanvas();
    this.canvas = canvas;
    this.ctx = ctx;
  }

  /**
   * Generate the story image
   */
  async generate(): Promise<StoryGenerationResult> {
    try {
      // Wait for fonts to load
      await waitForFonts();

      // Draw common base elements
      await this.drawBase();

      // Draw entity-specific content
      await this.drawContent();

      // Draw common footer elements
      await this.drawFooter();

      // Convert to blob and data URL
      const blob = await canvasToBlob(this.canvas);
      const dataUrl = canvasToDataUrl(this.canvas);

      logger.info('Story image generated successfully', {
        entityType: this.data.entityType,
        title: this.data.title,
        source: 'BaseStoryTemplate.generate',
      });

      return { blob, dataUrl };
    } catch (error) {
      logger.error('Failed to generate story image', {
        error: error instanceof Error ? error.message : 'Unknown',
        entityType: this.data.entityType,
        source: 'BaseStoryTemplate.generate',
      });
      throw error;
    }
  }

  /**
   * Draw the common base elements (background, topography)
   */
  protected async drawBase(): Promise<void> {
    // Fill with black background
    fillBackground(this.ctx, STORY_COLORS.black);

    // Draw topography pattern using actual image (with fallback to generated)
    await drawTopographyPatternImage(this.ctx, 0.15);
  }

  /**
   * Draw entity-specific content (abstract - implemented by subclasses)
   */
  protected abstract drawContent(): Promise<void>;

  /**
   * Draw common footer elements (FM logo centered at bottom)
   */
  protected async drawFooter(): Promise<void> {
    const padding = 60;

    // Draw FM logo centered at bottom with gold glow
    await drawFMLogoImage(
      this.ctx,
      { x: STORY_WIDTH / 2, y: STORY_HEIGHT - padding },
      {
        width: 220,
        height: 65,
        glow: true,
        glowColor: STORY_COLORS.gold,
        align: 'center',
      }
    );
  }

  /**
   * Helper: Load hero image if available
   */
  protected async loadHeroImage(): Promise<HTMLImageElement | null> {
    if (!this.data.heroImage) {
      return null;
    }

    try {
      return await loadImage(this.data.heroImage);
    } catch (error) {
      logger.warn('Failed to load hero image, continuing without it', {
        heroImage: this.data.heroImage,
        source: 'BaseStoryTemplate.loadHeroImage',
      });
      return null;
    }
  }

  /**
   * Helper: Draw hero image with gradient overlay
   */
  protected drawHeroImageWithGradient(
    img: HTMLImageElement,
    heightPercent: number = 0.6,
    gradientDirection: 'bottom' | 'full' = 'bottom'
  ): void {
    const heroHeight = STORY_HEIGHT * heightPercent;

    // Draw image covering the hero area
    drawImageCover(this.ctx, img, {
      x: 0,
      y: 0,
      width: STORY_WIDTH,
      height: heroHeight,
    });

    // Add gradient overlay for text readability
    drawGradientOverlay(this.ctx, gradientDirection, 0.8, 0);
  }

  /**
   * Helper: Draw placeholder when no hero image available
   */
  protected drawPlaceholderHero(heightPercent: number = 0.6): void {
    const heroHeight = STORY_HEIGHT * heightPercent;

    // Draw a subtle gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, heroHeight);
    gradient.addColorStop(0, 'rgba(30, 30, 30, 1)');
    gradient.addColorStop(1, 'rgba(10, 10, 10, 1)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, STORY_WIDTH, heroHeight);

    // Add extra topography in placeholder area
    this.ctx.save();
    this.ctx.globalAlpha = 0.1;
    drawTopographyPattern(this.ctx, 0.2);
    this.ctx.restore();
  }

  /**
   * Helper: Get full URL (prepend domain if relative)
   */
  protected getFullUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }
    // Use the current origin or a default
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://forcemajeure.com';
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  /**
   * Helper: Draw a content section divider
   */
  protected drawSectionDivider(y: number): void {
    drawDivider(this.ctx, y, {
      startX: 60,
      endX: STORY_WIDTH - 60,
      opacity: 0.3,
      gradient: true,
    });
  }

  /**
   * Helper: Get accent color (defaults to FM gold)
   */
  protected getAccentColor(): string {
    return this.data.accentColor || STORY_COLORS.gold;
  }
}

/**
 * Factory function to create the appropriate template based on entity type
 */
export async function createStoryTemplate(
  data: StoryData
): Promise<StoryGenerationResult> {
  // Dynamic import to avoid circular dependencies
  let template: BaseStoryTemplate<StoryData>;

  switch (data.entityType) {
    case 'event': {
      const { EventStoryTemplate } = await import('./EventStoryTemplate');
      template = new EventStoryTemplate(data as EventStoryData);
      break;
    }
    case 'artist': {
      const { ArtistStoryTemplate } = await import('./ArtistStoryTemplate');
      template = new ArtistStoryTemplate(data as ArtistStoryData);
      break;
    }
    case 'venue': {
      const { VenueStoryTemplate } = await import('./VenueStoryTemplate');
      template = new VenueStoryTemplate(data as VenueStoryData);
      break;
    }
    case 'organization': {
      const { OrganizationStoryTemplate } = await import(
        './OrganizationStoryTemplate'
      );
      template = new OrganizationStoryTemplate(data as OrganizationStoryData);
      break;
    }
    default:
      throw new Error(`Unknown entity type: ${(data as StoryData).entityType}`);
  }

  return template.generate();
}
