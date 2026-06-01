// ===== RUTAS: BÚSQUEDA =====
const { Router } = require('express');
const router = Router();

const { searchMulti } = require('../services/tmdb');

// GET /api/search?query=terminator
router.get('/', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ success: false, error: 'Query requerido' });
    }
    try {
        const data = await searchMulti(query);
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
