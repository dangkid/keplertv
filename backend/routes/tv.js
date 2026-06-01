// ===== RUTAS: TV EN VIVO =====
// SOLO canales verificados que funcionan (no IPTV-org)
const { Router } = require('express');
const router = Router();

const { RELIABLE_CHANNELS } = require('../data/reliable-channels');

// GET /api/tv/live-channels
// GET /api/tv/live-channels?genre=Deportes
// GET /api/tv/live-channels?country=Latinoamérica
router.get('/live-channels', async (req, res) => {
    try {
        const { genre, country } = req.query;

        let channels = [...RELIABLE_CHANNELS];

        // Filtrar por género
        if (genre && genre !== 'all') {
            channels = channels.filter(ch => ch.genre === genre);
        }

        // Filtrar por país
        if (country && country !== 'all') {
            channels = channels.filter(ch => ch.country === country);
        }

        res.json({ success: true, total: channels.length, data: channels });
    } catch (e) {
        console.error('Error en TV:', e.message);
        res.json({ success: true, total: 0, data: [] });
    }
});

// GET /api/tv/genres
router.get('/genres', async (req, res) => {
    try {
        const genres = [...new Set(RELIABLE_CHANNELS.map(ch => ch.genre).filter(Boolean))];
        res.json({ success: true, data: genres });
    } catch (e) {
        res.json({ success: true, data: ['Deportes'] });
    }
});

// GET /api/tv/countries
router.get('/countries', async (req, res) => {
    try {
        const countries = [...new Set(RELIABLE_CHANNELS.map(ch => ch.country).filter(Boolean))];
        res.json({ success: true, data: countries });
    } catch (e) {
        res.json({ success: true, data: ['Latinoamérica', 'Argentina', 'Colombia', 'EE.UU.'] });
    }
});

module.exports = router;
