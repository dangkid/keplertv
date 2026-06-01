// ===== SERVICIO: PELISFLIX (Scraper) =====
// Scrapea pelisflix200.skin para obtener URLs de nupload.me
// que funcionan desde España a través del proxy embed-proxy
const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://pelisflix200.skin';
const TIMEOUT = 25000;

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Referer': BASE + '/'
};

/**
 * Busca una película en pelisflix por título
 */
async function searchMovie(query) {
    try {
        const url = `${BASE}/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { timeout: TIMEOUT, headers: HTTP_HEADERS });
        const $ = cheerio.load(data);
        const results = [];

        $('article, .TPost, .item, .post, .movie-item, [class*="post"]').each((i, el) => {
            const link = $(el).find('a').first().attr('href');
            const title = $(el).find('.Title, h2, h3, .title, [class*="title"]').first().text().trim();
            const img = $(el).find('img').first().attr('src') || '';
            if (link && link.includes('/pelicula/') && title) {
                results.push({ title, url: link.startsWith('http') ? link : BASE + link, img });
            }
        });

        return results;
    } catch (e) {
        console.error('[PelisFlix] Error searching:', e.message);
        return [];
    }
}

/**
 * Obtiene las URLs de video desde la página de una película
 * Extrae los data-url (base64) que contienen URLs de nupload.me
 */
async function getMovieServers(pelisflixUrl) {
    try {
        const { data } = await axios.get(pelisflixUrl, { timeout: TIMEOUT, headers: HTTP_HEADERS });
        const $ = cheerio.load(data);
        const servers = [];

        // Buscar todos los elementos con data-url (base64 encoded)
        $('[data-url]').each((i, el) => {
            const encoded = $(el).attr('data-url');
            if (!encoded) return;

            try {
                const decoded = Buffer.from(encoded, 'base64').toString('utf8');
                if (decoded.includes('nupload.me') || decoded.includes('nupload')) {
                    servers.push({
                        name: `Nupload ${servers.filter(s => s.name.includes('Nupload')).length + 1}`,
                        url: decoded,
                        type: 'iframe',
                        quality: 'HD',
                        lang: 'es'
                    });
                }
            } catch (e) {
                // Not valid base64, skip
            }
        });

        // También buscar iframes directos
        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if (src && (src.includes('nupload.me') || src.includes('nupload'))) {
                // Avoid duplicates
                if (!servers.find(s => s.url === src)) {
                    servers.push({
                        name: `Nupload ${servers.filter(s => s.name.includes('Nupload')).length + 1}`,
                        url: src,
                        type: 'iframe',
                        quality: 'HD',
                        lang: 'es'
                    });
                }
            }
        });

        // También buscar enlaces directos a nupload
        $('a[href*="nupload"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !servers.find(s => s.url === href)) {
                servers.push({
                    name: `Nupload ${servers.filter(s => s.name.includes('Nupload')).length + 1}`,
                    url: href,
                    type: 'iframe',
                    quality: 'HD',
                    lang: 'es'
                });
            }
        });

        return servers;
    } catch (e) {
        console.error('[PelisFlix] Error getting servers:', e.message);
        return [];
    }
}

/**
 * Obtiene las URLs de video para una serie desde pelisflix
 */
async function getTVServers(pelisflixUrl, season, episode) {
    try {
        const { data } = await axios.get(pelisflixUrl, { timeout: TIMEOUT, headers: HTTP_HEADERS });
        const $ = cheerio.load(data);
        const servers = [];

        // Buscar data-url en la página de la serie
        $('[data-url]').each((i, el) => {
            const encoded = $(el).attr('data-url');
            if (!encoded) return;

            try {
                const decoded = Buffer.from(encoded, 'base64').toString('utf8');
                if (decoded.includes('nupload.me') || decoded.includes('nupload')) {
                    servers.push({
                        name: `Nupload ${servers.filter(s => s.name.includes('Nupload')).length + 1}`,
                        url: decoded,
                        type: 'iframe',
                        quality: 'HD',
                        lang: 'es'
                    });
                }
            } catch (e) {}
        });

        return servers;
    } catch (e) {
        console.error('[PelisFlix] Error getting TV servers:', e.message);
        return [];
    }
}

module.exports = { searchMovie, getMovieServers, getTVServers };
