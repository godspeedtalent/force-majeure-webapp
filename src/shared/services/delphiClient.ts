/**
 * Delphi API Client
 * 
 * Lightweight client for interacting with the Delphi application API.
 * Currently supports service authentication using secret/private keys.
 * 
 * @see https://docs.delphi.app (documentation stub)
 */

// Environment configuration
const DELPHI_API_BASE_URL = process.env.DELPHI_API_BASE_URL || 'https://api.delphi.app';
const DELPHI_API_KEY = process.env.DELPHI_API_KEY || '';
const DELPHI_SECRET_KEY = process.env.DELPHI_SECRET_KEY || '';

interface DelphiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  body?: any;
  headers?: Record<string, string>;
}

interface DelphiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Base request handler for Delphi API
 */
async function delphiRequest<T>({
  method,
  endpoint,
  body,
  headers = {},
}: DelphiRequestConfig): Promise<DelphiResponse<T>> {
  const url = `${DELPHI_API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': DELPHI_API_KEY,
      'X-Secret-Key': DELPHI_SECRET_KEY,
      ...headers,
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 500,
    };
  }
}

// ============================================================================
// VENUES
// ============================================================================

export interface DelphiVenue {
  id: string;
  name: string;
  address?: string;
  city?: string;
  capacity?: number;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

export const delphiVenues = {
  /**
   * Get all venues
   */
  async list(): Promise<DelphiResponse<DelphiVenue[]>> {
    return delphiRequest<DelphiVenue[]>({
      method: 'GET',
      endpoint: '/venues',
    });
  },

  /**
   * Get a single venue by ID
   */
  async get(id: string): Promise<DelphiResponse<DelphiVenue>> {
    return delphiRequest<DelphiVenue>({
      method: 'GET',
      endpoint: `/venues/${id}`,
    });
  },

  /**
   * Create or update a venue (upsert)
   */
  async upsert(venue: Partial<DelphiVenue>): Promise<DelphiResponse<DelphiVenue>> {
    return delphiRequest<DelphiVenue>({
      method: 'POST',
      endpoint: '/venues/upsert',
      body: venue,
    });
  },

  /**
   * Delete a venue
   */
  async delete(id: string): Promise<DelphiResponse<void>> {
    return delphiRequest<void>({
      method: 'DELETE',
      endpoint: `/venues/${id}`,
    });
  },
};

// ============================================================================
// ARTISTS
// ============================================================================

export interface DelphiArtist {
  id: string;
  name: string;
  genre?: string;
  bio?: string;
  image_url?: string;
  social_links?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export const delphiArtists = {
  /**
   * Get all artists
   */
  async list(): Promise<DelphiResponse<DelphiArtist[]>> {
    return delphiRequest<DelphiArtist[]>({
      method: 'GET',
      endpoint: '/artists',
    });
  },

  /**
   * Get a single artist by ID
   */
  async get(id: string): Promise<DelphiResponse<DelphiArtist>> {
    return delphiRequest<DelphiArtist>({
      method: 'GET',
      endpoint: `/artists/${id}`,
    });
  },

  /**
   * Create or update an artist (upsert)
   */
  async upsert(artist: Partial<DelphiArtist>): Promise<DelphiResponse<DelphiArtist>> {
    return delphiRequest<DelphiArtist>({
      method: 'POST',
      endpoint: '/artists/upsert',
      body: artist,
    });
  },

  /**
   * Delete an artist
   */
  async delete(id: string): Promise<DelphiResponse<void>> {
    return delphiRequest<void>({
      method: 'DELETE',
      endpoint: `/artists/${id}`,
    });
  },
};

// ============================================================================
// EVENTS
// ============================================================================

export interface DelphiEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue_id?: string;
  headliner_id?: string;
  description?: string;
  hero_image?: string;
  ticket_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const delphiEvents = {
  /**
   * Get all events
   */
  async list(): Promise<DelphiResponse<DelphiEvent[]>> {
    return delphiRequest<DelphiEvent[]>({
      method: 'GET',
      endpoint: '/events',
    });
  },

  /**
   * Get a single event by ID
   */
  async get(id: string): Promise<DelphiResponse<DelphiEvent>> {
    return delphiRequest<DelphiEvent>({
      method: 'GET',
      endpoint: `/events/${id}`,
    });
  },

  /**
   * Create or update an event (upsert)
   */
  async upsert(event: Partial<DelphiEvent>): Promise<DelphiResponse<DelphiEvent>> {
    return delphiRequest<DelphiEvent>({
      method: 'POST',
      endpoint: '/events/upsert',
      body: event,
    });
  },

  /**
   * Delete an event
   */
  async delete(id: string): Promise<DelphiResponse<void>> {
    return delphiRequest<void>({
      method: 'DELETE',
      endpoint: `/events/${id}`,
    });
  },
};

// ============================================================================
// PROJECTIONS
// ============================================================================

export interface DelphiProjection {
  id: string;
  event_id: string;
  metric: string;
  value: number;
  confidence?: number;
  created_at?: string;
  updated_at?: string;
}

export const delphiProjections = {
  /**
   * Get all projections
   */
  async list(): Promise<DelphiResponse<DelphiProjection[]>> {
    return delphiRequest<DelphiProjection[]>({
      method: 'GET',
      endpoint: '/projections',
    });
  },

  /**
   * Get a single projection by ID
   */
  async get(id: string): Promise<DelphiResponse<DelphiProjection>> {
    return delphiRequest<DelphiProjection>({
      method: 'GET',
      endpoint: `/projections/${id}`,
    });
  },

  /**
   * Create or update a projection (upsert)
   */
  async upsert(projection: Partial<DelphiProjection>): Promise<DelphiResponse<DelphiProjection>> {
    return delphiRequest<DelphiProjection>({
      method: 'POST',
      endpoint: '/projections/upsert',
      body: projection,
    });
  },

  /**
   * Delete a projection
   */
  async delete(id: string): Promise<DelphiResponse<void>> {
    return delphiRequest<void>({
      method: 'DELETE',
      endpoint: `/projections/${id}`,
    });
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export const delphiClient = {
  venues: delphiVenues,
  artists: delphiArtists,
  events: delphiEvents,
  projections: delphiProjections,
};

export default delphiClient;
