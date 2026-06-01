// ===== CANALES FIJOS VERIFICADOS (SOLO LOS QUE FUNCIONAN) =====
// Organizados por país y género para fácil navegación
// Los canales deportivos usan futbol-libre.su como intermediario
// porque latamvidz1.com está bloqueado por Cloudflare en España.
// futbol-libre.su carga internamente el iframe de latamvidz1.com
// y su dominio está whitelisted, por lo que funciona sin VPN.

const RELIABLE_CHANNELS = [
    // ==================== DEPORTES (vía futbol-libre.su → reproductor limpio) ====================
    { id: 'latamvidz_espn', name: 'ESPN 1', logo: 'https://cdn.futbol-libre.su/img/espn1.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fespn-1%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_dsports', name: 'DirectTV Sports', logo: 'https://cdn.futbol-libre.su/img/dsports.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fdirectv-sports%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_tycsports', name: 'TyC Sports', logo: 'https://cdn.futbol-libre.su/img/tyc_sports.webp', genre: 'Deportes', country: 'Argentina', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ftyc-sports%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_winplus', name: 'Win Sports+', logo: 'https://cdn.futbol-libre.su/img/win_sports_plus.webp', genre: 'Deportes', country: 'Colombia', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fwin-sports-premium%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_foxsports', name: 'Fox Sports', logo: 'https://cdn.futbol-libre.su/img/fox_sports.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ffox-sports%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_tudn', name: 'TUDN USA', logo: 'https://cdn.futbol-libre.su/img/tudn.webp', genre: 'Deportes', country: 'EE.UU.', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ftudn%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_espnpremium', name: 'ESPN Premium', logo: 'https://cdn.futbol-libre.su/img/espn_premium.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Fespn-premium%2F', category: 'TV', source: 'latamvidz' },
    { id: 'latamvidz_tntsports', name: 'TNT Sports', logo: 'https://cdn.futbol-libre.su/img/tnt_sport.webp', genre: 'Deportes', country: 'Latinoamérica', url: '/api/channel-player?url=https%3A%2F%2Ffutbol-libre.su%2Ftnt-sports%2F', category: 'TV', source: 'latamvidz' },
];

module.exports = { RELIABLE_CHANNELS };
