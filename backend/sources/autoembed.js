// ===== FUENTE: AutoEmbed =====
// NOTA: No verificamos URLs desde el backend porque Cloudflare/anti-bot
// bloquea todas las peticiones no-browser. Marcamos como alive: true
// y el frontend maneja errores de iframe con "Abrir en Pestaña Nueva".

const SERVERS = [
    {
        name: 'AutoEmbed',
        icon: '🔄',
        badge: 'HD',
        badgeColor: '#fdcb6e',
        buildUrl: (type, id, season, episode) => {
            if (type === 'tv') return `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}?lang=es`;
            return `https://player.autoembed.cc/embed/movie/${id}?lang=es`;
        }
    }
];

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
            source: 'autoembed'
        });
    }

    return results;
}

module.exports = { getStreams, SERVERS };
