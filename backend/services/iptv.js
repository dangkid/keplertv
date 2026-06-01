// ===== SERVICIO IPTV-ORG =====
const axios = require('axios');
const { COUNTRY_NAMES, GROUP_ES } = require('../utils/genres');
const { RELIABLE_CHANNELS } = require('../data/reliable-channels');
const { cache } = require('../utils/cache');

const IPTV_URL = 'https://iptv-org.github.io/iptv/languages/spa.m3u';
const IPTV_TTL = 3600000; // 1 hora

/**
 * Parsear archivo M3U de IPTV-org
 */
function parseM3U(text) {
    const channels = [];
    const lines = text.split('\n');
    let idx = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('#EXTINF:')) continue;

        const logo = (line.match(/tvg-logo="([^"]*)"/) || [])[1] || '';
        const cc = (line.match(/tvg-country="([^"]*)"/) || [])[1] || '';
        const group = (line.match(/group-title="([^"]*)"/) || [])[1] || 'General';
        const name = (line.match(/,(.+)$/) || [])[1] || '';

        // Saltar contenido para adultos
        if (/xxx|adult|porn|18\+/i.test(group) || /xxx|adult|porn/i.test(name)) continue;

        let j = i + 1;
        while (j < lines.length) {
            const next = lines[j].trim();
            if (next && !next.startsWith('#')) break;
            j++;
        }
        const url = j < lines.length ? lines[j].trim() : '';

        if (name && url && url.startsWith('http')) {
            idx++;
            const countryCodes = cc.split(';').map(c => c.trim()).filter(Boolean);
            const mainCountry = countryCodes[0] || 'INT';
            const mainGroup = group.split(';')[0].trim();
            const genre = GROUP_ES[mainGroup] || mainGroup || 'General';
            const finalGenre = genre === 'General' ? 'Generalista' : genre;

            channels.push({
                id: `iptv_${idx}`,
                name: name.trim(),
                logo,
                genre: finalGenre,
                country: COUNTRY_NAMES[mainCountry] || mainCountry || 'Internacional',
                countryCode: mainCountry,
                url,
                category: 'TV'
            });
        }
    }
    return channels;
}

/**
 * Obtener canales de IPTV-org (con caché)
 */
async function fetchIPTVChannels() {
    const cacheKey = 'iptv:channels';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const res = await axios.get(IPTV_URL, {
            timeout: 20000,
            responseType: 'text'
        });
        const channels = parseM3U(res.data);
        cache.set(cacheKey, channels, IPTV_TTL);
        console.log(`📡 IPTV-org: ${channels.length} canales en español cargados`);
        return channels;
    } catch (e) {
        console.warn('⚠️ Error IPTV-org:', e.message);
        return [];
    }
}

/**
 * Obtener todos los canales (fiables + IPTV) sin duplicados
 */
async function getAllChannels() {
    const iptv = await fetchIPTVChannels();
    const seen = new Set();
    const merged = [];

    // Primero los fiables (prioridad)
    for (const ch of RELIABLE_CHANNELS) {
        const key = ch.name.toLowerCase().replace(/\s+/g, '');
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(ch);
        }
    }

    // Luego IPTV-org (sin duplicar)
    for (const ch of iptv) {
        const key = ch.name.toLowerCase().replace(/\s+/g, '');
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(ch);
        }
    }

    return merged;
}

/**
 * Obtener canales filtrados por género y país
 */
async function getFilteredChannels(genre = 'all', country = 'all') {
    let channels = await getAllChannels();

    if (genre !== 'all') {
        channels = channels.filter(ch => ch.genre === genre);
    }
    if (country !== 'all') {
        channels = channels.filter(ch => ch.country === country);
    }

    return channels;
}

/**
 * Obtener géneros únicos disponibles
 */
async function getAvailableGenres() {
    const channels = await getAllChannels();
    const genres = new Set();
    channels.forEach(ch => { if (ch.genre) genres.add(ch.genre); });
    return Array.from(genres).sort();
}

/**
 * Obtener países únicos disponibles
 */
async function getAvailableCountries() {
    const channels = await getAllChannels();
    const countries = new Set();
    channels.forEach(ch => { if (ch.country) countries.add(ch.country); });
    return Array.from(countries).sort();
}

module.exports = {
    fetchIPTVChannels,
    getAllChannels,
    getFilteredChannels,
    getAvailableGenres,
    getAvailableCountries,
    RELIABLE_CHANNELS
};
