/**
 * MockDataFactory - Reusable utility for generating dynamic mock data
 *
 * This factory provides common random data generation utilities that can be used
 * across different mock data services (artists, events, venues, users, etc.)
 */

// ========================================
// Name Data
// ========================================

const FIRST_NAMES = [
  'Luna', 'Nova', 'Echo', 'Zara', 'Kai', 'Milo', 'Felix', 'Sage',
  'Phoenix', 'River', 'Storm', 'Blaze', 'Jade', 'Raven', 'Orion',
  'Atlas', 'Ember', 'Zenith', 'Lyric', 'Flux', 'Vex', 'Nyx', 'Sol',
  'Astrid', 'Zephyr', 'Onyx', 'Cosmo', 'Elektra', 'Cipher', 'Hex'
];

const LAST_NAMES = [
  'Beats', 'Waves', 'Sound', 'Bass', 'Flow', 'Pulse', 'Rhythm',
  'Groove', 'Synth', 'Vibe', 'Drop', 'Mix', 'Spin', 'Loop', 'Fade',
  'Echo', 'Rise', 'Drift', 'Surge', 'Bloom', 'Haze', 'Dusk', 'Dawn'
];

const DJ_PREFIXES = ['DJ', 'The', 'MC', 'Sir', 'Lady', 'Dr.', 'Professor', ''];
const DJ_SUFFIXES = ['', 'X', '2.0', 'Official', 'Music', 'Audio', 'Collective'];

// ========================================
// Bio Templates
// ========================================

const BIO_TEMPLATES = [
  'Born and raised in {city}, {name} has been pushing the boundaries of {genre} for over {years} years. Known for their signature blend of {adj1} beats and {adj2} melodies, they\'ve built a loyal following across Texas and beyond.',
  '{name} is a {city}-based {genre} artist who brings raw energy and innovative sound design to every set. Their journey began in underground venues and has evolved into headline performances at major festivals.',
  'Representing the {city} music scene, {name} crafts immersive sonic experiences that blend {genre} with elements of {genre2}. Their productions have garnered support from industry heavyweights worldwide.',
  'From late-night warehouse parties to main stage festival appearances, {name} has made their mark on the {genre} scene. Based in {city}, they continue to push creative boundaries with every release.',
  '{name} is more than just a DJ – they\'re a curator of vibes. Specializing in {genre} with hints of {genre2}, this {city} native creates unforgettable moments on the dancefloor.',
];

const ADJECTIVES = [
  'hypnotic', 'driving', 'ethereal', 'pulsating', 'atmospheric', 'melodic',
  'dark', 'uplifting', 'groovy', 'deep', 'progressive', 'minimal',
  'explosive', 'smooth', 'raw', 'organic', 'synthetic', 'cosmic'
];

const GENRE_NAMES = [
  'house', 'techno', 'trance', 'bass', 'dubstep', 'drum and bass',
  'deep house', 'tech house', 'progressive house', 'melodic techno',
  'breakbeat', 'electro', 'ambient', 'downtempo', 'garage'
];

const CITIES = ['Austin', 'Houston', 'San Marcos', 'Dallas', 'San Antonio'];

// ========================================
// Image Placeholders (using picsum for demo)
// ========================================

const PROFILE_IMAGE_SIZE = 400;
const PRESS_IMAGE_SIZE = 600;

// ========================================
// Social Media Data
// ========================================

const INSTAGRAM_HANDLES_PREFIXES = ['dj_', 'the_', 'official_', '', 'its_', 'real_'];
const TIKTOK_HANDLES_PREFIXES = ['@', 'dj.', 'the.', ''];

// ========================================
// Track/Set Names
// ========================================

const TRACK_NAME_PARTS = {
  adjectives: ['Midnight', 'Electric', 'Cosmic', 'Deep', 'Dark', 'Golden', 'Neon', 'Velvet', 'Chrome', 'Solar'],
  nouns: ['Dreams', 'Waves', 'Journey', 'Horizon', 'Echo', 'Pulse', 'Flow', 'Storm', 'Vision', 'State'],
  verbs: ['Rising', 'Falling', 'Dancing', 'Moving', 'Floating', 'Running', 'Flying', 'Breaking', 'Building', 'Dropping'],
};

const SET_LOCATIONS = [
  'Warehouse Party', 'Rooftop Session', 'Underground', 'Festival', 'Club Night',
  'After Hours', 'Pool Party', 'Beach Sunset', 'Studio Session', 'Live Stream'
];

// ========================================
// Talent Differentiators
// ========================================

const TALENT_DIFFERENTIATORS = [
  'I bring a unique fusion of live instrumentation with electronic production, creating an organic sound that stands out.',
  'My sets are known for seamless blending across tempos and genres, taking the crowd on an unpredictable journey.',
  'I produce all original music and have built my sound from the ground up without relying on mainstream hits.',
  'Years of classical training inform my melodic sensibilities, giving my productions a distinctive harmonic depth.',
  'I specialize in reading the crowd and adapting in real-time, ensuring every set feels custom-tailored to the moment.',
  'My background in sound engineering allows me to craft pristine mixes with surgical precision.',
  'I bring theatrical elements and visual storytelling to my performances, creating immersive experiences.',
];

// ========================================
// Crowd Sources
// ========================================

