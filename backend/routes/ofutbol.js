// ===== RUTAS: API OFUTBOL (J|Doxx) =====
const { Router } = require('express');
const router = Router();
const ofutbol = require('../services/ofutbol');

// GET /api/ofutbol/schedule - Agenda de transmisiones en vivo
router.get('/schedule', async (req, res) => {
    const result = await ofutbol.getSchedule();
    if (!result.success) {
        return res.status(502).json(result);
    }
    res.json(result);
});

module.exports = router;
