/**
 * Artist and Genre Type Definitions
 *
 * Centralized types for artists and music genres with hierarchical support
 */
// ========================================
// Type Guards
// ========================================
export function isGenreWithParent(genre) {
    return 'parent' in genre;
}
export function isGenreWithChildren(genre) {
    return 'children' in genre;
}
export function isArtistWithGenres(artist) {
    return 'genres' in artist;
}
// ========================================
// Helper Functions
// ========================================
/**
 * Convert database row to Genre type
 */
export function genreFromRow(row) {
    return {
        id: row.id,
        name: row.name,
        parentId: row.parent_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
/**
 * Convert database row to Artist type
 */
export function artistFromRow(row) {
    // Timestamps should always exist in the database (set by default)
    // If they're null, something is wrong with the data
    if (!row.created_at || !row.updated_at) {
        throw new Error(`Artist ${row.id} has missing timestamps: created_at=${row.created_at}, updated_at=${row.updated_at}`);
    }
    return {
        id: row.id,
        name: row.name,
        bio: row.bio,
        imageUrl: row.image_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        genre: row.genre,
        website: row.website,
    };
}
/**
 * Convert database row to ArtistGenre type
 */
export function artistGenreFromRow(row) {
    return {
        id: row.id,
        artistId: row.artist_id,
        genreId: row.genre_id,
        isPrimary: row.is_primary ?? false,
        createdAt: row.created_at ?? new Date().toISOString(),
    };
}
/**
 * Get genre path as string (e.g., "Electronic > House > Tech House")
 */
export function getGenrePath(genre) {
    const path = [genre.name];
    let current = genre.parent;
    while (current) {
        path.unshift(current.name);
        current = isGenreWithParent(current) ? current.parent : null;
    }
    return path.join(' > ');
}
/**
 * Find primary genre from artist genres list
 */
export function getPrimaryGenre(genres) {
    const primary = genres.find(ag => ag.isPrimary);
    return primary?.genre ?? null;
}