const CROWD_SOURCES = [
  'Strong social media following with engaged community. Friends and family in the local scene.',
  'Built my audience through consistent gigging at local venues. Word of mouth has been my biggest driver.',
  'Active in multiple music communities online and offline. Connected with promoters across Texas.',
  'Regular performer at underground events. The scene knows my name and what I bring.',
  'Released music on established labels that has its own following. Collaborations with known artists.',
  'Run my own events and have developed a loyal community of attendees who follow me to any show.',
];

// ========================================
// MockDataFactory Class
// ========================================

export class MockDataFactory {
  /**
   * Generate a random integer between min and max (inclusive)
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get a random element from an array
   */
  static randomElement<T>(array: readonly T[]): T {
    return array[this.randomInt(0, array.length - 1)];
  }

  /**
   * Get multiple random elements from an array (without duplicates)
   */
  static randomElements<T>(array: readonly T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Generate a random boolean with optional probability
   */
  static randomBoolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  /**
   * Generate a random UUID-like string
   */
  static generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a random DJ/artist stage name
   */
  static generateStageName(): string {
    const usePrefix = this.randomBoolean(0.4);
    const useSuffix = this.randomBoolean(0.2);
    const useCompound = this.randomBoolean(0.5);

    let name = '';

    if (usePrefix) {
      const prefix = this.randomElement(DJ_PREFIXES);
      if (prefix) name += prefix + ' ';
    }

    if (useCompound) {
      name += this.randomElement(FIRST_NAMES) + this.randomElement(LAST_NAMES);
    } else {
      name += this.randomElement(FIRST_NAMES);
    }

    if (useSuffix) {
      const suffix = this.randomElement(DJ_SUFFIXES);
      if (suffix) name += ' ' + suffix;
    }

    return name.trim();
  }

  /**
   * Generate a random bio for an artist
   */
  static generateArtistBio(stageName: string, genres: string[] = []): string {
    const template = this.randomElement(BIO_TEMPLATES);
    const city = this.randomElement(CITIES);
    const years = this.randomInt(2, 15);
    const genre = genres.length > 0 ? genres[0] : this.randomElement(GENRE_NAMES);
    const genre2 = genres.length > 1 ? genres[1] : this.randomElement(GENRE_NAMES);
    const adj1 = this.randomElement(ADJECTIVES);
    const adj2 = this.randomElement(ADJECTIVES);

    return template
      .replace('{name}', stageName)
      .replace('{city}', city)
      .replace('{years}', years.toString())
      .replace('{genre}', genre)
      .replace('{genre2}', genre2)
      .replace('{adj1}', adj1)
      .replace('{adj2}', adj2);
  }

  /**
   * Generate a random placeholder profile image URL
   */
  static generateProfileImageUrl(): string {
    const seed = this.randomInt(1, 1000);
    return `https://picsum.photos/seed/${seed}/${PROFILE_IMAGE_SIZE}/${PROFILE_IMAGE_SIZE}`;
  }

  /**
   * Generate a random placeholder press image URL
   */
  static generatePressImageUrl(): string {
    const seed = this.randomInt(1000, 2000);
    return `https://picsum.photos/seed/${seed}/${PRESS_IMAGE_SIZE}/${PRESS_IMAGE_SIZE}`;
  }

  /**
   * Generate a random Instagram handle from a stage name
   */
  static generateInstagramHandle(stageName: string): string {
    const prefix = this.randomElement(INSTAGRAM_HANDLES_PREFIXES);
    const cleanName = stageName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    return prefix + cleanName;
  }

  /**
   * Generate a random TikTok handle from a stage name
   */
  static generateTikTokHandle(stageName: string): string {
    const prefix = this.randomElement(TIKTOK_HANDLES_PREFIXES);
    const cleanName = stageName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    return prefix + cleanName;
  }

  /**
   * Generate a random track/set name
   */
  static generateTrackName(): string {
    const useAdjNoun = this.randomBoolean(0.6);
    if (useAdjNoun) {
      return `${this.randomElement(TRACK_NAME_PARTS.adjectives)} ${this.randomElement(TRACK_NAME_PARTS.nouns)}`;
    }
    return `${this.randomElement(TRACK_NAME_PARTS.verbs)} ${this.randomElement(TRACK_NAME_PARTS.nouns)}`;
  }

  /**
   * Generate a random DJ set name
   */
  static generateDJSetName(stageName: string): string {
    const location = this.randomElement(SET_LOCATIONS);
    const year = new Date().getFullYear();
    const month = this.randomElement(['January', 'February', 'March', 'April', 'May', 'June']);
    return `${stageName} - ${location} ${month} ${year}`;
  }

  /**
   * Generate a random talent differentiator
   */
  static generateTalentDifferentiator(): string {
    return this.randomElement(TALENT_DIFFERENTIATORS);
  }

  /**
   * Generate a random crowd source description
   */
  static generateCrowdSources(): string {
    return this.randomElement(CROWD_SOURCES);
  }

  /**
   * Get a random city name
   */
  static getRandomCity(): string {
    return this.randomElement(CITIES);
  }

  /**
   * Get a random paid show count group
   */
  static getRandomPaidShowCountGroup(): string {
    return this.randomElement(['1-5', '6-15', '15-50', '50+']);
  }
}

export default MockDataFactory;
