import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export const MovieCard = ({ movie, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{
          uri: movie.poster_path
            ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
            : 'https://via.placeholder.com/150x200?text=No+Image'
        }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {movie.title}
        </Text>
        <Text style={styles.rating}>
          ⭐ {movie.vote_average?.toFixed(1) || 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const ChannelCard = ({ channel, onPress }) => {
  return (
    <TouchableOpacity style={styles.channelCard} onPress={onPress}>
      <Image
        source={{ uri: channel.logo }}
        style={styles.channelLogo}
      />
      <Text style={styles.channelName}>{channel.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: 10,
    marginBottom: 15,
  },
  image: {
    width: 150,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  info: {
    marginTop: 8,
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    width: 150,
  },
  rating: {
    color: '#FF6B00',
    fontSize: 11,
    marginTop: 4,
  },
  channelCard: {
    alignItems: 'center',
    marginRight: 15,
  },
  channelLogo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  channelName: {
    color: '#fff',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
    width: 100,
  },
});
