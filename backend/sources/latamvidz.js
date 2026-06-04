// ===== FUENTE: futbol-libre.su (Canales Deportivos en Español) =====
// Usa futbol-libre.su como intermediario porque latamvidz1.com está
// bloqueado por Cloudflare en España (HTTP 410).
// futbol-libre.su tiene páginas para cada canal que internamente
// cargan el iframe de latamvidz1.com, y como su dominio está
// whitelisted por Cloudflare, funciona sin VPN.

const axios = require('axios');

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://futbol-libre.su/',
    'Origin': 'https://futbol-libre.su'
};

// Canales deportivos disponibles vía futbol-libre.su
// Cada canal tiene su propia página en futbol-libre.su que internamente
// carga el iframe de latamvidz1.com
const SPORTS_CHANNELS = [
    // SOLO CANALES QUE REALMENTE EXISTEN EN FUTBOL-LIBRE.SU
    // (Verificado: los demás devuelven HTTP 404)
    { id: 'espn', name: 'ESPN 1', logo: 'https://cdn.futbol-libre.su/img/espn1.webp', country: 'Latinoamérica', page: '/espn-1/' },
    { id: 'dsports', name: 'DirectTV Sports', logo: 'https://cdn.futbol-libre.su/img/dsports.webp', country: 'Latinoamérica', page: '/directv-sports/' },
    { id: 'tycsports', name: 'TyC Sports', logo: 'https://cdn.futbol-libre.su/img/tyc_sports.webp', country: 'Argentina', page: '/tyc-sports/' },
    { id: 'winplus', name: 'Win Sports+', logo: 'https://cdn.futbol-libre.su/img/win_sports_plus.webp', country: 'Colombia', page: '/win-sports-premium/' },
    { id: 'foxsports', name: 'Fox Sports', logo: 'https://cdn.futbol-libre.su/img/fox_sports.webp', country: 'Latinoamérica', page: '/fox-sports/' },
    { id: 'tudn_usa', name: 'TUDN USA', logo: 'https://cdn.futbol-libre.su/img/tudn.webp', country: 'EE.UU.', page: '/tudn/' },
    { id: 'espnpremium', name: 'ESPN Premium', logo: 'https://cdn.futbol-libre.su/img/espn_premium.webp', country: 'Latinoamérica', page: '/espn-premium/' },
    { id: 'tntsports', name: 'TNT Sports', logo: 'https://cdn.futbol-libre.su/img/tnt_sport.webp', country: 'Latinoamérica', page: '/tnt-sports/' }
];

const BASE_URL = 'https://futbol-libre.su';

/**
 * Obtener streams para un canal deportivo
 * @param {string} channelId - ID del canal (ej: 'espn', 'tycsports')
 * @returns {Promise<Array>} - Array con el servidor disponible
 */
async function getChannelStream(channelId) {
    try {
        const channel = SPORTS_CHANNELS.find(c => c.id === channelId);
        if (!channel) return [];

        // La URL del iframe apunta al endpoint del backend que scrapea
        // futbol-libre.su y devuelve SOLO el reproductor limpio
        const futbolLibreUrl = `${BASE_URL}${channel.page}`;
        const iframeUrl = `/api/channel-player?url=${encodeURIComponent(futbolLibreUrl)}`;

        return [{
            name: `📺 ${channel.name}`,
            url: iframeUrl,
            type: 'iframe',
            quality: 'FHD',
            alive: true,
            lang: 'es',
            source: 'latamvidz',
            channelId: channelId,
            logo: channel.logo,
            country: channel.country
        }];
    } catch (error) {
        console.error(`Error en latamvidz (${channelId}):`, error.message);
        return [];
    }
}

/**
 * Obtener todos los canales deportivos disponibles
 * @returns {Promise<Array>} - Array de todos los canales
 */
async function getAllChannels() {
    return SPORTS_CHANNELS.map(channel => ({
        id: `latamvidz_${channel.id}`,
        name: channel.name,
        logo: channel.logo,
        genre: 'Deportes',
        country: channel.country,
        url: `/api/channel-player?url=${encodeURIComponent(`${BASE_URL}${channel.page}`)}`,
        category: 'TV',
        source: 'latamvidz'
    }));
}

/**
 * Obtener streams para películas (no aplica para esta fuente)
 */
async function getStreams(type, id, season, episode) {
    // Esta fuente solo es para canales de TV en vivo
    return [];
}

module.exports = { getChannelStream, getAllChannels, getStreams, SPORTS_CHANNELS };
