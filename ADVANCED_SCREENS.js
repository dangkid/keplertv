// ============ EJEMPLOS DE PANTALLAS ADICIONALES ============

// ========== PANTALLA 1: DETALLES DE PELÍCULA ==========
// Crear archivo: mobile/screens/MovieDetailScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getMovieDetails } from '../services/api';

const width = Dimensions.get('window').width;

export default function MovieDetailScreen({ route, navigation }) {
  const { movieId } = route.params;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovieDetails();
  }, []);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      const data = await getMovieDetails(movieId);
      setMovie(data);
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se pudo cargar la película</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Imagen de fondo */}
      <Image
        source={{
          uri: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
            : 'https://via.placeholder.com/500x300?text=No+Image'
        }}
        style={styles.backdrop}
      />

      {/* Contenido */}
      <View style={styles.content}>
        {/* Título */}
        <Text style={styles.title}>{movie.title}</Text>

        {/* Información básica */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            ⭐ {movie.vote_average?.toFixed(1) || 'N/A'} / 10
          </Text>
          <Text style={styles.infoText}>
            📅 {movie.release_date || 'N/A'}
          </Text>
          <Text style={styles.infoText}>
            ⏱️ {movie.runtime || 'N/A'} min
          </Text>
        </View>

        {/* Géneros */}
        {movie.genres && movie.genres.length > 0 && (
          <View style={styles.genresContainer}>
            {movie.genres.map(genre => (
              <View key={genre.id} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sinopsis */}
        <Text style={styles.sectionTitle}>Sinopsis</Text>
        <Text style={styles.overview}>
          {movie.overview || 'No hay información disponible'}
        </Text>

        {/* Botones de acción */}
        <TouchableOpacity style={styles.playButton}>
          <Text style={styles.playButtonText}>▶ REPRODUCIR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.favoriteButton}>
          <Text style={styles.favoriteButtonText}>❤️ AGREGAR A FAVORITOS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backdrop: {
    width: width,
    height: 250,
    backgroundColor: '#333',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '600',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  genreTag: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  overview: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  favoriteButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  favoriteButtonText: {
    color: '#FF6B00',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B00',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});

// ========== PANTALLA 2: BÚSQUEDA ==========
// Crear archivo: mobile/screens/SearchScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { searchContent } from '../services/api';
import { MovieCard } from '../components/Cards';

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await searchContent(query);
      setResults(data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Buscar películas, series..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Resultados */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B00" style={{ marginTop: 50 }} />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (item.media_type === 'movie') {
                  navigation.navigate('MovieDetail', { movieId: item.id });
                }
              }}
            >
              <MovieCard movie={item} />
            </TouchableOpacity>
          )}
          scrollEnabled={true}
          contentContainerStyle={styles.resultsList}
        />
      ) : searchQuery.length > 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No se encontraron resultados</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>🔍 Busca películas y series</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 20,
  },
  searchBar: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  resultsList: {
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 18,
  },
});

// ========== PANTALLA 3: NAVEGACIÓN CON TABS ==========
// Actualizar mobile/App.js para usar navegación

/*
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ChannelsScreen from './screens/ChannelsScreen';
import FavoritesScreen from './screens/FavoritesScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Channels') {
              iconName = focused ? 'tv' : 'tv-outline';
            } else if (route.name === 'Favorites') {
              iconName = focused ? 'heart' : 'heart-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#FF6B00',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderTopColor: '#333',
          },
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Channels" component={ChannelsScreen} />
        <Tab.Screen name="Favorites" component={FavoritesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
*/

// ========== PANTALLA 4: FAVORITOS (ALMACENAMIENTO LOCAL) ==========
// Crear archivo: mobile/screens/FavoritesScreen.js

/*
import React, { useState, useFocusEffect } from 'react';
import { View, Text, FlatList, StyleSheet, AsyncStorage } from 'react-native';
import { MovieCard } from '../components/Cards';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem('favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  return (
    <View style={styles.container}>
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MovieCard 
              movie={item}
              onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>❤️ No hay favoritos aún</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  list: {
    padding: 20,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 18,
  },
});
*/
