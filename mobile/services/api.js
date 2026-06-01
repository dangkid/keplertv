import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ============ PELÍCULAS ============

export const getPopularMovies = async (page = 1) => {
  try {
    const response = await apiClient.get('/movies/popular', {
      params: { page }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
};

export const getNowPlaying = async () => {
  try {
    const response = await apiClient.get('/movies/now-playing');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching now playing:', error);
    throw error;
  }
};

export const getTopRatedMovies = async () => {
  try {
    const response = await apiClient.get('/movies/top-rated');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    throw error;
  }
};

export const getTrendingMovies = async () => {
  try {
    const response = await apiClient.get('/movies/trending');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    throw error;
  }
};

export const getMoviesByGenre = async (genreId, page = 1) => {
  try {
    const response = await apiClient.get(`/movies/genre/${genreId}`, {
      params: { page }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    throw error;
  }
};

export const getMovieDetails = async (movieId) => {
  try {
    const response = await apiClient.get(`/movies/${movieId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};

// ============ SERIES ============

export const getPopularSeries = async (page = 1) => {
  try {
    const response = await apiClient.get('/series/popular', {
      params: { page }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching popular series:', error);
    throw error;
  }
};

export const getTopRatedSeries = async () => {
  try {
    const response = await apiClient.get('/series/top-rated');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching top rated series:', error);
    throw error;
  }
};

export const getTrendingSeries = async () => {
  try {
    const response = await apiClient.get('/series/trending');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching trending series:', error);
    throw error;
  }
};

export const getSeriesByGenre = async (genreId, page = 1) => {
  try {
    const response = await apiClient.get(`/series/genre/${genreId}`, {
      params: { page }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching series by genre:', error);
    throw error;
  }
};

export const getSeriesDetails = async (seriesId) => {
  try {
    const response = await apiClient.get(`/series/${seriesId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching series details:', error);
    throw error;
  }
};

export const getSeasonEpisodes = async (seriesId, seasonNumber) => {
  try {
    const response = await apiClient.get(`/series/${seriesId}/season/${seasonNumber}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching season episodes:', error);
    throw error;
  }
};

// ============ TV EN VIVO ============

export const getChannels = async () => {
  try {
    const response = await apiClient.get('/tv/live-channels');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching channels:', error);
    throw error;
  }
};

export const getFilteredChannels = async (genre, country) => {
  try {
    const params = {};
    if (genre) params.genre = genre;
    if (country) params.country = country;
    const response = await apiClient.get('/tv/live-channels', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching filtered channels:', error);
    throw error;
  }
};

export const getTVGenres = async () => {
  try {
    const response = await apiClient.get('/tv/genres');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching TV genres:', error);
    throw error;
  }
};

export const getTVCountries = async () => {
  try {
    const response = await apiClient.get('/tv/countries');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching TV countries:', error);
    throw error;
  }
};

// ============ STREAMS (NUEVO SISTEMA MULTI-FUENTE) ============

export const getMovieStreams = async (movieId) => {
  try {
    const response = await apiClient.get(`/stream/movie/${movieId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching movie streams:', error);
    throw error;
  }
};

export const getTVStreams = async (seriesId, season = 1, episode = 1) => {
  try {
    const response = await apiClient.get(`/stream/tv/${seriesId}/${season}/${episode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching TV streams:', error);
    throw error;
  }
};

// ============ BÚSQUEDA ============

export const searchContent = async (query) => {
  try {
    const response = await apiClient.get('/search', {
      params: { query }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error searching content:', error);
    throw error;
  }
};

export default apiClient;
