// ===== ORQUESTADOR DE FUENTES DE STREAMING =====
// Fuentes en español que realmente funcionan:
// - verhdlink.cam (películas vía IMDB - como repelishd.ceo)
// - latamvidz1.com (canales deportivos - como futbol-libre.su)
// - nupload.me (películas - como pelisflix200.skin)
// - pelisflix200.skin (scraper directo - extrae URLs de nupload.me)
//
// Las fuentes en inglés (VidSrc, 2Embed, AutoEmbed, MultiEmbed) han sido eliminadas
// porque no funcionaban correctamente y estaban en inglés.

const verhdlink = require('./verhdlink');
const latamvidz = require('./latamvidz');
const nupload = require('./nupload');
const pelisflix = require('../services/pelisflix');
const tmdb = require('../services/tmdb');
const { cache } = require('../utils/cache');

const STREAM_CACHE_TTL = 1800000; // 30 min

/**
 * Obtener streams para una película
 * @param {number|string} id - TMDB ID
 * @returns {Promise<Array>} - Array de servidores disponibles
 */
async function getMovieStreams(id) {
    const cacheKey = `stream:movie:${id}`;

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Ejecutar fuentes de películas en paralelo
        const [verhdlinkStreams, pelisflixStreams] = await Promise.allSettled([
            verhdlink.getStreams('movie', id),
            (async () => {
                // Obtener título de la película para buscar en pelisflix
                try {
                    const details = await tmdb.getMovieDetails(id);
                    const title = details.title || details.original_title;
                    if (!title) return [];
                    
                    const results = await pelisflix.searchMovie(title);
                    if (results.length === 0) return [];
                    
                    // Usar el primer resultado
                    const servers = await pelisflix.getMovieServers(results[0].url);
                    return servers.map(s => ({
                        ...s,
                        alive: true,
                        source: 'pelisflix'
                    }));
                } catch (e) {
                    return [];
                }
            })()
        ]);

        // Combinar resultados
        let allStreams = [];

        if (verhdlinkStreams.status === 'fulfilled') allStreams = allStreams.concat(verhdlinkStreams.value);
        if (pelisflixStreams.status === 'fulfilled') allStreams = allStreams.concat(pelisflixStreams.value);

        // Ordenar por calidad (FHD primero, luego HD, etc.)
        const qualityOrder = { FHD: 0, HD: 1, SD: 2 };
        allStreams.sort((a, b) => {
            return (qualityOrder[a.quality] || 99) - (qualityOrder[b.quality] || 99);
        });

        // Cachear resultado
        cache.set(cacheKey, allStreams, STREAM_CACHE_TTL);

        return allStreams;
    } catch (error) {
        console.error('Error en orquestador de streams:', error.message);
        return [];
    }
}

/**
 * Obtener streams para un episodio de serie
 * @param {number|string} id - TMDB ID de la serie
 * @param {number} season - Número de temporada
 * @param {number} episode - Número de episodio
 * @returns {Promise<Array>} - Array de servidores disponibles
 */
async function getTVStreams(id, season = 1, episode = 1) {
    const cacheKey = `stream:tv:${id}:${season}:${episode}`;

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const [verhdlinkStreams] = await Promise.allSettled([
            verhdlink.getStreams('tv', id, season, episode)
        ]);

        let allStreams = [];

        if (verhdlinkStreams.status === 'fulfilled') allStreams = allStreams.concat(verhdlinkStreams.value);

        const qualityOrder = { FHD: 0, HD: 1, SD: 2 };
        allStreams.sort((a, b) => {
            return (qualityOrder[a.quality] || 99) - (qualityOrder[b.quality] || 99);
        });

        cache.set(cacheKey, allStreams, STREAM_CACHE_TTL);

        return allStreams;
    } catch (error) {
        console.error('Error en orquestador de streams TV:', error.message);
        return [];
    }
}

module.exports = { getMovieStreams, getTVStreams };
