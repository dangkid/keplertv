// ===== CANALES FIJOS VERIFICADOS (SOLO LOS QUE FUNCIONAN) =====
// Organizados por país y género para fácil navegación
// Los canales deportivos usan futbol-libre.su como intermediario
// porque latamvidz1.com está bloqueado por Cloudflare en España.
// futbol-libre.su carga internamente el iframe de latamvidz1.com
// y su dominio está whitelisted, por lo que funciona sin VPN.

const RELIABLE_CHANNELS = [
    // ==================== DEPORTES (vía futbol-libre.su → reproductor limpio) ====================
    { id: 'latamvidz_espn', name: 'ESPN 1', logo: 'https://cdn.futbol-libre.su/img/espn1.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fespn-1%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_espn2', name: 'ESPN 2', logo: 'https://cdn.futbol-libre.su/img/espn2.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fespn-2%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_espn3', name: 'ESPN 3', logo: 'https://cdn.futbol-libre.su/img/espn3.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fespn-3%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_dsports', name: 'DirectTV Sports', logo: 'https://cdn.futbol-libre.su/img/dsports.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fdirectv-sports%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_tycsports', name: 'TyC Sports', logo: 'https://cdn.futbol-libre.su/img/tyc_sports.webp', genre: 'Deportes', country: 'Argentina', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ftyc-sports%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_winplus', name: 'Win Sports+', logo: 'https://cdn.futbol-libre.su/img/win_sports_plus.webp', genre: 'Deportes', country: 'Colombia', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fwin-sports-premium%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_foxsports', name: 'Fox Sports', logo: 'https://cdn.futbol-libre.su/img/fox_sports.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ffox-sports%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_foxsports2', name: 'Fox Sports 2', logo: 'https://cdn.futbol-libre.su/img/fox_sports_2.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ffox-sports-2%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_foxsports3', name: 'Fox Sports 3', logo: 'https://cdn.futbol-libre.su/img/fox_sports_3.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ffox-sports-3%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_tudn', name: 'TUDN USA', logo: 'https://cdn.futbol-libre.su/img/tudn.webp', genre: 'Deportes', country: 'EE.UU.', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ftudn%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_espnpremium', name: 'ESPN Premium', logo: 'https://cdn.futbol-libre.su/img/espn_premium.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fespn-premium%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_tntsports', name: 'TNT Sports', logo: 'https://cdn.futbol-libre.su/img/tnt_sport.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ftnt-sports%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_azteca7', name: 'Azteca 7', logo: 'https://cdn.futbol-libre.su/img/azteca_7.webp', genre: 'Deportes', country: 'México', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fazteca-7%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_canal5', name: 'Canal 5', logo: 'https://cdn.futbol-libre.su/img/canal_5.webp', genre: 'Deportes', country: 'México', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fcanal-5%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_imagentv', name: 'Imagen TV', logo: 'https://cdn.futbol-libre.su/img/imagen_tv.webp', genre: 'Deportes', country: 'México', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fimagen-tv%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_multimedios', name: 'Multimedios', logo: 'https://cdn.futbol-libre.su/img/multimedios.webp', genre: 'Deportes', country: 'México', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fmultimedios%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_tvazteca', name: 'TV Azteca', logo: 'https://cdn.futbol-libre.su/img/tv_azteca.webp', genre: 'Deportes', country: 'México', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ftv-azteca%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_golperu', name: 'Gol Perú', logo: 'https://cdn.futbol-libre.su/img/gol_peru.webp', genre: 'Deportes', country: 'Perú', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fgol-peru%2F', category: 'TV', source: 'latamvidz' },
];

module.exports = { RELIABLE_CHANNELS };
