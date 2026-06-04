import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  Modal,
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.135:3000/api';

// Colores Netflix
const COLORS = {
  primary: '#0f0f0f',
  secondary: '#1a1a1a',
  accent: '#0f3460',
  highlight: '#e50914',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#333333',
};

const PROVIDERS = {
  netflix: 'Netflix',
  amazon: 'Amazon Prime',
  hbo: 'HBO Max',
  disney: 'Disney+',
  default: 'KeplerTV',
};

// ==================== COMPONENTES ====================

function StatusBar() {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.logo}>📺 KeplerTV</Text>
      <Text style={styles.statusText}>En Vivo</Text>
    </View>
  );
}

function HeroBanner({ onPlayPress }) {
  return (
    <TouchableOpacity
      style={styles.heroBanner}
      onPress={onPlayPress}
      activeOpacity={0.8}
    >
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>KeplerTV</Text>
        <Text style={styles.heroSubtitle}>Streaming Profesional</Text>
        <TouchableOpacity style={styles.playButton} onPress={onPlayPress}>
          <Text style={styles.playButtonText}>▶ Ver Ahora</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ChannelCard({ channel, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(channel)}
      activeOpacity={0.7}
    >
      <View style={styles.cardImage}>
        <Text style={styles.cardImageText}>🎬</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {channel.name}
        </Text>
        <Text style={styles.cardProvider}>
          {PROVIDERS[channel.provider] || PROVIDERS.default}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function PlayerModal({ visible, channel, onClose }) {
  if (!channel) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {channel.name}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Player Simulado */}
          <View style={styles.playerContainer}>
            <Text style={styles.playerIcon}>▶️</Text>
            <Text style={styles.playerText}>Reproduciendo en Vivo</Text>
          </View>

          {/* Provider Badge */}
          <View style={styles.providerBadge}>
            <Text style={styles.providerText}>
              {PROVIDERS[channel.provider] || PROVIDERS.default}
            </Text>
          </View>

          {/* Channel Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Grupo</Text>
              <Text style={styles.infoValue}>{channel.group || 'General'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>País</Text>
              <Text style={styles.infoValue}>{channel.country || 'Global'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={styles.infoValue}>En Vivo ✅</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Calidad</Text>
              <Text style={styles.infoValue}>Full HD</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.playButtonAction]}
            >
              <Text style={styles.actionButtonText}>▶️ Reproducir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.infoButtonAction]}
            >
              <Text style={styles.actionButtonText}>ℹ️ Más Info</Text>
            </TouchableOpacity>
          </View>

          {/* Close Footer */}
          <TouchableOpacity
            style={styles.closeFooterButton}
            onPress={onClose}
          >
            <Text style={styles.closeFooterText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ContentSection({ title, data, onChannelPress }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <ChannelCard channel={item} onPress={onChannelPress} />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={false}
      />
    </View>
  );
}

// ==================== MAIN APP ====================

export default function App() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [playerVisible, setPlayerVisible] = useState(false);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/tv/live-channels`);
      let data = response.data.data || response.data;
      
      if (!Array.isArray(data)) {
        data = [];
      }

      // Asignar proveedores
      const processedChannels = data.map((channel, idx) => ({
        ...channel,
        provider: ['netflix', 'amazon', 'hbo', 'disney'][idx % 4],
      }));

      setChannels(processedChannels);
    } catch (err) {
      console.error('Error cargando canales:', err.message);
      setError('Error al cargar canales');
      // Fallback datos
      setChannels([
        {
          id: 1,
          name: 'BBC',
          logo: null,
          group: 'News',
          country: 'UK',
          provider: 'netflix',
        },
        {
          id: 2,
          name: 'CNN',
          logo: null,
          group: 'News',
          country: 'US',
          provider: 'amazon',
        },
        {
          id: 3,
          name: 'ESPN',
          logo: null,
          group: 'Sports',
          country: 'US',
          provider: 'hbo',
        },
        {
          id: 4,
          name: 'HBO',
          logo: null,
          group: 'Entertainment',
          country: 'US',
          provider: 'disney',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelPress = (channel) => {
    setSelectedChannel(channel);
    setPlayerVisible(true);
  };

  const groupChannelsByProvider = () => {
    const groups = {
      netflix: [],
      amazon: [],
      hbo: [],
      disney: [],
    };

    channels.forEach((channel) => {
      if (groups[channel.provider]) {
        groups[channel.provider].push(channel);
      }
    });

    return groups;
  };

  const groupedChannels = groupChannelsByProvider();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.highlight} />
          <Text style={styles.loadingText}>Cargando canales...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Banner */}
          <HeroBanner onPlayPress={() => handleChannelPress(channels[0])} />

          {/* Canales por Proveedor */}
          {groupedChannels.netflix.length > 0 && (
            <ContentSection
              title="🎬 Netflix"
              data={groupedChannels.netflix}
              onChannelPress={handleChannelPress}
            />
          )}

          {groupedChannels.amazon.length > 0 && (
            <ContentSection
              title="📦 Amazon Prime"
              data={groupedChannels.amazon}
              onChannelPress={handleChannelPress}
            />
          )}

          {groupedChannels.hbo.length > 0 && (
            <ContentSection
              title="🎭 HBO Max"
              data={groupedChannels.hbo}
              onChannelPress={handleChannelPress}
            />
          )}

          {groupedChannels.disney.length > 0 && (
            <ContentSection
              title="✨ Disney+"
              data={groupedChannels.disney}
              onChannelPress={handleChannelPress}
            />
          )}

          {/* Pie */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2026 KeplerTV - Streaming Profesional
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Player Modal */}
      <PlayerModal
        visible={playerVisible}
        channel={selectedChannel}
        onClose={() => setPlayerVisible(false)}
      />
    </SafeAreaView>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.highlight,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.highlight,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  // Hero Banner
  heroBanner: {
    margin: 15,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.highlight,
    overflow: 'hidden',
  },
  heroContent: {
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.highlight,
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: COLORS.highlight,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 5,
  },
  playButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Sections
  section: {
    marginVertical: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },

  // Cards
  card: {
    flex: 0.48,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 15,
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageText: {
    fontSize: 48,
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  cardProvider: {
    fontSize: 11,
    color: COLORS.highlight,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  modalContent: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.highlight,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.highlight,
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },

  // Player Container
  playerContainer: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.highlight,
  },
  playerIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  playerText: {
    fontSize: 14,
    color: COLORS.text,
  },

  // Provider Badge
  providerBadge: {
    backgroundColor: COLORS.highlight,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  providerText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    width: '48%',
    backgroundColor: COLORS.accent,
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.highlight,
    fontWeight: 'bold',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonAction: {
    backgroundColor: COLORS.highlight,
  },
  infoButtonAction: {
    backgroundColor: COLORS.accent,
    borderWidth: 1,
    borderColor: COLORS.highlight,
  },
  actionButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Footer
  closeFooterButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeFooterText: {
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Main Footer
  footer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
