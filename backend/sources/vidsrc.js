// ===== FUENTE: VidSrc (múltiples dominios) =====
const axios = require('axios');
const { withTimeout } = require('../utils/helpers');

const SERVERS = [
    {
        name: 'VidSrc.to',
        icon: '🎬',
        badge: 'FHD',
        badgeColor: '#00cec9',
        buildUrl: (type, id, season, episode) => {
            // Parámetro ?lang=es para priorizar audio español
            if (type === 'tv') return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}?lang=es`;
            return `https://vidsrc.to/embed/movie/${id}?lang=es`;
        }
    },
    {
        name: 'VidSrc.xyz',
        icon: '🇪🇸',
        badge: 'FHD',
        badgeColor: '#7b5bf5',
        buildUrl: (type, id, season, episode) => {
            if (type === 'tv') return `https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}?lang=es`;
            return `https://vidsrc.xyz/embed/movie/${id}?lang=es`;
        }
    },
    {
        name: 'VidSrc.cc',
        icon: '🌐',
        badge: 'HD',
        badgeColor: '#78788e',
        buildUrl: (type, id, season, episode) => {
            if (type === 'tv') return `https://vidsrc.cc/vidsrc/tv/${id}/${season}/${episode}?lang=es`;
            return `https://vidsrc.cc/vidsrc/movie/${id}?lang=es`;
        }
    },
    {
        name: 'VidSrc.nl',
        icon: '📡',
        badge: 'FHD',
        badgeColor: '#e84393',
        buildUrl: (type, id, season, episode) => {
            if (type === 'tv') return `https://player.vidsrc.nl/embed/tv/${id}/${season}/${episode}?lang=es`;
            return `https://player.vidsrc.nl/embed/movie/${id}?lang=es`;
        }
    }
];

/**
 * Obtener streams de VidSrc para una película o serie
 * NOTA: Los servidores embed (VidSrc, 2Embed, etc.) usan Cloudflare/anti-bot
 * y NO se pueden verificar desde el backend. Se marcan todos como disponibles
 * y el frontend los intenta cargar en iframe.
 */
async function getStreams(type, id, season = 1, episode = 1) {
    const results = [];

    for (const server of SERVERS) {
        const url = server.buildUrl(type, id, season, episode);

        results.push({
            server: server.name,
            icon: server.icon,
            url,
            quality: server.badge,
            badge: server.badge,
            badgeColor: server.badgeColor,
            lang: type === 'tv' ? '🇪🇸 Audio ESP / Subt.' : '🇪🇸 Audio Latino',
            type: 'embed',
            alive: true, // Siempre true - el frontend maneja errores de iframe
            source: 'vidsrc'
        });
    }

    return results;
}

module.exports = { getStreams, SERVERS };
