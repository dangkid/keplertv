// ===== RUTAS: STREAMS (NUEVO SISTEMA MULTI-FUENTE) =====
const { Router } = require('express');
const router = Router();

const { resolveMovieStreams, resolveTVStreams } = require('../services/stream-resolver');

// GET /api/stream/movie/:id
router.get('/movie/:id', async (req, res) => {
    try {
        const result = await resolveMovieStreams(req.params.id);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message, streams: [] });
    }
});

// GET /api/stream/tv/:id/:season/:episode
router.get('/tv/:id/:season?/:episode?', async (req, res) => {
    try {
        const season = parseInt(req.params.season) || 1;
        const episode = parseInt(req.params.episode) || 1;
        const result = await resolveTVStreams(req.params.id, season, episode);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message, streams: [] });
    }
});

module.exports = router;
