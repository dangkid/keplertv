// ===== RUTAS: SERIES =====
const { Router } = require('express');
const router = Router();

const {
    getPopularSeries,
    getTopRatedSeries,
    getTrendingSeries,
    getSeriesDetails,
    getSeasonEpisodes,
    discoverByGenre
} = require('../services/tmdb');

// GET /api/series/popular?page=1
router.get('/popular', async (req, res) => {
    try {
        const data = await getPopularSeries(req.query.page || 1);
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/series/top-rated
router.get('/top-rated', async (req, res) => {
    try {
        const data = await getTopRatedSeries();
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/series/trending
router.get('/trending', async (req, res) => {
    try {
        const data = await getTrendingSeries();
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/series/genre/:genreId?page=1
router.get('/genre/:genreId', async (req, res) => {
    try {
        const data = await discoverByGenre(req.params.genreId, 'tv', req.query.page || 1);
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/series/:id
router.get('/:id', async (req, res) => {
    try {
        const data = await getSeriesDetails(req.params.id);
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/series/:id/season/:seasonNumber
router.get('/:id/season/:seasonNumber', async (req, res) => {
    try {
        const data = await getSeasonEpisodes(req.params.id, req.params.seasonNumber);
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
