// ===== FUENTE: verhdlink.cam (Películas en Español vía IMDB ID) =====
// Misma tecnología que usa repelishd.ceo
// Usa el IMDB ID como identificador universal para buscar la película
// Ofrece múltiples mirrors: MixDrop, DoodStream, dropload, Server 4K

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://verhdlink.cam';

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://repelishd.ceo/',
    'Origin': 'https://repelishd.ceo'
};

/**
 * Extraer el IMDB ID de un TMDB ID
 * @param {number|string} tmdbId - ID de TMDB
 * @param {string} type - 'movie' o 'tv'
 * @returns {Promise<string|null>} - IMDB ID o null
 */
async function getImdbId(tmdbId, type = 'movie') {
    try {
        const endpoint = type === 'tv' ? 'tv' : 'movie';
        const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}/${tmdbId}`, {
            params: {
                api_key: process.env.TMDB_API_KEY || 'fb1b0f6c03e9f5b9c9c9c9c9c9c9c9c9',
                language: 'es'
            },
            timeout: 5000,
            headers: { 'User-Agent': 'KeplerTV/1.0' }
        });
        return response.data.imdb_id || null;
    } catch (e) {
        // Si no tenemos TMDB key o falla, intentamos con el ID directamente
        // Algunas películas en verhdlink también aceptan TMDB ID
        return null;
    }
}

/**
 * Obtener streams de verhdlink.cam para una película
 * @param {string} imdbId - IMDB ID (ej: tt0111161)
 * @returns {Promise<Array>} - Array de servidores disponibles
 */
async function getMovieStreams(imdbId) {
    try {
        const url = `${BASE_URL}/movie/${imdbId}`;
        const response = await axios.get(url, {
            headers: HTTP_HEADERS,
            timeout: 10000
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const servers = [];

        // Extraer todos los mirrors del player
        $('ul._player-mirrors li, ul._player-mirrors div[data-link]').each((i, el) => {
            const $el = $(el);
            const link = $el.attr('data-link');
            const name = $el.text().trim();

            if (link && link.length > 0) {
                let fullUrl = link;
                if (!link.startsWith('http')) {
                    fullUrl = 'https:' + link;
                }

                // Determinar calidad por el nombre
                let quality = 'HD';
                if (name.includes('4K') || name.includes('fullhd') || $el.hasClass('fullhd')) {
                    quality = 'FHD';
                }

                servers.push({
                    name: name || `Server ${i + 1}`,
                    url: fullUrl,
                    type: 'iframe',
                    quality: quality,
                    alive: true,
                    lang: 'es',
                    source: 'verhdlink'
                });
            }
        });

        // También buscar en los mirrors ocultos
        $('._hidden-mirrors li').each((i, el) => {
            const $el = $(el);
            const link = $el.attr('data-link');
            const name = $el.text().trim();

            if (link && link.length > 0) {
                let fullUrl = link;
                if (!link.startsWith('http')) {
                    fullUrl = 'https:' + link;
                }

                servers.push({
                    name: name || `Server oculto ${i + 1}`,
                    url: fullUrl,
                    type: 'iframe',
                    quality: 'HD',
                    alive: true,
                    lang: 'es',
                    source: 'verhdlink'
                });
            }
        });

        // Si no se encontraron servidores, devolver el iframe directo como fallback
        if (servers.length === 0) {
            servers.push({
                name: 'VerHDLink',
                url: `${BASE_URL}/movie/${imdbId}`,
                type: 'iframe',
                quality: 'HD',
                alive: true,
                lang: 'es',
                source: 'verhdlink'
            });
        }

        return servers;
    } catch (error) {
        console.error(`Error en verhdlink (${imdbId}):`, error.message);
        // Fallback: devolver el iframe directo
        return [{
            name: 'VerHDLink',
            url: `${BASE_URL}/movie/${imdbId}`,
            type: 'iframe',
            quality: 'HD',
            alive: true,
            lang: 'es',
            source: 'verhdlink'
        }];
    }
}

/**
 * Obtener streams para una serie (no implementado para esta fuente)
 */
async function getTVStreams(imdbId, season, episode) {
    try {
        // verhdlink también soporta series con el mismo formato
        const servers = await getMovieStreams(imdbId);
        return servers;
    } catch (error) {
        return [];
    }
}

/**
 * Interfaz unificada para el orquestador
 */
async function getStreams(type, id, season = 1, episode = 1) {
    try {
        // Intentar obtener IMDB ID
        let imdbId = id;

        // Si el ID no parece IMDB (no empieza con 'tt'), intentar convertirlo
        if (!String(id).startsWith('tt')) {
            const resolved = await getImdbId(id, type);
            if (resolved) {
                imdbId = resolved;
            }
        }

        if (type === 'movie') {
            return await getMovieStreams(imdbId);
        } else {
            return await getTVStreams(imdbId, season, episode);
        }
    } catch (error) {
        console.error(`Error en verhdlink.getStreams:`, error.message);
        return [];
    }
}

module.exports = { getStreams, getMovieStreams, getTVStreams };
