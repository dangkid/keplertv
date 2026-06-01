import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/movies/popular`);
      setMovies(response.data.data);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎬 KeplerTV</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6B00" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Películas Populares</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moviesScroll}>
            {movies.map((movie) => (
              <TouchableOpacity key={movie.id} style={styles.movieCard}>
                <Image
                  source={{
                    uri: movie.poster_path
                      ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                      : 'https://via.placeholder.com/150x200?text=No+Image'
                  }}
                  style={styles.movieImage}
                />
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {movie.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  moviesScroll: {
    marginBottom: 20,
  },
  movieCard: {
    marginRight: 15,
  },
  movieImage: {
    width: 150,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  movieTitle: {
    color: '#fff',
    marginTop: 8,
    fontSize: 12,
    width: 150,
  },
});
