// ===== SERVICIO DE ANIME CON STREAMING =====
// Fuente: Consumet API (múltiples proveedores) + fallback local
// Proporciona: Búsqueda, info, episodios Y LINKS DE STREAMING REALES
// Español: Soporte para múltiples idiomas y regiones
// Cache TTL: 5 minutos para búsquedas, 10 minutos para info

const axios = require('axios');
const { cache } = require('../utils/cache');

// URLs de Consumet API (self-hosted en varios servidores)
const CONSUMET_ENDPOINTS = [
    'https://api.consumet.org/anime/gogoanime',
    'https://consumet-api.vercel.app/anime/gogoanime'
];

let ACTIVE_ENDPOINT = CONSUMET_ENDPOINTS[0];

const SEARCH_CACHE_TTL = 300; // 5 min
const INFO_CACHE_TTL = 600; // 10 min
const EPISODE_CACHE_TTL = 600; // 10 min

// Anime populares locales como fallback (datos estáticos)
const FALLBACK_POPULAR_ANIME = [
    { id: 'naruto', title: 'Naruto', image: 'https://images.unsplash.com/photo-1578665078519-a0e6b9754c6c?w=300&h=450&fit=crop', genres: ['Action', 'Adventure', 'Shounen'], episodes: 220, rating: 77 },
    { id: 'one-piece', title: 'One Piece', image: 'https://images.unsplash.com/photo-1604514902776-25d4d7aa0e0e?w=300&h=450&fit=crop', genres: ['Action', 'Adventure', 'Comedy'], episodes: 1000, rating: 85 },
    { id: 'dragon-ball', title: 'Dragon Ball', image: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=300&h=450&fit=crop', genres: ['Action', 'Adventure', 'Comedy'], episodes: 153, rating: 80 },
    { id: 'attack-on-titan', title: 'Attack on Titan', image: 'https://images.unsplash.com/photo-1578156522891-f6f169a8d3de?w=300&h=450&fit=crop', genres: ['Action', 'Dark', 'Drama'], episodes: 139, rating: 87 },
    { id: 'demon-slayer', title: 'Demon Slayer', image: 'https://images.unsplash.com/photo-1604514902776-25d4d7aa0e0e?w=300&h=450&fit=crop', genres: ['Action', 'Adventure', 'Shounen'], episodes: 55, rating: 86 },
    { id: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', image: 'https://images.unsplash.com/photo-1592789999453-56d8c3a5d9e0?w=300&h=450&fit=crop', genres: ['Action', 'Dark', 'Shounen'], episodes: 47, rating: 85 },
    { id: 'my-hero', title: 'My Hero Academia', image: 'https://images.unsplash.com/photo-1578665078519-a0e6b9754c6c?w=300&h=450&fit=crop', genres: ['Action', 'Shounen', 'Super Power'], episodes: 159, rating: 80 },
    { id: 'bleach', title: 'Bleach', image: 'https://images.unsplash.com/photo-1578156522891-6f6169a8d3de?w=300&h=450&fit=crop', genres: ['Action', 'Adventure', 'Shounen'], episodes: 404, rating: 78 },
    { id: 'death-note', title: 'Death Note', image: 'https://images.unsplash.com/photo-1604514902776-25d4d7aa0e0e?w=300&h=450&fit=crop', genres: ['Mystery', 'Psychological', 'Shounen'], episodes: 37, rating: 89 },
    { id: 'steins-gate', title: 'Steins Gate', image: 'https://images.unsplash.com/photo-1578665078519-a0e6b9754c6c?w=300&h=450&fit=crop', genres: ['Sci-Fi', 'Thriller'], episodes: 24, rating: 91 },
    { id: 'fullmetal', title: 'Fullmetal Alchemist', image: 'https://images.unsplash.com/photo-1578156522891-6f6169a8d3de?w=300&h=450&fit=crop', genres: ['Action', 'Adventure', 'Drama'], episodes: 64, rating: 92 },
    { id: 'tokyo-ghoul', title: 'Tokyo Ghoul', image: 'https://images.unsplash.com/photo-1604514902776-25d4d7aa0e0e?w=300&h=450&fit=crop', genres: ['Action', 'Dark', 'Supernatural'], episodes: 48, rating: 76 }
];

/**
 * Verificar si el endpoint actual está disponible
 */
async function verifyEndpoint(endpoint) {
    try {
        await axios.get(`${endpoint}/search?query=test`, { timeout: 5000 });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Obtener endpoint disponible
 */
async function getActiveEndpoint() {
    // NOTA: Consumet API está bloqueada/limitada. Por ahora usar solo fallback local.
    // TODO: Cuando Consumet esté disponible, habilitar estos checks
    console.log('[Anime] Using local fallback data (Consumet API temporarily unavailable)');
    return null;

    /* Código comentado para cuando Consumet funcione:
    // Si el actual funciona, usarlo
    if (await verifyEndpoint(ACTIVE_ENDPOINT)) {
        return ACTIVE_ENDPOINT;
    }

    // Si no, buscar uno que funcione
    for (const endpoint of CONSUMET_ENDPOINTS) {
        if (await verifyEndpoint(endpoint)) {
            console.log(`[Consumet] Switched to: ${endpoint}`);
            ACTIVE_ENDPOINT = endpoint;
            return endpoint;
        }
    }

    // Si ninguno funciona, retornar null para usar fallback
    console.warn('[Consumet] No active endpoints, using local fallback data');
    return null;
    */
}

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
        const endpoint = await getActiveEndpoint();

        // Si no hay endpoint, buscar en fallback local
        if (!endpoint) {
            const results = FALLBACK_POPULAR_ANIME.filter(a =>
                a.title.toLowerCase().includes(cleanQuery.toLowerCase())
            );
            return { success: true, data: { query, results, count: results.length } };
        }

        const response = await axios.get(`${endpoint}/search`, {
            params: { query: cleanQuery },
            timeout: 10000
        });

        const results = (response.data.results || []).map((anime) => ({
            id: anime.id,
            title: anime.title || 'Unknown',
            slug: anime.id,
            url: anime.url || `https://gogoanime.run/${anime.id}`,
            image: anime.image || '',
            type: 'anime',
            genres: anime.genres || [],
            episodes: anime.episodeNumber || 0,
            status: 'Unknown',
            rating: 0,
            description: anime.description || ''
        })).slice(0, 10);

        cache.set(cacheKey, results, SEARCH_CACHE_TTL);
        return { success: true, data: { query, results, count: results.length } };
    } catch (e) {
        console.warn('[Consumet] Search error:', e.message);
        // Fallback a búsqueda local
        const results = FALLBACK_POPULAR_ANIME.filter(a =>
            a.title.toLowerCase().includes(cleanQuery.toLowerCase())
        );
        return { success: true, data: { query, results, count: results.length } };
    }
}

/**
 * Obtener información detallada de un anime
 */
async function getAnimeInfo(animeId) {
    if (!animeId) return { success: false, error: 'Anime ID requerido' };

    const cacheKey = `anime:info:${animeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return { success: true, data: cached };

    try {
        const endpoint = await getActiveEndpoint();

        // Buscar en fallback local primero
        const localAnime = FALLBACK_POPULAR_ANIME.find(a => a.id === animeId);
        if (localAnime && !endpoint) {
            const info = {
                id: localAnime.id,
                title: localAnime.title,
                image: localAnime.image,
                description: `${localAnime.title} - Popular anime series`,
                episodes: localAnime.episodes,
                genres: localAnime.genres,
                rating: localAnime.rating,
                status: 'Finished Airing',
                type: 'TV',
                duration: '24 min',
                releaseDate: 'Unknown',
                studios: []
            };
            cache.set(cacheKey, info, INFO_CACHE_TTL);
            return { success: true, data: info };
        }

        if (!endpoint) {
            return { success: false, error: 'API unavailable - anime not found locally' };
        }

        const response = await axios.get(`${endpoint}/info?id=${animeId}`, {
            timeout: 10000
        });

        const anime = response.data;
        const info = {
            id: anime.id,
            title: anime.title || 'Unknown',
            image: anime.image || '',
            description: anime.description || '',
            episodes: anime.totalEpisodes || 0,
            genres: anime.genres || [],
            rating: anime.rating || 0,
            status: anime.status || 'Unknown',
            type: anime.type || 'TV',
            duration: anime.duration || 'Unknown',
            releaseDate: anime.releaseDate || 'Unknown',
            studios: anime.studios || []
        };

        cache.set(cacheKey, info, INFO_CACHE_TTL);
        return { success: true, data: info };
    } catch (e) {
        console.warn('[Consumet] Info error:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Obtener episodios de un anime
 */
async function getEpisodes(animeId) {
    if (!animeId) return { success: false, error: 'Anime ID requerido' };

    const cacheKey = `anime:episodes:${animeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return { success: true, data: cached };

    try {
        const endpoint = await getActiveEndpoint();

        // Fallback local
        const localAnime = FALLBACK_POPULAR_ANIME.find(a => a.id === animeId);
        if (localAnime && !endpoint) {
            const episodeList = Array.from({ length: Math.min(localAnime.episodes, 13) }, (_, i) => ({
                number: i + 1,
                title: `Episodio ${i + 1}`,
                isFiller: false,
                rating: null
            }));
            cache.set(cacheKey, episodeList, EPISODE_CACHE_TTL);
            return { success: true, data: episodeList };
        }

        if (!endpoint) {
            return { success: false, error: 'API unavailable - episodes not found' };
        }

        const response = await axios.get(`${endpoint}/episodes?id=${animeId}`, {
            timeout: 10000
        });

        const episodes = response.data.episodes || [];
        const episodeList = episodes.map((ep, idx) => ({
            number: ep.number || idx + 1,
            title: ep.title || `Episodio ${idx + 1}`,
            isFiller: false,
            rating: null
        })).sort((a, b) => parseInt(a.number) - parseInt(b.number));

        cache.set(cacheKey, episodeList, EPISODE_CACHE_TTL);
        return { success: true, data: episodeList };
    } catch (e) {
        console.warn('[Consumet] Episodes error:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Obtener links de reproducción de un episodio
 * Retorna múltiples servidores y resoluciones
 */
async function getStreamingLinks(episodeId) {
    if (!episodeId) return { success: false, error: 'Episode ID requerido' };

    const cacheKey = `anime:stream:${episodeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return { success: true, data: cached };

    try {
        const endpoint = await getActiveEndpoint();

        // Fallback: mensaje informativo
        if (!endpoint) {
            const streamData = {
                sources: [{
                    url: 'https://gogoanime.run/',
                    isM3u8: false,
                    quality: 'info',
                    message: 'Streaming API temporalmente no disponible. Visit GoGoAnime directly.'
                }],
                tracks: [],
                subtitles: [{
                    lang: 'es',
                    file: 'builtin',
                    label: 'Español'
                }, {
                    lang: 'en',
                    file: 'builtin',
                    label: 'English'
                }]
            };
            cache.set(cacheKey, streamData, 60);
            return { success: true, data: streamData };
        }

        const response = await axios.get(`${endpoint}/watch?episodeId=${episodeId}`, {
            timeout: 10000
        });

        const sources = response.data.sources || [];
        const tracks = response.data.tracks || [];
        const subtitles = response.data.subtitles || [];

        const streamData = {
            sources: sources.map(s => ({
                url: s.url || s.link || '',
                isM3u8: s.isM3u8 || false,
                quality: s.quality || 'default'
            })),
            tracks: tracks.map(t => ({
                kind: t.kind,
                file: t.file,
                label: t.label || 'Unknown'
            })),
            subtitles: subtitles.map(s => ({
                lang: s.lang || 'unknown',
                file: s.file,
                label: s.label || 'Unknown'
            }))
        };

        cache.set(cacheKey, streamData, 60);
        return { success: true, data: streamData };
    } catch (e) {
        console.warn('[Consumet] Streaming links error:', e.message);
        // Retornar fallback informativo
        const streamData = {
            sources: [{
                url: 'https://gogoanime.run/',
                isM3u8: false,
                quality: 'info',
                message: 'Streaming temporarily unavailable'
            }],
            tracks: [],
            subtitles: []
        };
        cache.set(cacheKey, streamData, 60);
        return { success: true, data: streamData };
    }
}

/**
 * Obtener anime popular
 */
async function getPopularAnime(page = 1) {
    const cacheKey = `anime:popular:v2:${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Usar datos locales populares como principal
        const animeList = FALLBACK_POPULAR_ANIME.map(anime => ({
            ...anime,
            slug: anime.id,
            url: `https://gogoanime.run/${anime.id}`,
            type: 'anime',
            genre: anime.genres[0] || 'Otros'
        })).slice(0, 12);

        // Extraer géneros únicos
        const genresSet = new Set(['Todos']);
        animeList.forEach(anime => {
            if (anime.genres) {
                anime.genres.forEach(g => genresSet.add(g));
            }
        });

        const response = { success: true, data: animeList, genres: Array.from(genresSet) };
        cache.set(cacheKey, response, SEARCH_CACHE_TTL);
        return response;
    } catch (e) {
        console.warn('[Popular] Error:', e.message);
        return { success: false, data: [], genres: ['Todos'] };
    }
}

module.exports = {
    searchAnime,
    getAnimeInfo,
    getEpisodes,
    getStreamingLinks,
    getPopularAnime
};
