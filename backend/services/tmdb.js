// ===== SERVICIO TMDB =====
const axios = require('axios');
const { mapResult } = require('../utils/genres');
const { cache } = require('../utils/cache');

const TMDB_KEY = process.env.TMDB_API_KEY || '';
const TMDB = 'https://api.themoviedb.org/3';

// Cache TTLs
const TTL = {
    LIST: 1800000,     // 30 min para listas
    DETAIL: 3600000,   // 1 hora para detalles
    SEARCH: 600000,    // 10 min para búsquedas
};

/**
 * Llamada genérica a TMDB con caché
 */
async function tmdbFetch(endpoint, params = {}, ttl = TTL.LIST) {
    const cacheKey = `tmdb:${endpoint}:${JSON.stringify(params)}`;

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${TMDB}${endpoint}`, {
        params: { api_key: TMDB_KEY, language: 'es-ES', ...params },
        timeout: 10000
    });

    cache.set(cacheKey, response.data, ttl);
    return response.data;
}

// ============ PELÍCULAS ============

async function getPopularMovies(page = 1) {
    const data = await tmdbFetch('/movie/popular', { page, region: 'ES' });
    return (data.results || []).map(m => mapResult(m, 'movie'));
}

async function getNowPlaying() {
    const data = await tmdbFetch('/movie/now_playing', { region: 'ES' });
    return (data.results || []).map(m => mapResult(m, 'movie'));
}

async function getTopRatedMovies() {
    const data = await tmdbFetch('/movie/top_rated', { region: 'ES' });
    return (data.results || []).map(m => mapResult(m, 'movie'));
}

async function getTrendingMovies() {
    const data = await tmdbFetch('/trending/movie/week');
    return (data.results || []).map(m => mapResult(m, 'movie'));
}

async function getMovieDetails(movieId) {
    const data = await tmdbFetch(`/movie/${movieId}`, {}, TTL.DETAIL);
    return data;
}

// ============ SERIES ============

async function getPopularSeries(page = 1) {
    const data = await tmdbFetch('/tv/popular', { page });
    return (data.results || []).map(s => mapResult(s, 'tv'));
}

async function getTopRatedSeries() {
    const data = await tmdbFetch('/tv/top_rated');
    return (data.results || []).map(s => mapResult(s, 'tv'));
}

async function getTrendingSeries() {
    const data = await tmdbFetch('/trending/tv/week');
    return (data.results || []).map(s => mapResult(s, 'tv'));
}

async function getSeriesDetails(seriesId) {
    const data = await tmdbFetch(`/tv/${seriesId}`, {}, TTL.DETAIL);
    return data;
}

async function getSeasonEpisodes(seriesId, seasonNumber) {
    const data = await tmdbFetch(`/tv/${seriesId}/season/${seasonNumber}`, {}, TTL.DETAIL);
    return data;
}

// ============ DISCOVER ============

async function discoverByGenre(genreId, type = 'movie', page = 1) {
    const isTV = type === 'tv';
    const endpoint = isTV ? '/discover/tv' : '/discover/movie';
    const data = await tmdbFetch(endpoint, {
        with_genres: genreId,
        sort_by: 'popularity.desc',
        'vote_count.gte': 50,
        page
    });
    return (data.results || []).map(i => mapResult(i, isTV ? 'tv' : 'movie'));
}

async function discoverByProvider(providerId, type = 'movie') {
    const isTV = type === 'tv';
    const endpoint = isTV ? '/discover/tv' : '/discover/movie';
    const data = await tmdbFetch(endpoint, {
        with_watch_providers: providerId,
        watch_region: 'ES',
        sort_by: 'popularity.desc'
    });
    return (data.results || []).map(i => mapResult(i, isTV ? 'tv' : 'movie'));
}

// ============ BÚSQUEDA ============

async function searchMulti(query) {
    const data = await tmdbFetch('/search/multi', { query }, TTL.SEARCH);
    return (data.results || [])
        .filter(x => x.media_type === 'movie' || x.media_type === 'tv')
        .map(x => mapResult(x, x.media_type === 'tv' ? 'tv' : 'movie'));
}

module.exports = {
    getPopularMovies,
    getNowPlaying,
    getTopRatedMovies,
    getTrendingMovies,
    getMovieDetails,
    getPopularSeries,
    getTopRatedSeries,
    getTrendingSeries,
    getSeriesDetails,
    getSeasonEpisodes,
    discoverByGenre,
    discoverByProvider,
    searchMulti
};
