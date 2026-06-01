// ===== RUTAS DE DEPORTES EN VIVO =====
const express = require('express');
const router = express.Router();
const sportsService = require('../services/sports');

/**
 * GET /api/sports/channels
 * Obtener lista de canales deportivos disponibles
 */
router.get('/channels', async (req, res) => {
    try {
        const channels = await sportsService.getSportsChannels();
        res.json({
            success: true,
            data: channels,
            count: channels.length,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en /api/sports/channels:', error.message);
        res.json({ success: true, data: [], count: 0, updatedAt: new Date().toISOString() });
    }
});

/**
 * GET /api/sports/channel/:id/stream
 * Obtener stream URL para un canal deportivo específico
 */
router.get('/channel/:id/stream', async (req, res) => {
    try {
        const result = await sportsService.getChannelStream(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error en /api/sports/channel/:id/stream:', error.message);
        res.json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sports/live
 * Obtener partidos de fútbol en vivo
 */
router.get('/live', async (req, res) => {
    try {
        const matches = await sportsService.getLiveFootballMatches();
        res.json({
            success: true,
            data: matches,
            count: matches.length,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en /api/sports/live:', error.message);
        res.json({ success: true, data: [], count: 0, updatedAt: new Date().toISOString() });
    }
});

/**
 * GET /api/sports/upcoming
 * Obtener próximos partidos
 * Query params: date (YYYY-MM-DD, opcional, por defecto hoy)
 */
router.get('/upcoming', async (req, res) => {
    try {
        const date = req.query.date;
        const matches = await sportsService.getUpcomingMatches(date);
        res.json({
            success: true,
            data: matches,
            count: matches.length,
            date: date || new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Error en /api/sports/upcoming:', error.message);
        res.json({ success: true, data: [], count: 0 });
    }
});

/**
 * GET /api/sports/match/:id
 * Obtener detalles de un partido/canal específico
 */
router.get('/match/:id', async (req, res) => {
    try {
        const match = await sportsService.getMatchDetails(req.params.id);
        if (match) {
            res.json({ success: true, data: match });
        } else {
            res.json({ success: false, error: 'Partido no encontrado' });
        }
    } catch (error) {
        console.error('Error en /api/sports/match/:id:', error.message);
        res.json({ success: false, error: error.message });
    }
});

/**
 * GET /api/sports/mirror
 * Endpoint espejo con caché de 5 minutos
 * No depende directamente de jjfutbol2.lat en cada request
 */
router.get('/mirror', async (req, res) => {
    try {
        const matches = await sportsService.getMirrorMatches();
        res.json({
            success: true,
            data: matches,
            count: matches.length,
            source: matches.length > 0 && matches[0].id && matches[0].id.startsWith('jj_') ? 'jjfutbol2.lat' : 'fallback',
            cachedAt: new Date().toISOString(),
            ttl: '5 minutos'
        });
    } catch (error) {
        console.error('Error en /api/sports/mirror:', error.message);
        res.json({ success: true, data: [], count: 0, source: 'error', cachedAt: new Date().toISOString(), ttl: '5 minutos' });
    }
});

/**
 * POST /api/sports/mirror/refresh
 * Forzar actualización del espejo
 */
router.post('/mirror/refresh', async (req, res) => {
    try {
        const result = await sportsService.refreshMirror();
        res.json({ success: result, message: result ? 'Espejo actualizado' : 'Error al actualizar' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

module.exports = router;
