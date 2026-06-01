// ===== FUENTE: MultiEmbed =====
// NOTA: No verificamos URLs desde el backend porque Cloudflare/anti-bot
// bloquea todas las peticiones no-browser. Marcamos como alive: true
// y el frontend maneja errores de iframe con "Abrir en Pestaña Nueva".

const SERVERS = [
    {
        name: 'MultiEmbed',
        icon: '🎯',
        badge: 'HD',
        badgeColor: '#e84393',
        buildUrl: (type, id, season, episode) => {
            // &lang=es para priorizar audio español
            return `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&lang=es`;
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
            source: 'multiembed'
        });
    }

    return results;
}

module.exports = { getStreams, SERVERS };
