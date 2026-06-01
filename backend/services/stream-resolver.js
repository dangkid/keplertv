// ===== RESOLVEDOR DE STREAMS =====
// Punto de entrada unificado para obtener streams

const { getMovieStreams, getTVStreams } = require('../sources');

/**
 * Resolver streams para una película
 */
async function resolveMovieStreams(movieId) {
    try {
        const streams = await getMovieStreams(movieId);
        return {
            success: true,
            id: movieId,
            type: 'movie',
            total: streams.length,
            alive: streams.filter(s => s.alive).length,
            streams
        };
    } catch (error) {
        return {
            success: false,
            id: movieId,
            type: 'movie',
            error: error.message,
            streams: []
        };
    }
}

/**
 * Resolver streams para un episodio de serie
 */
async function resolveTVStreams(seriesId, season = 1, episode = 1) {
    try {
        const streams = await getTVStreams(seriesId, season, episode);
        return {
            success: true,
            id: seriesId,
            type: 'tv',
            season,
            episode,
            total: streams.length,
            alive: streams.filter(s => s.alive).length,
            streams
        };
    } catch (error) {
        return {
            success: false,
            id: seriesId,
            type: 'tv',
            season,
            episode,
            error: error.message,
            streams: []
        };
    }
}

module.exports = { resolveMovieStreams, resolveTVStreams };
