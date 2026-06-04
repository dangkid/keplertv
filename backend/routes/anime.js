// ===== RUTAS DE ANIME =====
// Endpoints para buscar y ver anime con STREAMING REAL
// Fuente: Aniwatch API (HiAnime wrapper) - Español + múltiples resoluciones

const express = require('express');
const router = express.Router();
const animewatch = require('../services/aniwatch');

// GET /api/anime/popular - Animes populares con STREAMING REAL
router.get('/popular', async (req, res) => {
    try {
        const result = await animewatch.getPopularAnime();
        res.json(result);
    } catch (error) {
        console.warn('Error in anime popular route:', error.message);
        res.status(500).json({ success: false, data: [], genres: ['Todos'] });
    }
});

// GET /api/anime/search?q=nombre - Buscar anime CON LINKS DE STREAMING
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        const result = await animewatch.searchAnime(q);
        res.json(result);
    } catch (error) {
        console.warn('Error in anime search route:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/anime/info?id=anime-id - Info detallada del anime
router.get('/info', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ success: false, error: 'Anime ID requerido' });
        }
        const result = await animewatch.getAnimeInfo(id);
        res.json(result);
    } catch (error) {
        console.warn('Error in anime info route:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/anime/episodes?id=anime-id - Lista de episodios
router.get('/episodes', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ success: false, error: 'Anime ID requerido' });
        }
        const result = await animewatch.getEpisodes(id);
        res.json(result);
    } catch (error) {
        console.warn('Error in anime episodes route:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/anime/watch?episodeId=ep-id - Links de streaming del episodio
router.get('/watch', async (req, res) => {
    try {
        const { episodeId } = req.query;
        if (!episodeId) {
            return res.status(400).json({ success: false, error: 'Episode ID requerido' });
        }
        const result = await animewatch.getStreamingLinks(episodeId);
        res.json(result);
    } catch (error) {
        console.warn('Error in anime watch route:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
