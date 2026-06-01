// ===== RUTAS: PELÍCULAS =====
const { Router } = require('express');
const router = Router();

const {
    getPopularMovies,
    getNowPlaying,
    getTopRatedMovies,
    getTrendingMovies,
    getMovieDetails,
    discoverByGenre
} = require('../services/tmdb');

// GET /api/movies/popular?page=1
router.get('/popular', async (req, res) => {
    try {
        const data = await getPopularMovies(req.query.page || 1);
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/movies/now-playing
router.get('/now-playing', async (req, res) => {
    try {
        const data = await getNowPlaying();
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/movies/top-rated
router.get('/top-rated', async (req, res) => {
    try {
        const data = await getTopRatedMovies();
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/movies/trending
router.get('/trending', async (req, res) => {
    try {
        const data = await getTrendingMovies();
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/movies/genre/:genreId?page=1
router.get('/genre/:genreId', async (req, res) => {
    try {
        const data = await discoverByGenre(req.params.genreId, 'movie', req.query.page || 1);
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, data: [] });
    }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
    try {
        const data = await getMovieDetails(req.params.id);
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
