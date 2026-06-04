// ===== SERVICIO DE ANIME =====
// Fuente: AniList GraphQL API (graphql.anilist.co)
// API pública, gratuita, sin rate limits agresivos (90 req/min)
// Cache TTL: 5 minutos para búsquedas, 10 minutos para info

const axios = require('axios');
const { cache } = require('../utils/cache');

const ANILIST_BASE = 'https://graphql.anilist.co';
const SEARCH_CACHE_TTL = 300; // 5 min
const INFO_CACHE_TTL = 600; // 10 min

/**
 * Buscar animes por término
 */
async function searchAnime(query) {
    const cleanQuery = (query || '').toString().trim();
    if (!cleanQuery) return { success: true, data: { query, results: [], count: 0 } };

    const cacheKey = `anime:search:${cleanQuery.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return { success: true, data: { query, results: cached, count: cached.length } };

    try {
        const graphqlQuery = `
            query ($search: String!, $page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(search: $search, type: ANIME) {
                        id
                        idMal
                        title {
                            romaji
                            english
                            native
                        }
                        type
                        status
                        episodes
                        source
                        format
                        genres
                        description
                        coverImage {
                            large
                        }
                        bannerImage
                        averageScore
                        siteUrl
                    }
                }
            }
        `;

        const response = await axios.post(ANILIST_BASE,
            {
                query: graphqlQuery,
                variables: {
                    search: cleanQuery,
                    page: 1,
                    perPage: 10
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        if (response.data.errors) {
            console.warn('AniList API error:', response.data.errors[0].message);
            return { success: false, error: response.data.errors[0].message };
        }

        const results = (response.data.data?.Page?.media || []).map((anime) => ({
            id: anime.id,
            malId: anime.idMal,
            title: anime.title?.romaji || anime.title?.english || 'Unknown',
            slug: String(anime.id),
            url: anime.siteUrl || `https://anilist.co/anime/${anime.id}`,
            image: anime.coverImage?.large || '',
            type: 'anime',
            genres: anime.genres || [],
            episodes: anime.episodes || 0,
            status: anime.status || 'Unknown',
            rating: anime.averageScore || 0
        }));

        cache.set(cacheKey, results, SEARCH_CACHE_TTL);
        return { success: true, data: { query, results, count: results.length } };
    } catch (e) {
        console.warn('AniList API search error:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Obtener información detallada de un anime
 */
async function getAnimeInfo(url) {
    const cacheKey = `anime:info:${url}`;
    const cached = cache.get(cacheKey);
    if (cached) return { success: true, data: cached };

    try {
        // Extraer ID de la URL (anilist.co/anime/[id])
        const idMatch = url.match(/anime\/(\d+)/);
        if (!idMatch) return { success: false, error: 'Invalid anime URL' };

        const id = idMatch[1];
        const graphqlQuery = `
            query ($id: Int!) {
                Media(id: $id, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                    }
                    description
                    coverImage {
                        large
                    }
                    episodes
                    genres
                    averageScore
                    status
                    siteUrl
                }
            }
        `;

        const response = await axios.post(ANILIST_BASE,
            {
                query: graphqlQuery,
                variables: { id: parseInt(id) }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        if (response.data.errors) {
            return { success: false, error: response.data.errors[0].message };
        }

        const anime = response.data.data?.Media;
        const info = {
            title: anime.title?.romaji || anime.title?.english || 'Unknown',
            image: anime.coverImage?.large || '',
            description: anime.description || '',
            episodes: anime.episodes || 0,
            genres: anime.genres || [],
            rating: anime.averageScore || 0,
            status: anime.status || 'Unknown'
        };

        cache.set(cacheKey, info, INFO_CACHE_TTL);
        return { success: true, data: info };
    } catch (e) {
        console.warn('AniList API info error:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Obtener links de episodios (AniList no provee links directos de streaming)
 */
async function getEpisodeLinks(url) {
    try {
        const idMatch = url.match(/anime\/(\d+)/);
        if (!idMatch) return { success: false, error: 'Invalid URL' };

        const id = idMatch[1];
        const graphqlQuery = `
            query ($id: Int!) {
                Media(id: $id, type: ANIME) {
                    id
                    episodes
                    title {
                        romaji
                    }
                    siteUrl
                }
            }
        `;

        const response = await axios.post(ANILIST_BASE,
            {
                query: graphqlQuery,
                variables: { id: parseInt(id) }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        if (response.data.errors) {
            return { success: false, error: response.data.errors[0].message };
        }

        const anime = response.data.data?.Media;
        const episodeCount = anime.episodes || 0;

        const episodes = Array.from({ length: episodeCount }, (_, idx) => ({
            number: idx + 1,
            title: `Episodio ${idx + 1}`,
            url: `${anime.siteUrl}#${idx + 1}`
        }));

        return {
            success: true,
            data: {
                servers: [{
                    server: 'AniList',
                    url: anime.siteUrl,
                    type: 'info'
                }],
                episodes: episodes
            }
        };
    } catch (e) {
        console.warn('AniList API episodes error:', e.message);
        return { success: false, error: e.message };
    }
}

module.exports = {
    searchAnime,
    getAnimeInfo,
    getEpisodeLinks
};
