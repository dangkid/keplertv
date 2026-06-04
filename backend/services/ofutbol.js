// ===== SERVICIO API OFUTBOL (J|Doxx) =====
// Fuente: https://ofutbol.jdoxx.com/api  (API pública compartida, 500 req/uso)
// IMPORTANTE: la API valida por "Origin"/"Referer". El valor de OFUTBOL_ORIGIN
// debe coincidir EXACTAMENTE con la URL registrada en el panel de J|Doxx.
// Cache TTL: 60s para la agenda (datos en vivo)

const axios = require('axios');
const https = require('https');
const { cache } = require('../utils/cache');

const OFUTBOL_TOKEN = process.env.OFUTBOL_TOKEN || '';
const OFUTBOL_ORIGIN = process.env.OFUTBOL_ORIGIN || 'http://localhost:3000';
const OFUTBOL_BASE = 'https://ofutbol.jdoxx.com/api';
const SCHEDULE_CACHE_TTL = 60; // 60 seg

// Algunos hosts usan certificados que fallan verificación; replicamos
// el SSL_VERIFYPEER => false del ejemplo PHP oficial.
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Construye los headers que la API exige para validar el origen.
 */
function buildHeaders() {
    return {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': OFUTBOL_ORIGIN,
        'Referer': OFUTBOL_ORIGIN.endsWith('/') ? OFUTBOL_ORIGIN : OFUTBOL_ORIGIN + '/'
    };
}

/**
 * Obtener la agenda/horario de transmisiones.
 * Devuelve la respuesta cruda de la API (para mapear según su estructura real).
 */
async function getSchedule() {
    if (!OFUTBOL_TOKEN) {
        return { success: false, error: 'OFUTBOL_TOKEN no configurado en .env' };
    }

    const cacheKey = 'ofutbol:schedule';
    const cached = cache.get(cacheKey);
    if (cached) return { success: true, data: cached, cached: true };

    try {
        const response = await axios.get(`${OFUTBOL_BASE}/shedule/${OFUTBOL_TOKEN}`, {
            headers: buildHeaders(),
            httpsAgent: insecureAgent,
            timeout: 12000
        });

        const data = response.data;

        // La API responde con {code, text} cuando hay un problema de validación.
        if (data && typeof data === 'object' && data.code && data.text) {
            console.warn('[Ofutbol] API rechazó la petición:', data.text);
            return { success: false, error: data.text, code: data.code };
        }

        cache.set(cacheKey, data, SCHEDULE_CACHE_TTL);
        return { success: true, data };
    } catch (e) {
        console.warn('[Ofutbol] Error obteniendo agenda:', e.message);
        return { success: false, error: e.message };
    }
}

module.exports = {
    getSchedule,
    OFUTBOL_ORIGIN
};
