// ===== SERVICIO DE DEPORTES EN VIVO =====
// Fuentes:
// 1. jjfutbol2.lat - Agenda de partidos con canales (POST a agenda.php con token)
// 2. futbol-libre.su - Canales deportivos en vivo (fallback)
// Cache TTL: 60 segundos para datos en tiempo real
// Mirror: 300 segundos (5 min) para el endpoint espejo

const axios = require('axios');
const { cache } = require('../utils/cache');

const SPORTS_CACHE_TTL = 60;
const MIRROR_CACHE_TTL = 300; // 5 minutos para el espejo
const AGENDA_TOKEN = 'TU_TOKEN_SECRETO_AQUI_32_CHARS__';

// Canales deportivos de futbol-libre.su con metadatos completos
const SPORTS_CHANNELS = [
    {
        id: 'espn-1',
        name: 'ESPN',
        fullName: 'ESPN 1',
        slug: 'espn-1',
        logo: 'https://cdn.futbol-libre.su/img/espn1.webp',
        description: 'ESPN (Entertainment and Sports Programming Network) transmite fútbol, UFC, NFL, NBA y más.',
        url: 'https://futbol-libre.su/espn-1/',
        country: 'Latinoamérica',
        category: 'Deportes',
        bgColor: '#c8102e'
    },
    {
        id: 'directv-sports',
        name: 'DirecTV Sports',
        fullName: 'DirecTV Sports',
        slug: 'directv-sports',
        logo: 'https://cdn.futbol-libre.su/img/dsports.webp',
        description: 'DirecTV Sports (DSports) transmite fútbol sudamericano, Copa Libertadores, Copa Sudamericana.',
        url: 'https://futbol-libre.su/directv-sports/',
        country: 'Latinoamérica',
        category: 'Deportes',
        bgColor: '#003366'
    },
    {
        id: 'tyc-sports',
        name: 'TyC Sports',
        fullName: 'TyC Sports',
        slug: 'tyc-sports',
        logo: 'https://cdn.futbol-libre.su/img/tyc_sports.webp',
        description: 'TyC Sports, el canal deportivo argentino. Liga Profesional, Copa Argentina y más.',
        url: 'https://futbol-libre.su/tyc-sports/',
        country: 'Argentina',
        category: 'Deportes',
        bgColor: '#1a1a2e'
    },
    {
        id: 'win-sports-premium',
        name: 'Win Sports+',
        fullName: 'Win Sports+',
        slug: 'win-sports-premium',
        logo: 'https://cdn.futbol-libre.su/img/win_sports_plus.webp',
        description: 'Win Sports+, el canal de fútbol colombiano. Liga BetPlay y más.',
        url: 'https://futbol-libre.su/win-sports-premium/',
        country: 'Colombia',
        category: 'Deportes',
        bgColor: '#00a650'
    },
    {
        id: 'fox-sports',
        name: 'Fox Sports',
        fullName: 'Fox Sports',
        slug: 'fox-sports',
        logo: 'https://cdn.futbol-libre.su/img/fox_sports.webp',
        description: 'Fox Sports transmite fútbol mexicano, Liga MX, NFL, UFC y más.',
        url: 'https://futbol-libre.su/fox-sports/',
        country: 'México',
        category: 'Deportes',
        bgColor: '#003da5'
    },
    {
        id: 'tudn',
        name: 'TUDN',
        fullName: 'TUDN',
        slug: 'tudn',
        logo: 'https://cdn.futbol-libre.su/img/tudn.webp',
        description: 'TUDN (TelevisaUnivision) transmite fútbol mexicano, Liga MX, Selección Mexicana.',
        url: 'https://futbol-libre.su/tudn/',
        country: 'México',
        category: 'Deportes',
        bgColor: '#c60b1e'
    },
    {
        id: 'espn-premium',
        name: 'ESPN Premium',
        fullName: 'ESPN Premium',
        slug: 'espn-premium',
        logo: 'https://cdn.futbol-libre.su/img/espn_premium.webp',
        description: 'ESPN Premium, el canal premium de ESPN para Sudamérica.',
        url: 'https://futbol-libre.su/espn-premium/',
        country: 'Sudamérica',
        category: 'Deportes',
        bgColor: '#c8102e'
    },
    {
        id: 'tnt-sports',
        name: 'TNT Sports',
        fullName: 'TNT Sports',
        slug: 'tnt-sports',
        logo: 'https://cdn.futbol-libre.su/img/tnt_sport.webp',
        description: 'TNT Sports transmite fútbol argentino, Copa Libertadores, Champions League.',
        url: 'https://futbol-libre.su/tnt-sports/',
        country: 'Argentina',
        category: 'Deportes',
        bgColor: '#5200a0'
    }
];

/**
 * Obtener lista de canales deportivos disponibles
 */
