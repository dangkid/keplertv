// ===== FUENTE: nupload.me (Películas en Español) =====
// Misma tecnología que usa pelisflix200.skin
// Los enlaces de video están ofuscados en Base64 en el HTML
// nupload.me redirige a latlat.xyz u otros servicios de video

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://nupload.me';

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://pelisflix200.skin/',
    'Origin': 'https://pelisflix200.skin'
};

/**
 * Obtener streams desde nupload.me
 * @param {string} videoId - ID del video en nupload.me
 * @returns {Promise<Array>} - Array de servidores disponibles
 */
async function getStreamsFromNupload(videoId) {
    try {
        // Intentar con el watch URL
        const watchUrl = `${BASE_URL}/watch/${videoId}`;
        const response = await axios.get(watchUrl, {
            headers: HTTP_HEADERS,
            timeout: 10000
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const servers = [];

        // Buscar iframes en la página
        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.length > 0) {
                let fullUrl = src;
                if (!src.startsWith('http')) {
                    fullUrl = 'https:' + src;
                }
                servers.push({
                    name: `Nuupload ${i + 1}`,
                    url: fullUrl,
                    type: 'iframe',
                    quality: 'HD',
                    alive: true,
                    lang: 'es',
                    source: 'nupload'
                });
            }
        });

        // También probar con el iframe endpoint
        const iframeUrl = `${BASE_URL}/iframe/?url=${encodeURIComponent(watchUrl)}`;
        servers.push({
            name: 'Nuupload Iframe',
            url: iframeUrl,
            type: 'iframe',
            quality: 'HD',
            alive: true,
            lang: 'es',
            source: 'nupload'
        });

        return servers;
    } catch (error) {
        console.error(`Error en nupload (${videoId}):`, error.message);
        return [];
    }
}

/**
 * Interfaz unificada para el orquestador
 * Nota: nupload requiere IDs específicos, no TMDB IDs.
 * Esta fuente funciona mejor como respaldo cuando tenemos URLs directas.
 */
async function getStreams(type, id, season = 1, episode = 1) {
    // nupload no funciona con TMDB IDs directamente
    // Solo devolvemos un placeholder para que el frontend pueda usarlo
    return [];
}

module.exports = { getStreams, getStreamsFromNupload };
