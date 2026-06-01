// ===== MAPAS DE TRADUCCIÓN =====

const GENRES = {
    28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen',
    99: 'Documental', 18: 'Drama', 10751: 'Familia', 14: 'Fantasía', 36: 'Historia',
    27: 'Terror', 10402: 'Música', 9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción',
    10770: 'TV Movie', 53: 'Suspenso', 10752: 'Bélica', 37: 'Western',
    10759: 'Acción y Aventura', 10762: 'Infantil', 10763: 'Noticias', 10764: 'Reality',
    10765: 'Sci-Fi y Fantasía', 10766: 'Telenovela', 10767: 'Talk Show', 10768: 'Política'
};

const COUNTRY_NAMES = {
    ES: 'España', MX: 'México', AR: 'Argentina', CO: 'Colombia', CL: 'Chile',
    PE: 'Perú', VE: 'Venezuela', EC: 'Ecuador', BO: 'Bolivia', PY: 'Paraguay',
    UY: 'Uruguay', CR: 'Costa Rica', PA: 'Panamá', DO: 'Rep. Dominicana',
    CU: 'Cuba', GT: 'Guatemala', HN: 'Honduras', SV: 'El Salvador', NI: 'Nicaragua',
    US: 'EE.UU.', GB: 'Reino Unido', FR: 'Francia', DE: 'Alemania', IT: 'Italia',
    PT: 'Portugal', BR: 'Brasil', JP: 'Japón', KR: 'Corea del Sur', INT: 'Internacional'
};

const GROUP_ES = {
    News: 'Noticias', Sports: 'Deportes', Entertainment: 'Entretenimiento',
    Music: 'Música', Kids: 'Infantil', Documentary: 'Documentales',
    Movies: 'Cine', General: 'Generalista', Religious: 'Religión',
    Education: 'Educación', Lifestyle: 'Estilo de Vida', Comedy: 'Comedia',
    Animation: 'Animación', Classic: 'Clásicos', Culture: 'Cultura',
    Cooking: 'Cocina', Science: 'Ciencia', Travel: 'Viajes',
    Weather: 'Clima', Auto: 'Motor', Shop: 'Compras', Undefined: 'General',
    Legislative: 'Política', Business: 'Negocios', Outdoor: 'Naturaleza',
    Family: 'Familia', Series: 'Series'
};

function genreNames(ids) {
    if (!ids || !Array.isArray(ids)) return [];
    return ids.map(id => GENRES[id]).filter(Boolean);
}

function mapResult(item, type) {
    const isTV = type === 'tv';
    return {
        id: item.id,
        title: item.title || item.name || 'Sin título',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : '',
        year: ((isTV ? item.first_air_date : item.release_date) || '').split('-')[0] || '',
        rating: (item.vote_average || 0).toFixed(1),
        genres: genreNames(item.genre_ids),
        genre_ids: item.genre_ids || [],
        overview: item.overview || 'Sin descripción disponible.',
        url: isTV ? `https://vidsrc.to/embed/tv/${item.id}/1/1` : `https://vidsrc.to/embed/movie/${item.id}`,
        category: isTV ? 'Serie' : 'Película'
    };
}

module.exports = { GENRES, COUNTRY_NAMES, GROUP_ES, genreNames, mapResult };