async function getSportsChannels() {
    const cacheKey = 'sports:channels';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const channels = SPORTS_CHANNELS.map((ch, i) => ({
        ...ch,
        isLive: true,
        status: 'online',
        lastChecked: new Date().toISOString(),
        order: i + 1
    }));

    cache.set(cacheKey, channels, SPORTS_CACHE_TTL * 10);
    return channels;
}

/**
 * Obtener stream URL para un canal deportivo específico
 */
async function getChannelStream(channelId) {
    const channel = SPORTS_CHANNELS.find(ch => ch.id === channelId || ch.slug === channelId);
    if (!channel) {
        return { success: false, error: 'Canal no encontrado' };
    }

    try {
        const response = await axios.get(`http://localhost:${process.env.PORT || 3000}/api/channel-player`, {
            params: { url: channel.url },
            timeout: 15000
        });

        if (response.data && response.data.success) {
            return {
                success: true,
                channel: channel,
                streamUrl: response.data.url,
                proxyUrl: response.data.url,
                type: 'hls'
            };
        }
    } catch (error) {
        console.warn(`[Sports] Error getting stream for ${channelId}:`, error.message);
    }

    return {
        success: false,
        channel: channel,
        error: 'No se pudo obtener el stream del canal'
    };
}

/**
 * Obtener partidos de fútbol desde jjfutbol2.lat
 * @returns {Promise<Array>} - Array de partidos con canales
 */
async function getLiveFootballMatches() {
    const cacheKey = 'sports:live:football';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const matches = await fetchJJFutbolAgenda();
        if (matches.length > 0) {
            cache.set(cacheKey, matches, SPORTS_CACHE_TTL);
            return matches;
        }
    } catch (error) {
        console.warn('[Sports] Error fetching jjfutbol2.lat:', error.message);
    }

    // Fallback: devolver canales como eventos
    const channels = await getSportsChannels();
    const fallbackMatches = channels.map((ch, i) => ({
        id: `ch_${ch.id}`,
        eventName: `${ch.name} - En Vivo`,
        league: ch.country || 'Fútbol',
        leagueBadge: '',
        sport: 'Soccer',
        homeTeam: ch.name,
        awayTeam: 'En Vivo',
        homeScore: null,
        awayScore: null,
        homeBadge: ch.logo,
        awayBadge: 'https://ui-avatars.com/api/?name=TV&background=16213e&color=fff&size=64',
        date: new Date().toISOString().split('T')[0],
        time: 'En vivo',
        status: 'live',
        minute: 'EN VIVO',
        venue: '',
        thumb: ch.logo || '',
        video: ch.url,
        country: ch.country || '',
        channelId: ch.id,
        channelSlug: ch.slug,
        channels: [{ name: ch.name, id: ch.id }],
        season: '',
        round: '',
        timestamp: Date.now()
    }));

    cache.set(cacheKey, fallbackMatches, SPORTS_CACHE_TTL);
    return fallbackMatches;
}

/**
 * Fetch agenda from jjfutbol2.lat
 */
async function fetchJJFutbolAgenda() {
    const response = await axios.post('https://jjfutbol2.lat/agenda.php',
        `token=${encodeURIComponent(AGENDA_TOKEN)}`,
        {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Origin': 'https://jjfutbol2.lat',
                'Referer': 'https://jjfutbol2.lat/'
            }
        }
    );

    const data = response.data;
    if (!Array.isArray(data)) return [];

    const matches = data.map((item, index) => {
        // Parsear título: "Liga: \nEquipo A vs Equipo B"
        const title = (item.titulo || '').replace(/\\n/g, '\n').trim();
        const time = item.hora || '';
        const category = item.categoria || '';
        const logo = item.logo ? `https://jjfutbol2.lat${item.logo}` : '';
        const channels = (item.canales || []).map(c => ({
            name: c.canal || '',
            id: c.canal_id || ''
        }));

        // Extraer equipos del título
        let homeTeam = title;
        let awayTeam = '';
        let league = category;

        // Formato: "Liga: \nEquipo A vs Equipo B"
        const vsMatch = title.match(/(?:\w+:\s*)?\n?\s*(.+?)\s*(?:vs\.?|vs|VS|Vs|[-–—])\s*(.+)/);
        if (vsMatch) {
            homeTeam = vsMatch[1].trim();
            awayTeam = vsMatch[2].trim();
            // Extraer liga del prefijo
            const leagueMatch = title.match(/^([^:\n]+):/);
            if (leagueMatch) league = leagueMatch[1].trim();
        }

        // Determinar si está en vivo (comparar hora actual)
        const now = new Date();
        const [hours, mins] = time.split(':').map(Number);
        const matchTime = new Date(now);
        matchTime.setHours(hours || 0, mins || 0, 0, 0);
        
        const diffMs = now - matchTime;
        const diffMin = Math.floor(diffMs / 60000);
        
        let status = 'scheduled';
        let minute = time;
        if (diffMin >= 0 && diffMin <= 120) {
            status = 'live';
            minute = `${diffMin}'`;
        } else if (diffMin > 120) {
            status = 'finished';
            minute = 'Finalizado';
        }

        return {
            id: `jj_${index}`,
            eventName: title,
            league: league || 'Fútbol',
            leagueBadge: logo,
            sport: 'Soccer',
            homeTeam: homeTeam,
            awayTeam: awayTeam || 'Por definir',
            homeScore: null,
            awayScore: null,
            homeBadge: `https://ui-avatars.com/api/?name=${encodeURIComponent(homeTeam)}&background=1a1a2e&color=fff&size=64`,
            awayBadge: awayTeam ? `https://ui-avatars.com/api/?name=${encodeURIComponent(awayTeam)}&background=16213e&color=fff&size=64` : '',
            date: new Date().toISOString().split('T')[0],
            time: time,
            status: status,
            minute: minute,
            venue: category,
            thumb: logo || '',
            video: '',
            country: category,
            channels: channels,
            season: '',
            round: '',
            timestamp: Date.now()
        };
    });

    console.log(`[Sports] Fetched ${matches.length} matches from jjfutbol2.lat`);
    return matches;
}

