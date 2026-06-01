// ===== SERVICIO DE ANIME =====
// Fuente: AnimeAV1 (animeav1.com) - scraping con cheerio
// Basado en el patrón de anime1v-api (FxxMorgan)
// Cache TTL: 5 minutos para búsquedas, 10 minutos para info

const axios = require('axios');
const cheerio = require('cheerio');
const { cache } = require('../utils/cache');

const DEFAULT_DOMAIN = 'animeav1.com';
const SEARCH_CACHE_TTL = 300; // 5 min
const INFO_CACHE_TTL = 600; // 10 min

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
};

/**
 * Extraer datos JSON embebidos de SvelteKit (__data.json)
 */
function extractSvelteData(html) {
    // Buscar script con data-sveltekit
    const $ = cheerio.load(html);
    const scripts = $('script[data-sveltekit]').first().text();
    if (scripts) {
        try {
            // Intentar extraer JSON de Svelte
            const match = scripts.match(/\{.*\}/s);
            if (match) return JSON.parse(match[0]);
        } catch { }
    }
    return null;
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
        const searchUrl = `https://${DEFAULT_DOMAIN}/catalogo?q=${encodeURIComponent(cleanQuery)}`;
        const response = await axios.get(searchUrl, {
            timeout: 10000,
            headers: HTTP_HEADERS,
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const results = [];

        // Buscar enlaces a /media/ (formato AnimeAV1)
        $('a[href^="/media/"]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href || !/^\/media\/[^/]+$/.test(href)) return;

            const card = $(el).closest('article').length ? $(el).closest('article') : $(el);
            const title = $(card).find('h3, h2, [title]').first().text().trim()
                || $(card).find('img').first().attr('alt')
                || $(el).attr('title')
                || null;

            if (!title) return;

            const slug = href.replace(/^\/media\//, '').trim();
            const imgEl = $(card).find('img').first();
            let image = imgEl.attr('src') || '';
            if (image && !image.startsWith('http')) {
                image = `https://${DEFAULT_DOMAIN}${image.startsWith('/') ? '' : '/'}${image}`;
            }

            // Evitar duplicados
            if (!results.some(r => r.slug === slug)) {
                results.push({
                    id: slug,
                    title,
                    slug,
                    url: `https://${DEFAULT_DOMAIN}${href}`,
                    image,
                    type: 'anime',
                });
            }
        });

        // Si no hay resultados por HTML, intentar con Svelte data
        if (results.length === 0) {
            const svelteData = extractSvelteData(html);
            if (svelteData) {
                // Buscar arrays de objetos con title/name
                const findAnimeArray = (obj, depth = 0) => {
                    if (depth > 5) return null;
                    if (Array.isArray(obj)) {
                        const items = obj.filter(i =>
                            i && typeof i === 'object' &&
                            (i.title || i.name) &&
                            (i.slug || i.url || i.id)
                        );
                        if (items.length > 0) return items;
                    }
                    if (obj && typeof obj === 'object') {
                        for (const val of Object.values(obj)) {
                            const found = findAnimeArray(val, depth + 1);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const animeArray = findAnimeArray(svelteData);
                if (animeArray) {
                    animeArray.forEach(item => {
                        const slug = item.slug || (item.url ? item.url.split('/').pop() : item.id) || '';
                        results.push({
                            id: slug,
                            title: item.title || item.name || 'Sin título',
                            slug,
                            url: item.url || `https://${DEFAULT_DOMAIN}/media/${slug}`,
                            image: item.image || item.poster || item.thumbnail || '',
                            type: 'anime',
                        });
                    });
                }
            }
        }

        cache.set(cacheKey, results, SEARCH_CACHE_TTL);
        return { success: true, data: { query, results, count: results.length } };
    } catch (error) {
        console.warn('Error searching anime:', error.message);
        return { success: true, data: { query, results: [], count: 0 }, error: error.message };
    }
}

/**
 * Obtener información detallada de un anime
 */
async function getAnimeInfo(url) {
    if (!url) return { success: false, error: 'URL requerida' };

    const cacheKey = `anime:info:${url}`;
    const cached = cache.get(cacheKey);
    if (cached) return { success: true, data: cached };

    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: HTTP_HEADERS,
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Extraer título
        const title = $('h1').first().text().trim()
            || $('meta[property="og:title"]').attr('content')
            || '';

        // Extraer descripción
        const description = $('meta[property="og:description"]').attr('content')
            || $('meta[name="description"]').attr('content')
            || $('p.description, .description p').first().text().trim()
            || '';

        // Extraer imagen
        let image = $('meta[property="og:image"]').attr('content')
            || $('meta[name="twitter:image"]').attr('content')
            || '';
        if (image && !image.startsWith('http')) {
            image = `https://${DEFAULT_DOMAIN}${image.startsWith('/') ? '' : '/'}${image}`;
        }

        // Extraer episodios
        const episodes = [];
        $('a[href*="/ver/"], a[href*="/episode/"]').each((_, el) => {
            const href = $(el).attr('href');
            const epTitle = $(el).text().trim() || $(el).find('span').first().text().trim();
            if (href && epTitle) {
                const epUrl = href.startsWith('http') ? href : `https://${DEFAULT_DOMAIN}${href}`;
                const epNum = epTitle.match(/\d+/)?.[0] || episodes.length + 1;
                episodes.push({
                    number: parseInt(epNum),
                    title: epTitle,
                    url: epUrl,
                });
            }
        });

        // También buscar en datos Svelte
        if (episodes.length === 0) {
            const svelteData = extractSvelteData(html);
            if (svelteData) {
                const findEpisodes = (obj, depth = 0) => {
                    if (depth > 5) return null;
                    if (Array.isArray(obj)) {
                        const eps = obj.filter(i =>
                            i && typeof i === 'object' &&
                            (i.episode || i.number || i.episode_number) &&
                            (i.url || i.link)
                        );
                        if (eps.length > 0) return eps;
                    }
                    if (obj && typeof obj === 'object') {
                        for (const val of Object.values(obj)) {
                            const found = findEpisodes(val, depth + 1);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const epArray = findEpisodes(svelteData);
                if (epArray) {
                    epArray.forEach(ep => {
                        episodes.push({
                            number: ep.episode || ep.number || ep.episode_number || episodes.length + 1,
                            title: ep.title || `Episodio ${ep.episode || ep.number || episodes.length + 1}`,
                            url: ep.url || ep.link || '',
                        });
                    });
                }
            }
        }

        // Ordenar episodios por número
        episodes.sort((a, b) => a.number - b.number);

        const info = {
            title,
            description,
            image,
            url,
            episodes,
            episodeCount: episodes.length,
        };

        cache.set(cacheKey, info, INFO_CACHE_TTL);
        return { success: true, data: info };
    } catch (error) {
        console.warn('Error fetching anime info:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener enlaces de un episodio específico
 */
async function getEpisodeLinks(url) {
    if (!url) return { success: false, error: 'URL requerida' };

    const cacheKey = `anime:episode:${url}`;
    const cached = cache.get(cacheKey);
    if (cached) return { success: true, data: cached };

    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: HTTP_HEADERS,
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Extraer iframes/video sources
        const servers = [];

        $('iframe').each((_, el) => {
            const src = $(el).attr('src');
            if (src && src.startsWith('http')) {
                servers.push({
                    server: 'iframe',
                    url: src,
                    type: 'embed',
                });
            }
        });

        $('video source[src], source[src]').each((_, el) => {
            const src = $(el).attr('src');
            const type = $(el).attr('type') || '';
            if (src) {
                servers.push({
                    server: type.includes('m3u8') || type.includes('hls') || src.includes('.m3u8') ? 'HLS' : 'Video',
                    url: src,
                    type: type.includes('m3u8') || type.includes('hls') || src.includes('.m3u8') ? 'hls' : 'direct',
                });
            }
        });

        // Buscar en datos Svelte también
        if (servers.length === 0) {
            const svelteData = extractSvelteData(html);
            if (svelteData) {
                const findVideoUrls = (obj, depth = 0) => {
                    if (depth > 5) return [];
                    const found = [];
                    if (obj && typeof obj === 'object') {
                        for (const [key, val] of Object.entries(obj)) {
                            if (typeof val === 'string' &&
                                (val.startsWith('http') && (val.includes('.m3u8') || val.includes('.mp4') || val.includes('video')))) {
                                found.push({ server: key, url: val, type: val.includes('.m3u8') ? 'hls' : 'direct' });
                            }
                            if (typeof val === 'object') {
                                found.push(...findVideoUrls(val, depth + 1));
                            }
                        }
                    }
                    return found;
                };

                const videoUrls = findVideoUrls(svelteData);
                videoUrls.forEach(v => {
                    if (!servers.some(s => s.url === v.url)) {
                        servers.push(v);
                    }
                });
            }
        }

        const result = {
            servers,
            count: servers.length,
        };

        cache.set(cacheKey, result, INFO_CACHE_TTL);
        return { success: true, data: result };
    } catch (error) {
        console.warn('Error fetching episode links:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    searchAnime,
    getAnimeInfo,
    getEpisodeLinks,
};
