/**
 * Artist Query Service
 *
 * Centralized query builders for artist-related database operations.
 */
import { supabase } from '@/shared';
/**
 * Get a single artist by ID
 */
export const getArtistById = async (artistId) => {
    const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();
    if (error)
        throw error;
    return data;
};
/**
 * Get all artists
 */
export const getAllArtists = async () => {
    const { data, error } = await supabase
        .from('artists')
        .select('id, name, bio, image_url, spotify_id, website_url, genre')
        .order('name', { ascending: true });
    if (error)
        throw error;
    return data;
};
/**
 * Search artists by name
 */
export const searchArtists = async (searchTerm) => {
    const { data, error } = await supabase
        .from('artists')
        .select('id, name, bio, image_url, genre')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true });
    if (error)
        throw error;
    return data;
};
/**
 * Get artists by genre
 */
export const getArtistsByGenre = async (genre) => {
    const { data, error } = await supabase
        .from('artists')
        .select('id, name, bio, image_url, genre')
        .eq('genre', genre)
        .order('name', { ascending: true });
    if (error)
        throw error;
    return data;
};
/**
 * Get artist name only (lightweight query)
 */
export const getArtistName = async (artistId) => {
    const { data, error } = await supabase
        .from('artists')
        .select('name')
        .eq('id', artistId)
        .single();
    if (error)
        throw error;
    return data;
};