/**
 * Obtener próximos partidos
 */
async function getUpcomingMatches(date) {
    const cacheKey = `sports:upcoming:${date || 'today'}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const liveMatches = await getLiveFootballMatches();
    cache.set(cacheKey, liveMatches, SPORTS_CACHE_TTL * 2);
    return liveMatches;
}

/**
 * Obtener detalles de un partido/canal específico
 */
async function getMatchDetails(matchId) {
    const channel = SPORTS_CHANNELS.find(ch => ch.id === matchId || ch.slug === matchId);
    if (channel) {
        return { ...channel, type: 'channel', isLive: true };
    }
    return null;
}

// ===== MIRROR / ESPEJO =====
// Almacena los datos en caché por 5 minutos para no depender de jjfutbol2.lat

/**
 * Obtener datos del espejo (caché larga)
 * Si no hay datos en caché, intenta fetch, si falla devuelve lo último conocido
 */
async function getMirrorMatches() {
    const mirrorKey = 'sports:mirror:matches';
    const cached = cache.get(mirrorKey);
    if (cached) return cached;

    // Intentar fetch en vivo
    try {
        const matches = await fetchJJFutbolAgenda();
        if (matches.length > 0) {
            cache.set(mirrorKey, matches, MIRROR_CACHE_TTL);
            return matches;
        }
    } catch (error) {
        console.warn('[Sports Mirror] Error fetching:', error.message);
    }

    // Fallback: devolver canales como eventos
    const channels = await getSportsChannels();
    const fallbackMatches = channels.map((ch, i) => ({
        id: `ch_${ch.id}`,
        eventName: `${ch.name} - En Vivo`,
        league: ch.country || 'Fútbol',
        leagueBadge: '',
        sport: 'Soccer',
        homeTeam: ch.name,
        awayTeam: 'En Vivo',
        homeScore: null,
        awayScore: null,
        homeBadge: ch.logo,
        awayBadge: 'https://ui-avatars.com/api/?name=TV&background=16213e&color=fff&size=64',
        date: new Date().toISOString().split('T')[0],
        time: 'En vivo',
        status: 'live',
        minute: 'EN VIVO',
        venue: '',
        thumb: ch.logo || '',
        video: ch.url,
        country: ch.country || '',
        channelId: ch.id,
        channelSlug: ch.slug,
        channels: [{ name: ch.name, id: ch.id }],
        season: '',
        round: '',
        timestamp: Date.now()
    }));

    cache.set(mirrorKey, fallbackMatches, MIRROR_CACHE_TTL);
    return fallbackMatches;
}

/**
 * Forzar actualización del espejo (llamado por el background refresh)
 */
async function refreshMirror() {
    const mirrorKey = 'sports:mirror:matches';
    try {
        const matches = await fetchJJFutbolAgenda();
        if (matches.length > 0) {
            cache.set(mirrorKey, matches, MIRROR_CACHE_TTL);
            console.log(`[Sports Mirror] Refreshed: ${matches.length} matches`);
            return true;
        }
    } catch (error) {
        console.warn('[Sports Mirror] Refresh failed:', error.message);
    }
    return false;
}

/**
 * Iniciar background refresh cada 5 minutos
 */
let mirrorInterval = null;
function startMirrorRefresh() {
    if (mirrorInterval) clearInterval(mirrorInterval);
    // Refresh cada 4 minutos (antes de que expire el TTL de 5 min)
    mirrorInterval = setInterval(refreshMirror, 4 * 60 * 1000);
    console.log('[Sports Mirror] Background refresh started (every 4 min)');
}

// Iniciar automáticamente
startMirrorRefresh();

module.exports = {
    getLiveFootballMatches,
    getUpcomingMatches,
    getMatchDetails,
    getSportsChannels,
    getChannelStream,
    getMirrorMatches,
    refreshMirror,
    SPORTS_CHANNELS
};
