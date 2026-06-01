import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Platform,
} from 'react-native';
import axios from 'axios';

// Detección automática del host del backend (localhost para Expo Web / simuladores)
const API_BASE_URL = 'http://localhost:3000/api';

// Paleta de Colores Stremio Cinema Edition
const COLORS = {
  primary: '#050408', // Fondo negro absoluto cinemático
  secondary: '#0b0911', // Páneles gris morado oscuro
  accent: '#120f1e', // Tarjetas y cajas de metadatos
  highlight: '#8b5cf6', // Morado Stremio
  highlightGlow: 'rgba(139, 92, 246, 0.4)',
  pinkAccent: '#ec4899', // Rosa de acento
  text: '#ffffff',
  textSecondary: '#9ca3af', // Gris medio elegante
  border: '#1b172a', // Bordes sutiles ultra-delgados
};

// ==================== REPRODUCTOR DE STREAMING REAL HLS + EMBED CINEMA ====================

function LiveVideoPlayer({ url, logo, channelName }) {
  const [hlsReady, setHlsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  // Inyectar hls.js dinámicamente si estamos en la Web para sintonizar emisiones
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (window.Hls) {
        setHlsReady(true);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.async = true;
        script.onload = () => setHlsReady(true);
        document.head.appendChild(script);
      }
    }
  }, []);

  // Controlar la reproducción de HLS
  useEffect(() => {
    let hlsInstance = null;

    if (Platform.OS === 'web' && videoRef.current && url && (hlsReady || window.Hls)) {
      const video = videoRef.current;
      setLoading(true);

      const HlsClass = window.Hls;
      if (HlsClass && HlsClass.isSupported()) {
        hlsInstance = new HlsClass({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);

        hlsInstance.on(HlsClass.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().catch((e) => console.log('Autoplay bloqueado:', e));
        });

        hlsInstance.on(HlsClass.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Soporte nativo de Safari (iOS/macOS)
        video.src = url;
        video.addEventListener('canplay', () => {
          setLoading(false);
          video.play().catch((e) => console.log(e));
        });
      } else {
        // Fallback MP4
        video.src = url;
        video.addEventListener('canplay', () => {
          setLoading(false);
          video.play().catch((e) => console.log(e));
        });
      }
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [url, hlsReady]);

  const isEmbed = url && (url.includes('vidsrc') || url.includes('embed') || url.includes('iframe') || url.includes('yt.php') || url.includes('vidsrc.to') || url.includes('vidsrc.xyz') || url.includes('vidsrc.pm') || url.includes('vidsrc.cc') || url.includes('vidsrc.nl'));

  if (Platform.OS === 'web') {
    return (
      <View style={styles.playerContainer}>
        {isEmbed ? (
          <iframe
            src={url}
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
            allowFullScreen
            allow="autoplay; encrypted-media"
          />
        ) : (
          <>
            {loading && (
              <View style={styles.playerLoaderOverlay}>
                <ActivityIndicator size="large" color={COLORS.highlight} />
                <Text style={styles.loaderText}>Sintonizando emisión en vivo...</Text>
              </View>
            )}
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000', border: 'none' }}
              poster={logo}
            />
          </>
        )}
      </View>
    );
  }

  // Render nativo móvil (Simuladores)
  try {
    const Video = require('react-native-video').default;
    return (
      <View style={styles.playerContainer}>
        <Video
          source={{ uri: url }}
          ref={videoRef}
          style={styles.nativeVideo}
          controls={true}
          resizeMode="contain"
          onLoad={() => setLoading(false)}
          onBuffer={({ isBuffering }) => setLoading(isBuffering)}
        />
        {loading && (
          <View style={styles.playerLoaderOverlay}>
            <ActivityIndicator size="large" color={COLORS.highlight} />
          </View>
        )}
      </View>
    );
  } catch (e) {
    return (
      <View style={styles.fallbackPlayerContainer}>
        {Platform.OS === 'web' ? (
          <img
            src={logo}
            style={{ width: '50%', height: '50%', opacity: 0.15, objectFit: 'contain' }}
            alt=""
          />
        ) : (
          <Image
            source={{ uri: logo }}
            style={styles.fallbackPlayerImage}
            resizeMode="contain"
          />
        )}
        <View style={styles.fallbackPlayerOverlay}>
          <Text style={styles.fallbackPlayerIcon}>🎬</Text>
          <Text style={styles.fallbackPlayerTitle}>{channelName}</Text>
          <Text style={styles.fallbackPlayerSub}>
            Reproducción Nativa no disponible. Pruébalo en Web (http://localhost:3000) para sintonizar en vivo.
          </Text>
          <Text style={styles.fallbackPlayerUrl} numberOfLines={1}>{url}</Text>
        </View>
      </View>
    );
  }
}

// ==================== BARRA DE ESTADO / CONEXIÓN ====================

function StatusBar({ backendConnected }) {
  return (
    <View style={styles.statusBar}>
      <View style={styles.headerLogoBox}>
        <Image
          source={{ uri: 'http://localhost:3000/bulldog_logo.png' }}
          style={styles.headerBulldogLogo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.logo}>KeplerTV</Text>
          <Text style={styles.logoSubtitle}>Bulldog Pro Edition</Text>
        </View>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </View>
      <View style={styles.statusConnectionBox}>
        <View
          style={[
            styles.statusConnectionDot,
            backendConnected ? styles.dotConnected : styles.dotDisconnected,
          ]}
        />
        <Text style={styles.statusText}>
          {backendConnected ? 'Servidor Online' : 'Modo Offline'}
        </Text>
      </View>
    </View>
  );
}

// ==================== SPOTLIGHT BANNER ====================

function SpotlightBanner({ featuredItem, onPlayPress }) {
  if (!featuredItem) return null;

  return (
    <TouchableOpacity
      style={styles.heroBanner}
      onPress={onPlayPress}
      activeOpacity={0.9}
    >
      {Platform.OS === 'web' ? (
        <img
          src={featuredItem.backdrop || featuredItem.poster}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            objectFit: 'cover',
            filter: 'blur(0.5px)',
          }}
          alt=""
        />
      ) : (
        <Image
          source={{ uri: featuredItem.backdrop || featuredItem.poster }}
          style={styles.heroImageBg}
          blurRadius={0.5}
          resizeMode="cover"
        />
      )}
      <View style={styles.heroGradientOverlay} />
      <View style={styles.heroContent}>
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>DESTACADO HOY</Text>
        </View>
        <Text style={styles.heroTitle}>{featuredItem.title || featuredItem.name}</Text>
        <Text style={styles.heroSubtitle} numberOfLines={2}>
          {featuredItem.overview}
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.miniBadge}>
            <Text style={styles.miniBadgeText}>⭐ {featuredItem.rating || '8.5'}</Text>
          </View>
          <View style={styles.miniBadgeSecondary}>
            <Text style={styles.miniBadgeTextSecondary}>{featuredItem.year || '2024'}</Text>
          </View>
          <View style={[styles.miniBadgeSecondary, { backgroundColor: 'rgba(236,72,153,0.1)' }]}>
            <Text style={[styles.miniBadgeTextSecondary, { color: COLORS.pinkAccent }]}>
              {featuredItem.category || 'Película'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.playButton} onPress={onPlayPress}>
          <Text style={styles.playButtonText}>▶ Ver Ahora</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ==================== CONTENEDOR DE TARJETAS (CINE) ====================

function CatalogCard({ item, onPress }) {
  const isTV = item.category === 'TV' || !item.category;

  return (
    <TouchableOpacity
      style={[styles.card, isTV ? styles.cardLive : styles.cardPoster]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={isTV ? styles.cardImageContainerLive : styles.cardImageContainerPoster}>
        {Platform.OS === 'web' ? (
          <img
            src={item.poster || item.logo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt={item.title || item.name}
            onError={(e) => {
              e.target.src = `https://via.placeholder.com/150x225/13111c/ffffff?text=${item.title || item.name}`;
            }}
          />
        ) : (
          <Image
            source={{ uri: item.poster || item.logo }}
            style={styles.cardLogo}
            resizeMode="cover"
          />
        )}
        <View style={styles.liveCardBadge}>
          <Text style={styles.liveCardBadgeText}>
            {isTV ? (item.country || 'ES') : '1080P'}
          </Text>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title || item.name}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMetaText}>★ {item.rating || '7.5'}</Text>
          <Text style={styles.cardDot}>•</Text>
          <Text style={[styles.cardCountryText, { color: isTV ? '#10b981' : COLORS.highlight }]}>
            {isTV ? (item.genre || 'En Vivo') : (item.year || '2024')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ==================== TABS DE NAVEGACIÓN PRINCIPAL ====================

function StremioTabs({ activeTab, onTabSelect }) {
  const tabs = [
    { id: 'all', label: 'Todo', icon: '🏠' },
    { id: 'movies', label: 'Películas', icon: '🎬' },
    { id: 'series', label: 'Series', icon: '📺' },
    { id: 'tv', label: 'TV en Vivo', icon: '📡' },
  ];

  return (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            onPress={() => onTabSelect(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ==================== TABS DE SUB-FILTROS DE GÉNERO Y PAÍSES ====================

function StremioGenreTabs({ activeTab, activeGenre, onGenreSelect, activeCountry, onCountrySelect }) {
  if (activeTab === 'all') return null;

  const genres = activeTab === 'tv'
    ? [
      { id: 'all', label: 'Todos 🏠' },
      { id: 'Deportes', label: '⚽ Deportes' },
      { id: 'Noticias', label: '📰 Noticias' },
      { id: 'Documental', label: '🌎 Documental' },
      { id: 'Entretenimiento', label: '🎭 Entretenimiento' },
      { id: 'Música', label: '🎵 Música' }
    ]
    : activeTab === 'movies'
      ? [
        { id: 'all', label: 'Todos 🎬' },
        { id: 'Acción', label: '💥 Acción' },
        { id: 'Ciencia Ficción', label: '🚀 Ciencia Ficción' },
        { id: 'Drama', label: '🎭 Drama' },
        { id: 'Aventura', label: '🗺️ Aventura' },
        { id: 'Animación', label: '👾 Animación' },
        { id: 'Comedia', label: '😂 Comedia' },
        { id: 'Suspenso', label: '🕵️ Suspenso' }
      ]
      : [ // series
        { id: 'all', label: 'Todos 📺' },
        { id: 'Drama', label: '🎭 Drama' },
        { id: 'Ciencia Ficción', label: '🚀 Ciencia Ficción' },
        { id: 'Fantasía', label: '🧙 Fantasía' },
        { id: 'Misterio', label: '🔍 Misterio' },
        { id: 'Crimen', label: '🚨 Crimen' }
      ];

  const countries = [
    { id: 'all', label: 'Todos los Países' },
    { id: 'España', label: 'España 🇪🇸' },
    { id: 'Argentina', label: 'Argentina 🇦🇷' },
    { id: 'México', label: 'México 🇲🇽' },
    { id: 'EE.UU.', label: 'EE.UU. 🇺🇸' },
    { id: 'Internacional', label: 'Internacional 🌐' }
  ];

  return (
    <View style={styles.subFilterContainer}>
      <View style={styles.subFilterRow}>
        <Text style={styles.subFilterTitle}>Género:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterList}>
          {genres.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.subFilterButton, activeGenre === g.id && styles.subFilterButtonActive]}
              onPress={() => onGenreSelect(g.id)}
            >
              <Text style={[styles.subFilterLabel, activeGenre === g.id && styles.subFilterLabelActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {activeTab === 'tv' && (
        <View style={[styles.subFilterRow, { marginTop: 10 }]}>
          <Text style={styles.subFilterTitle}>País:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterList}>
            {countries.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.subFilterButton, activeCountry === c.id && styles.subFilterButtonActive]}
                onPress={() => onCountrySelect(c.id)}
              >
                <Text style={[styles.subFilterLabel, activeCountry === c.id && styles.subFilterLabelActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ==================== ESTANTE HORIZONTAL ====================

function CatalogShelf({ title, data, onCardPress }) {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.shelfContainer}>
      <Text style={styles.shelfTitle}>{title}</Text>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelfList}
      >
        {data.map((item) => (
          <CatalogCard key={item.id} item={item} onPress={onCardPress} />
        ))}
      </ScrollView>
    </View>
  );
}

// ==================== REJILLA DE CATÁLOGO (GRID) ====================

function CatalogGrid({ title, data, onCardPress }) {
  return (
    <View style={styles.gridContainer}>
      <Text style={styles.shelfTitle}>{title}</Text>
      {data.length === 0 ? (
        <View style={styles.noContentBox}>
          <Text style={styles.noContentText}>Ningún canal o película coincide con los filtros actuales.</Text>
        </View>
      ) : (
        <View style={styles.gridList}>
          {data.map((item) => (
            <CatalogCard key={item.id} item={item} onPress={onCardPress} />
          ))}
        </View>
      )}
    </View>
  );
}

// ==================== DETALLES MODAL CINEMA ====================

function StremioDetailModal({ visible, item, onClose }) {
  if (!item) return null;
  const isTV = item.category === 'TV' || !item.category;
  const isSerie = item.category === 'Serie';

  const [activeUrl, setActiveUrl] = useState('');
  const [activeServerName, setActiveServerName] = useState('');
  const [streams, setStreams] = useState([]);
  const [streamsLoading, setStreamsLoading] = useState(false);

  // === FASE 3: Series - Temporadas y Episodios ===
  const [seriesDetail, setSeriesDetail] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);

  // Cargar detalles de la serie y temporadas al abrir
  useEffect(() => {
    if (!item || !visible) return;

    if (isSerie) {
      setSeriesLoading(true);
      // Cargar detalles de la serie (temporadas)
      axios.get(`${API_BASE_URL}/series/${item.id}`)
        .then(res => {
          const data = res.data.data || res.data;
          setSeriesDetail(data);
          // Seleccionar primera temporada por defecto
          if (data.seasons && data.seasons.length > 0) {
            const firstSeason = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
            setSelectedSeason(firstSeason.season_number);
          }
          setSeriesLoading(false);
        })
        .catch(() => setSeriesLoading(false));
    }
  }, [item, visible]);

  // Cargar episodios cuando cambia la temporada
  useEffect(() => {
    if (!item || !isSerie || !visible) return;

    setEpisodes([]);
    setSelectedEpisode(1);

    axios.get(`${API_BASE_URL}/series/${item.id}/season/${selectedSeason}`)
      .then(res => {
        const data = res.data.data || res.data;
        if (data.episodes) {
          setEpisodes(data.episodes);
          if (data.episodes.length > 0) {
            setSelectedEpisode(data.episodes[0].episode_number);
          }
        }
      })
      .catch(() => { });
  }, [item, selectedSeason, visible]);

  // Cargar streams dinámicos desde la API
  useEffect(() => {
    if (!item || !visible) return;

    setStreams([]);
    setStreamsLoading(true);

    if (isTV) {
      setActiveUrl(item.url || item.video_url);
      setActiveServerName('HLS Directo');
      setStreamsLoading(false);
    } else if (isSerie) {
      // Cargar streams para el episodio seleccionado
      axios.get(`${API_BASE_URL}/stream/tv/${item.id}/${selectedSeason}/${selectedEpisode}`)
        .then(res => {
          const data = res.data;
          if (data.success && data.streams) {
            setStreams(data.streams);
            // Auto-seleccionar el primer stream vivo
            const alive = data.streams.find(s => s.alive);
            if (alive) {
              setActiveUrl(alive.url);
              setActiveServerName(alive.server);
            } else if (data.streams.length > 0) {
              setActiveUrl(data.streams[0].url);
              setActiveServerName(data.streams[0].server);
            }
          }
          setStreamsLoading(false);
        })
        .catch(() => setStreamsLoading(false));
    } else {
      // Película - cargar streams
      axios.get(`${API_BASE_URL}/stream/movie/${item.id}`)
        .then(res => {
          const data = res.data;
          if (data.success && data.streams) {
            setStreams(data.streams);
            const alive = data.streams.find(s => s.alive);
            if (alive) {
              setActiveUrl(alive.url);
              setActiveServerName(alive.server);
            } else if (data.streams.length > 0) {
              setActiveUrl(data.streams[0].url);
              setActiveServerName(data.streams[0].server);
            }
          }
          setStreamsLoading(false);
        })
        .catch(() => setStreamsLoading(false));
    }
  }, [item, visible, selectedSeason, selectedEpisode]);

  const selectServer = (server) => {
    setActiveServerName(server.server);
    setActiveUrl(server.url);
  };

  // Obtener nombre de temporada
  const getSeasonName = (season) => {
    if (!season) return 'Temporada';
    if (season.name) return season.name;
    return `Temporada ${season.season_number}`;
  };

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
            <View style={styles.modalHeaderTitleBox}>
              {Platform.OS === 'web' ? (
                <img
                  src={item.poster || item.logo}
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 6,
                    backgroundColor: '#13111c',
                    objectFit: 'cover',
                  }}
                  alt=""
                />
              ) : (
                <Image source={{ uri: item.poster || item.logo }} style={styles.modalHeaderLogo} resizeMode="cover" />
              )}
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {item.title || item.name}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isTV
                    ? `TV EN VIVO • ${item.country || 'ESPAÑA'}`
                    : isSerie
                      ? `${item.category} • ${item.year} • Temporada ${selectedSeason}`
                      : `${item.category} • ${item.year}`
                  }
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Reproductor de Video HLS + Iframe Cinemático */}
          <LiveVideoPlayer
            url={activeUrl}
            logo={item.poster || item.logo}
            channelName={item.title || item.name}
          />

          {/* Ficha Técnica Stremio */}
          <ScrollView style={styles.modalDetailsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.metaRow}>
              <View style={styles.miniBadge}>
                <Text style={styles.miniBadgeText}>★ {item.rating || '8.2'}</Text>
              </View>
              <View style={styles.miniBadgeSecondary}>
                <Text style={styles.miniBadgeTextSecondary}>Full HD</Text>
              </View>
              {item.genres && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 5 }}>
                  {item.genres.map((g, idx) => (
                    <View key={idx} style={[styles.miniBadgeSecondary, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                      <Text style={[styles.miniBadgeTextSecondary, { color: COLORS.highlight }]}>{g}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <Text style={styles.plotLabel}>Sinopsis</Text>
            <Text style={styles.plotText}>
              {item.overview || `Emisión oficial y en vivo del canal ${item.title || item.name} para todo el mundo en alta definición.`}
            </Text>

            {/* === FASE 3: Selector de Temporadas y Episodios (Solo Series) === */}
            {isSerie && (
              <>
                {/* Selector de Temporada */}
                {seriesDetail && seriesDetail.seasons && seriesDetail.seasons.filter(s => s.season_number > 0).length > 0 && (
                  <View style={styles.serversSection}>
                    <Text style={styles.plotLabel}>Temporadas</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                      {seriesDetail.seasons
                        .filter(s => s.season_number > 0)
                        .map(season => (
                          <TouchableOpacity
                            key={season.season_number}
                            style={[
                              styles.subFilterButton,
                              selectedSeason === season.season_number && styles.subFilterButtonActive,
                              { marginRight: 8 }
                            ]}
                            onPress={() => setSelectedSeason(season.season_number)}
                          >
                            <Text style={[
                              styles.subFilterLabel,
                              selectedSeason === season.season_number && { color: '#fff' }
                            ]}>
                              {getSeasonName(season)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                )}

                {/* Selector de Episodios */}
                {episodes.length > 0 && (
                  <View style={styles.serversSection}>
                    <Text style={styles.plotLabel}>Episodios</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {episodes.map(ep => (
                        <TouchableOpacity
                          key={ep.episode_number}
                          style={[
                            styles.serverButton,
                            selectedEpisode === ep.episode_number && styles.serverButtonActive,
                            { width: '48%', paddingVertical: 10 }
                          ]}
                          onPress={() => setSelectedEpisode(ep.episode_number)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.serverTitleText} numberOfLines={1}>
                              {ep.episode_number}. {ep.name || `Episodio ${ep.episode_number}`}
                            </Text>
                            {ep.runtime && (
                              <Text style={styles.serverSubText}>{ep.runtime} min</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Selector de Servidores Dinámicos desde la API */}
            <View style={styles.serversSection}>
              <Text style={styles.plotLabel}>
                {isTV ? 'Transmisión en Vivo' : 'Servidores de Streaming'}
                {streamsLoading && ' 🔄'}
              </Text>

              {isTV ? (
                <View style={{ gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.serverButton, activeServerName === 'HLS Directo' && styles.serverButtonActive]}
                    onPress={() => {
                      setActiveUrl(item.url || item.video_url);
                      setActiveServerName('HLS Directo');
                    }}
                  >
                    <Text style={styles.serverIconText}>⚡</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.serverTitleText}>Señal Directa HLS</Text>
                      <Text style={styles.serverSubText}>Transmisión directa sin intermediarios</Text>
                    </View>
                    <Text style={styles.serverActiveBadge}>1080p</Text>
                  </TouchableOpacity>
                </View>
              ) : streamsLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={COLORS.highlight} />
                  <Text style={{ color: COLORS.textSecondary, marginTop: 8, fontSize: 13 }}>
                    Buscando servidores disponibles...
                  </Text>
                </View>
              ) : streams.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {streams.map((s, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.serverButton,
                        activeServerName === s.server && styles.serverButtonActive,
                        !s.alive && { opacity: 0.4 }
                      ]}
                      onPress={() => s.alive && selectServer(s)}
                      disabled={!s.alive}
                    >
                      <Text style={styles.serverIconText}>{s.icon || '🎬'}</Text>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.serverTitleText}>
                          {s.server}
                          {s.alive ? '' : ' (Caído)'}
                        </Text>
                        <Text style={styles.serverSubText}>
                          {s.lang || 'Español'} • {s.source || 'embed'}
                        </Text>
                      </View>
                      <Text style={[
                        styles.serverActiveBadge,
                        {
                          color: s.alive ? (s.quality === 'FHD' ? '#00cec9' : COLORS.highlight) : COLORS.textSecondary,
                          borderColor: s.alive ? (s.quality === 'FHD' ? '#00cec9' : COLORS.highlight) : COLORS.textSecondary
                        }
                      ]}>
                        {s.badge || s.quality || 'HD'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                    No se encontraron servidores disponibles
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeModalText}>Cerrar Cinema</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ==================== CÓDIGO PRINCIPAL ====================

export default function App() {
  const [channels, setChannels] = useState([]);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [activeGenre, setActiveGenre] = useState('all');
  const [activeCountry, setActiveCountry] = useState('all');

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    setActiveGenre('all');
    setActiveCountry('all');
  }, [activeTab]);

  const loadCatalog = async () => {
    try {
      setLoading(true);

      // 1. Cargar canales en vivo
      const resChannels = await axios.get(`${API_BASE_URL}/tv/live-channels`);
      const dataChannels = resChannels.data.data || resChannels.data;
      if (Array.isArray(dataChannels)) {
        setChannels(dataChannels.map(ch => ({ ...ch, category: 'TV' })));
      }

      // 2. Cargar Películas populares (Fallback en español ya implementado)
      const resMovies = await axios.get(`${API_BASE_URL}/movies/popular`);
      const dataMovies = resMovies.data.data || resMovies.data;
      if (Array.isArray(dataMovies)) {
        setMovies(dataMovies);
      }

      // 3. Cargar Series populares (Fallback en español ya implementado)
      const resSeries = await axios.get(`${API_BASE_URL}/series/popular`);
      const dataSeries = resSeries.data.data || resSeries.data;
      if (Array.isArray(dataSeries)) {
        setSeries(dataSeries);
      }

      setBackendConnected(true);
    } catch (err) {
      console.warn('Error sintonizando API, cargando catálogo local offline:', err.message);
      setBackendConnected(false);

      // Base de Datos local masiva de Fallback idéntica a la del backend
      setChannels([
        { id: 1, name: 'NASA TV', logo: 'https://i.imgur.com/ECPgLf6.png', group: 'Documentary', genre: 'Documental', country: 'EE.UU.', url: 'https://ntv1.akamaized.net/hls/live/2014027/NASA-NTV1-HLS/master.m3u8', category: 'TV' },
        { id: 2, name: 'RTVE 24 Horas', logo: 'https://i.ibb.co/21sXZ3GT/24h.png', group: 'News', genre: 'Noticias', country: 'España', url: 'https://rtvesp-cpro.rtve.es/24h_g_main_cpro/24h_g_main_cpro.m3u8', category: 'TV' },
        { id: 3, name: 'France 24 Español', logo: 'https://i.imgur.com/u8N6uoj.png', group: 'News', genre: 'Noticias', country: 'Internacional', url: 'https://static.france24.com/live/F24_ES_LO_HLS/live_tv.m3u8', category: 'TV' },
        { id: 4, name: 'DW Español', logo: 'https://i.imgur.com/8MRNFb9.png', group: 'Documentary', genre: 'Documental', country: 'Internacional', url: 'https://dwamdstream104.akamaized.net/hls/live/2014187/dwstream104/index.m3u8', category: 'TV' },
        { id: 5, name: 'Red Bull TV', logo: 'https://i.postimg.cc/8c78JM28/image.png', group: 'Sports', genre: 'Deportes', country: 'Internacional', url: 'https://rbmn-live.akamaized.net/hls/live/590964/sports/index.m3u8', category: 'TV' },
        { id: 6, name: 'KBS World', logo: 'https://i.imgur.com/7DqgELX.png', group: 'Entertainment', genre: 'Entretenimiento', country: 'Internacional', url: 'https://kbsworld-iptv.akamaized.net/hls/live/2002223/kbsworld/index.m3u8', category: 'TV' },
        { id: 7, name: 'Al Jazeera English', logo: 'https://i.imgur.com/7bRVpnu.png', group: 'News', genre: 'Noticias', country: 'Internacional', url: 'https://live-amg-el.akamaized.net/hls/live/2032338/aljazeera/index.m3u8', category: 'TV' },
        { id: 8, name: 'Euronews Español', logo: 'https://i.imgur.com/8t9mdg9.png', group: 'News', genre: 'Noticias', country: 'Internacional', url: 'https://euronews-es-dw.5centscdn.com/hls/live.m3u8', category: 'TV' },
        { id: 9, name: 'RTVE La 1', logo: 'https://i.imgur.com/K3fV2x0.png', group: 'Entertainment', genre: 'Entretenimiento', country: 'España', url: 'https://rtvesp-cpro.rtve.es/la1_g_main_cpro/la1_g_main_cpro.m3u8', category: 'TV' },
        { id: 10, name: 'Canal 26 Argentina', logo: 'https://i.imgur.com/yFjY60y.png', group: 'News', genre: 'Noticias', country: 'Argentina', url: 'https://live-edge01.telecentro.net.ar/live/26hd-c30/playlist.m3u8', category: 'TV' },
        { id: 11, name: 'Milenio TV', logo: 'https://i.imgur.com/QhS6M6V.png', group: 'News', genre: 'Noticias', country: 'México', url: 'https://milenio-live.simplestreaming.com/live/channels/milenio/playlist.m3u8', category: 'TV' },
        { id: 14, name: 'El Trece Argentina', logo: 'https://i.imgur.com/Z4w2aCj.png', group: 'Entertainment', genre: 'Entretenimiento', country: 'Argentina', url: 'https://live-edge01.telecentro.net.ar/live/13hd-c30/playlist.m3u8', category: 'TV' },
        { id: 15, name: 'Telefe Argentina', logo: 'https://i.imgur.com/PZcZ80x.png', group: 'Entertainment', genre: 'Entretenimiento', country: 'Argentina', url: 'https://live-edge01.telecentro.net.ar/live/telefehd-c30/playlist.m3u8', category: 'TV' },
        { id: 19, name: 'Clubbing TV', logo: 'https://i.imgur.com/wVfI7pC.png', group: 'Music', genre: 'Música', country: 'Internacional', url: 'https://clubbingtv.amagi.tv/playlist.m3u8', category: 'TV' }
      ]);

      setMovies([
        { id: 693134, title: 'Dune: Parte Dos', poster: 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/uhUO7vQQKvCTfQWubOt5MAKokbL.jpg', year: '2024', rating: 8.7, genres: ['Ciencia Ficción', 'Aventura', 'Acción'], overview: 'Paul Atreides se une a Chani y a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.', url: 'https://vidsrc.to/embed/movie/693134', category: 'Película' },
        { id: 569094, title: 'Spider-Man: Multiverso', poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/uhUO7vQQKvCTfQWubOt5MAKokbL.jpg', year: '2023', rating: 8.9, genres: ['Animación', 'Acción', 'Aventura'], overview: 'Miles Morales es catapultado a través del Multiverso, donde se encuentra con una Sociedad de Arañas encargada de proteger la existencia misma.', url: 'https://vidsrc.to/embed/movie/569094', category: 'Película' },
        { id: 122, title: 'El Señor de los Anillos: Retorno', poster: 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/uhUO7vQQKvCTfQWubOt5MAKokbL.jpg', year: '2003', rating: 9.0, genres: ['Fantasía', 'Aventura', 'Acción'], overview: 'Ha llegado el momento de decidir el destino de la Tierra Media, y por primera vez en mucho tiempo, parece que hay una pequeña esperanza.', url: 'https://vidsrc.to/embed/movie/122', category: 'Película' },
        { id: 533535, title: 'Deadpool & Wolverine', poster: 'https://image.tmdb.org/t/p/w500/8cdWv65xpTMqJ6t6F426STwUz6g.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/yD11BMVvnSup7CwO1jPI8Z13J1x.jpg', year: '2024', rating: 8.5, genres: ['Acción', 'Comedia', 'Aventura'], overview: 'Wade Wilson y Wolverine unen fuerzas para derrotar una amenaza en común.', url: 'https://vidsrc.to/embed/movie/533535', category: 'Película' },
        { id: 1022789, title: 'Intensa-Mente 2', poster: 'https://image.tmdb.org/t/p/w500/xVKN697K52Xn4n6yXzUqg32qZ5B.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/stKG83n5nQ9o764X1s9Id7PuzeR.jpg', year: '2024', rating: 8.6, genres: ['Animación', 'Familia', 'Aventura', 'Comedia'], overview: '¡Riley entra en la adolescencia y el cuartel general sufre una reforma para nuevas emociones!', url: 'https://vidsrc.to/embed/movie/1022789', category: 'Película' }
      ]);

      setSeries([
        { id: 1396, title: 'Breaking Bad', poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg', year: '2008', rating: 9.5, genres: ['Drama', 'Crimen'], overview: 'Un profesor de química diagnosticado con cáncer terminal comienza a cocinar metanfetamina para asegurar el futuro financiero de su familia.', url: 'https://vidsrc.to/embed/tv/1396/1/1', category: 'Serie' },
        { id: 1399, title: 'Juego de Tronos', poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg', year: '2011', rating: 9.2, genres: ['Fantasía', 'Drama', 'Acción'], overview: 'Nueve familias nobles luchan por el control de las tierras míticas de Poniente.', url: 'https://vidsrc.to/embed/tv/1399/1/1', category: 'Serie' },
        { id: 66732, title: 'Stranger Things', poster: 'https://image.tmdb.org/t/p/w500/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg', backdrop: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg', year: '2016', rating: 8.7, genres: ['Ciencia Ficción', 'Misterio', 'Drama'], overview: 'La misteriosa desaparición de un niño desata eventos sobrenaturales increíbles en Hawkins.', url: 'https://vidsrc.to/embed/tv/66732/1/1', category: 'Serie' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (item) => {
    setSelectedItem(item);
    setPlayerVisible(true);
  };

  // Determinar ítem destacado para el banner
  const featuredItem = movies.length > 0 ? movies[0] : (channels.length > 0 ? channels[0] : null);

  // FILTRADO EN TIEMPO REAL
  const filteredChannels = channels.filter((ch) => {
    const matchGenre = activeGenre === 'all' || ch.genre === activeGenre || (ch.genres && ch.genres.includes(activeGenre));
    const matchCountry = activeCountry === 'all' || ch.country === activeCountry;
    return matchGenre && matchCountry;
  });

  const filteredMovies = movies.filter((m) => {
    return activeGenre === 'all' || (m.genres && m.genres.includes(activeGenre));
  });

  const filteredSeries = series.filter((s) => {
    return activeGenre === 'all' || (s.genres && s.genres.includes(activeGenre));
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backendConnected={backendConnected} />

      {/* Selector de Categorías tipo Stremio Menu */}
      <StremioTabs activeTab={activeTab} onTabSelect={setActiveTab} />

      {/* Sub-Filtros de Género y País (Muestra dinámicamente según tab activo) */}
      <StremioGenreTabs
        activeTab={activeTab}
        activeGenre={activeGenre}
        onGenreSelect={setActiveGenre}
        activeCountry={activeCountry}
        onCountrySelect={setActiveCountry}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.highlight} />
          <Text style={styles.loadingText}>Conectando a los servidores de KeplerTV...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        >
          {/* Spotlight Hero Banner */}
          {activeTab === 'all' && featuredItem && (
            <SpotlightBanner
              featuredItem={featuredItem}
              onPlayPress={() => handleCardPress(featuredItem)}
            />
          )}

          {/* Shelves Horizontales de Catálogo (Cuando está en pestaña "Todo") */}
          {activeTab === 'all' && (
            <>
              <CatalogShelf
                title="📡 TV en Vivo Recomendada"
                data={channels}
                onCardPress={handleCardPress}
              />
              <CatalogShelf
                title="🎬 Películas de Cartelera y del Momento"
                data={movies}
                onCardPress={handleCardPress}
              />
              <CatalogShelf
                title="📺 Series de TV Destacadas"
                data={series}
                onCardPress={handleCardPress}
              />
            </>
          )}

          {/* Rejillas de Catálogo Filtradas en Tiempo Real (Cuando está en una pestaña específica) */}
          {activeTab === 'tv' && (
            <CatalogGrid
              title="📡 Todos los Canales de TV"
              data={filteredChannels}
              onCardPress={handleCardPress}
            />
          )}

          {activeTab === 'movies' && (
            <CatalogGrid
              title="🎬 Todas las Películas"
              data={filteredMovies}
              onCardPress={handleCardPress}
            />
          )}

          {activeTab === 'series' && (
            <CatalogGrid
              title="📺 Todas las Series de TV"
              data={filteredSeries}
              onCardPress={handleCardPress}
            />
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              KeplerTV Cinema Stremio Edition © 2026
            </Text>
            <Text style={styles.footerSub}>
              Habilitado con soporte de reproducción HLS adaptativo y metadatos integrados cinemáticos.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Modal Cinema de Detalles y Reproductor */}
      <StremioDetailModal
        visible={playerVisible}
        item={selectedItem}
        onClose={() => setPlayerVisible(false)}
      />
    </SafeAreaView>
  );
}

// ==================== HOJA DE ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    backgroundColor: COLORS.primary,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBulldogLogo: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.highlight,
  },
  logo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: -2,
  },
  proBadge: {
    backgroundColor: COLORS.highlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 10,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusConnectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  statusConnectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnected: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  dotDisconnected: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Tabs de Stremio
  tabContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: COLORS.highlight,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#fff',
  },

  // Sub-Filtros de Géneros y Países
  subFilterContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subFilterTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.highlight,
    marginRight: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 60,
  },
  subFilterList: {
    gap: 8,
  },
  subFilterButton: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subFilterButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: COLORS.highlight,
  },
  subFilterLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  subFilterLabelActive: {
    color: '#fff',
  },

  // Spotlight Hero Banner
  heroBanner: {
    margin: 15,
    borderRadius: 16,
    overflow: 'hidden',
    height: 350,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  heroImageBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  heroGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 4, 8, 0.85)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    justifyContent: 'flex-end',
  },
  featuredBadge: {
    backgroundColor: COLORS.highlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  miniBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  miniBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
  },
  miniBadgeSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  miniBadgeTextSecondary: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  playButton: {
    backgroundColor: COLORS.highlight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    alignSelf: 'flex-start',
    shadowColor: COLORS.highlight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Shelves horizontales
  shelfContainer: {
    marginVertical: 15,
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    paddingHorizontal: 15,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  shelfList: {
    paddingHorizontal: 15,
    gap: 15,
  },

  // Cards de catálogo (Cine)
  card: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardLive: {
    width: 140,
  },
  cardPoster: {
    width: 130,
  },
  cardImageContainerLive: {
    width: 138,
    height: 90,
    backgroundColor: '#050407',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardImageContainerPoster: {
    width: 128,
    height: 180,
    backgroundColor: '#050407',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  gridContainer: {
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'flex-start',
  },
  cardLogo: {
    width: '100%',
    height: '100%',
  },
  liveCardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.highlight,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  liveCardBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 10,
    color: '#fbbf24',
    fontWeight: '800',
  },
  cardDot: {
    fontSize: 10,
    color: COLORS.border,
  },
  cardCountryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  noContentBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noContentText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },

  // Modal Cinema Details
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  modalContent: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderLogo: {
    width: 45,
    height: 45,
    borderRadius: 6,
    backgroundColor: '#050407',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.highlight,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 22,
    color: COLORS.textSecondary,
  },

  // Player de Video
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  playerLoaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },

  // Fallback del Player
  fallbackPlayerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#050407',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  fallbackPlayerImage: {
    width: '50%',
    height: '50%',
    opacity: 0.15,
  },
  fallbackPlayerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackPlayerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  fallbackPlayerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  fallbackPlayerSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 10,
  },
  fallbackPlayerUrl: {
    color: COLORS.highlight,
    fontSize: 9,
  },

  // Ficha modal de metadatos
  modalDetailsScroll: {
    flex: 1,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  plotLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.highlight,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  plotText: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
    marginBottom: 16,
  },
  serversSection: {
    marginTop: 10,
  },
  serverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  serverButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: COLORS.highlight,
  },
  serverIconText: {
    fontSize: 18,
    color: COLORS.highlight,
  },
  serverTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  serverSubText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  serverActiveBadge: {
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#fff',
    borderWidth: 0.5,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Botón cerrar modal
  closeModalButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },

  // Footer
  footer: {
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 20,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  footerSub: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
