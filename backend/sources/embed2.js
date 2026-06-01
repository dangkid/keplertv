// ===== FUENTE: 2Embed =====
// NOTA: No verificamos URLs desde el backend porque Cloudflare/anti-bot
// bloquea todas las peticiones no-browser. Marcamos como alive: true
// y el frontend maneja errores de iframe con "Abrir en Pestaña Nueva".

const SERVERS = [
    {
        name: '2Embed.cc',
        icon: '🔗',
        badge: 'FHD',
        badgeColor: '#7b5bf5',
        buildUrl: (type, id, season, episode) => {
            // Parámetro ?lang=es para priorizar audio español
            return `https://www.2embed.cc/embed/${id}?lang=es`;
        }
    },
    {
        name: '2Embed.to',
        icon: '🔗',
        badge: 'FHD',
        badgeColor: '#7b5bf5',
        buildUrl: (type, id, season, episode) => {
            return `https://www.2embed.to/embed/tmdb/${id}?lang=es`;
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
            source: '2embed'
        });
    }

    return results;
}

module.exports = { getStreams, SERVERS };
