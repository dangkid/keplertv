// ===== SERVICIO DE DEPORTES EN VIVO =====
// Fuentes:
// 1. Football-Data.org (PRIMARY) - API oficial, partidos futuros + en vivo
// 2. jjfutbol2.lat - Agenda de partidos con canales (FALLBACK)
// 3. futbol-libre.su - Canales deportivos en vivo (FALLBACK)
// Cache TTL: 30 segundos para datos en tiempo real

const axios = require('axios');
const { cache } = require('../utils/cache');

const SPORTS_CACHE_TTL = 30; // 30 seg para datos en vivo
const MIRROR_CACHE_TTL = 300; // 5 minutos para el espejo
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY || '1c5b52ade62542b7be09fcf640d89bf1';
const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const AGENDA_TOKEN = process.env.AGENDA_TOKEN || 'token_fallback';

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
        id: 'espn-2',
        name: 'ESPN 2',
        fullName: 'ESPN 2',
        slug: 'espn-2',
        logo: 'https://cdn.futbol-libre.su/img/espn2.webp',
        description: 'ESPN 2 transmite fútbol, tenis, baloncesto, béisbol y más deportes en Latinoamérica.',
        url: 'https://futbol-libre.su/espn-2/',
        country: 'Latinoamérica',
        category: 'Deportes',
        bgColor: '#c8102e'
    },
    {
        id: 'espn-3',
        name: 'ESPN 3',
        fullName: 'ESPN 3',
        slug: 'espn-3',
        logo: 'https://cdn.futbol-libre.su/img/espn3.webp',
        description: 'ESPN 3 transmite partidos en vivo de múltiples deportes y ligas internacionales.',
        url: 'https://futbol-libre.su/espn-3/',
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
        id: 'fox-sports-2',
        name: 'Fox Sports 2',
        fullName: 'Fox Sports 2',
        slug: 'fox-sports-2',
        logo: 'https://cdn.futbol-libre.su/img/fox_sports_2.webp',
        description: 'Fox Sports 2 transmite fútbol mexicano, Liga MX, NFL, UFC y más.',
        url: 'https://futbol-libre.su/fox-sports-2/',
        country: 'México',
        category: 'Deportes',
        bgColor: '#003da5'
    },
    {
        id: 'fox-sports-3',
        name: 'Fox Sports 3',
        fullName: 'Fox Sports 3',
        slug: 'fox-sports-3',
        logo: 'https://cdn.futbol-libre.su/img/fox_sports_3.webp',
        description: 'Fox Sports 3 transmite deportes en vivo: fútbol, béisbol, baloncesto y más.',
        url: 'https://futbol-libre.su/fox-sports-3/',
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
    },
    // Canales adicionales de futbol-libre.su
    {
        id: 'azteca-7',
        name: 'Azteca 7',
        fullName: 'Azteca 7',
        slug: 'azteca-7',
        logo: 'https://cdn.futbol-libre.su/img/azteca_7.webp',
        description: 'Azteca 7 transmite fútbol mexicano, Liga MX y más.',
        url: 'https://futbol-libre.su/azteca-7/',
        country: 'México',
        category: 'Deportes',
        bgColor: '#c41230'
    },
    {
        id: 'canal-5',
        name: 'Canal 5',
        fullName: 'Canal 5',
        slug: 'canal-5',
        logo: 'https://cdn.futbol-libre.su/img/canal_5.webp',
        description: 'Canal 5 transmite eventos deportivos seleccionados.',
        url: 'https://futbol-libre.su/canal-5/',
        country: 'México',
        category: 'Deportes',
        bgColor: '#003b6f'
    },
    {
        id: 'imagen-tv',
        name: 'Imagen TV',
        fullName: 'Imagen TV',
        slug: 'imagen-tv',
        logo: 'https://cdn.futbol-libre.su/img/imagen_tv.webp',
        description: 'Imagen TV transmite fútbol mexicano y eventos deportivos.',
        url: 'https://futbol-libre.su/imagen-tv/',
        country: 'México',
        category: 'Deportes',
        bgColor: '#004b87'
    },
    {
        id: 'multimedios',
        name: 'Multimedios',
        fullName: 'Multimedios',
        slug: 'multimedios',
        logo: 'https://cdn.futbol-libre.su/img/multimedios.webp',
        description: 'Multimedios transmite Liga MX y fútbol mexicano.',
        url: 'https://futbol-libre.su/multimedios/',
        country: 'México',
        category: 'Deportes',
        bgColor: '#ed1c24'
    },
    {
        id: 'tv-azteca',
        name: 'TV Azteca',
        fullName: 'TV Azteca',
        slug: 'tv-azteca',
        logo: 'https://cdn.futbol-libre.su/img/tv_azteca.webp',
        description: 'TV Azteca transmite fútbol mexicano y eventos deportivos.',
        url: 'https://futbol-libre.su/tv-azteca/',
        country: 'México',
        category: 'Deportes',
        bgColor: '#004b87'
    },
    {
        id: 'gol-peru',
        name: 'Gol Perú',
        fullName: 'Gol Perú',
        slug: 'gol-peru',
        logo: 'https://cdn.futbol-libre.su/img/gol_peru.webp',
        description: 'Gol Perú transmite fútbol peruano, Liga 1 y más.',
        url: 'https://futbol-libre.su/gol-peru/',
        country: 'Perú',
        category: 'Deportes',
        bgColor: '#e30613'
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
 * Obtener partidos de fútbol desde Football-Data.org
 * Retorna próximos partidos, en vivo y finalizados
 * @returns {Promise<Array>} - Array de partidos
 */
async function getLiveFootballMatches() {
    const cacheKey = 'sports:live:football';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Intentar Football-Data.org primero
        const matches = await fetchFootballDataMatches();
        if (matches && matches.length > 0) {
            cache.set(cacheKey, matches, SPORTS_CACHE_TTL);
            console.log(`[Sports] Loaded ${matches.length} matches from Football-Data.org`);
            return matches;
        }
    } catch (error) {
        console.warn('[Sports] Error fetching Football-Data.org:', error.message);
    }

    // Fallback a jjfutbol2.lat
    try {
        const matches = await fetchJJFutbolAgenda();
        if (matches.length > 0) {
            cache.set(cacheKey, matches, SPORTS_CACHE_TTL);
            console.log(`[Sports] Fallback to jjfutbol2.lat: ${matches.length} matches`);
            return matches;
        }
    } catch (error) {
        console.warn('[Sports] Error fetching jjfutbol2.lat:', error.message);
    }

    // Fallback final: devolver canales como eventos
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
 * Fetch matches from Football-Data.org
 * Usa caché agresivo y rate limit control
 */
async function fetchFootballDataMatches() {
    // Competiciones principales (reducidas para evitar rate limit)
    const competitions = [
        { id: 'PL', name: 'Premier League' },           // Inglaterra (MÁS CONFIABLE)
        { id: 'BL1', name: 'Bundesliga' },              // Alemania
        { id: 'CL', name: 'Champions League' }          // Europa (cuando hay)
    ];

    const cacheKey = 'sports:fd:matches:cache';
    const cachedMatches = cache.get(cacheKey);
    if (cachedMatches && cachedMatches.length > 0) {
        return cachedMatches;
    }

    const allMatches = [];
    const now = new Date();

    for (const comp of competitions) {
        try {
            // Obtener solo próximos partidos (más ligero)
            const dateFrom = new Date(now);
            dateFrom.setDate(dateFrom.getDate() - 2); // Últimos 2 días (partidos finalizados recientes)
            const dateTo = new Date(now);
            dateTo.setDate(dateTo.getDate() + 30); // Próximos 30 días

            const response = await axios.get(`${FOOTBALL_DATA_BASE}/competitions/${comp.id}/matches`, {
                params: {
                    dateFrom: dateFrom.toISOString().split('T')[0],
                    dateTo: dateTo.toISOString().split('T')[0],
                    status: 'SCHEDULED,LIVE,FINISHED'
                },
                headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY },
                timeout: 8000
            });

            const matches = response.data.matches || [];
            console.log(`[Football-Data] ${comp.id}: ${matches.length} matches`);

            matches.forEach((match) => {
                const utcDate = new Date(match.utcDate);
                const diffMs = now - utcDate;
                const diffMin = Math.floor(diffMs / 60000);

                let status = 'scheduled';
                let minute = utcDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                if (match.status === 'LIVE') {
                    status = 'live';
                    minute = `${Math.max(0, diffMin)}'`;
                } else if (match.status === 'FINISHED') {
                    status = 'finished';
                    minute = 'Finalizado';
                }

                // Filtro: incluir próximos + en vivo + recientes finalizados
                const isRecentlyFinished = status === 'finished' && diffMin < 180; // últimas 3 horas
                const isScheduled = status === 'scheduled' && diffMin < 30 * 24 * 60; // próximos 30 días

                if (status === 'live' || isScheduled || isRecentlyFinished) {
                    allMatches.push({
                        id: `fd_${match.id}`,
                        eventName: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                        league: comp.name,
                        leagueBadge: match.competition?.emblem || '',
                        sport: 'Soccer',
                        homeTeam: match.homeTeam.name,
                        awayTeam: match.awayTeam.name,
                        homeScore: match.score.fullTime.home,
                        awayScore: match.score.fullTime.away,
                        homeBadge: match.homeTeam.crest || '',
                        awayBadge: match.awayTeam.crest || '',
                        date: utcDate.toISOString().split('T')[0],
                        time: minute,
                        status: status,
                        minute: minute,
                        venue: match.venue || '',
                        thumb: match.competition?.emblem || '',
                        video: '',
                        country: comp.name,
                        channels: [],
                        season: match.season?.currentMatchday || '',
                        round: match.stage || '',
                        timestamp: utcDate.getTime()
                    });
                }
            });

            // Delay entre requests para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.warn(`[Football-Data] Error fetching ${comp.id}:`, error.message);
        }
    }

    // Ordenar por fecha (próximos primero)
    const sorted = allMatches.sort((a, b) => a.timestamp - b.timestamp);

    // Caché por 5 minutos
    cache.set(cacheKey, sorted, 300);

    return sorted;
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

        // Formato típico: "LaLiga SmartBank: \nCórdoba vs Zaragoza"
        // También: "Amistoso: Eslovaquia vs Malta" (sin newline)
        // 1. Extraer liga del prefijo (todo antes de ": \n", ":\n" o ": ")
        const leaguePrefixMatch = title.match(/^(.+?):\s*(?:\n| )/);
        if (leaguePrefixMatch) {
            league = leaguePrefixMatch[1].trim();
        }

        // 2. Remover el prefijo de liga para quedarnos solo con los equipos
        let teamsPart = title;
        if (leaguePrefixMatch) {
            teamsPart = title.substring(leaguePrefixMatch[0].length).trim();
        }

        // 3. Buscar el separador "vs" en la parte de equipos
        const vsMatch = teamsPart.match(/(.+?)\s*(?:vs\.?|VS|Vs|[-–—])\s*(.+)/);
        if (vsMatch) {
            homeTeam = vsMatch[1].trim();
            awayTeam = vsMatch[2].trim();
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
