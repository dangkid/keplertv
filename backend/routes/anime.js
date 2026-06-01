// ===== RUTAS DE ANIME =====
// Endpoints para buscar y ver anime desde AnimeAV1

const express = require('express');
const router = express.Router();
const animeService = require('../services/anime');

// GET /api/anime/search?q=nombre
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        const result = await animeService.searchAnime(q);
        res.json(result);
    } catch (error) {
        console.warn('Error in anime search route:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/anime/info?url=https://...
router.get('/info', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL requerida' });
        }
        const result = await animeService.getAnimeInfo(url);
        res.json(result);
    } catch (error) {
        console.warn('Error in anime info route:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/anime/episode?url=https://...
router.get('/episode', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL requerida' });
        }
        const result = await animeService.getEpisodeLinks(url);
        res.json(result);
    } catch (error) {
        console.warn('Error in anime episode route:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
