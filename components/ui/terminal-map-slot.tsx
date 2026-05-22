import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Palette, Radius, Spacing } from '@/constants/theme';

export type TerminalMapCoords = {
  latitude: number;
  longitude: number;
};

type TerminalMapSlotProps = {
  /** Nome curto do terminal (ex.: Terminal da Gamek). */
  titulo: string;
  /** Morada completa para pesquisa no mapa. */
  endereco: string;
  /** Coordenadas opcionais — quando existirem, abre o mapa com maior precisão. */
  coordenadas?: TerminalMapCoords;
};

function buildMapsUrl(endereco: string, coordenadas?: TerminalMapCoords): string {
  if (coordenadas) {
    const { latitude, longitude } = coordenadas;
    const label = encodeURIComponent(endereco);
    return Platform.select({
      ios: `maps:0,0?q=${label}&ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    })!;
  }

  const query = encodeURIComponent(endereco);
  return Platform.select({
    ios: `maps:0,0?q=${query}`,
    android: `geo:0,0?q=${query}`,
    default: `https://www.google.com/maps/search/?api=1&query=${query}`,
  })!;
}

/**
 * Área reservada para mapa do terminal.
 * Pré-visualização estática + ação para abrir a app de mapas do sistema.
 * Substituível por MapView (expo-maps / react-native-maps) quando houver API.
 */
export function TerminalMapSlot({ titulo, endereco, coordenadas }: TerminalMapSlotProps) {
  async function abrirMapa() {
    const url = buildMapsUrl(endereco, coordenadas);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
    await Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, pressed && styles.wrapperPressed]}
      onPress={() => void abrirMapa()}
      accessibilityRole="button"
      accessibilityLabel={`Mapa de ${titulo}. ${endereco}. Toque para abrir no mapa.`}
      accessibilityHint="Abre a aplicação de mapas do telemóvel"
    >
      <View style={styles.mapFrame}>
        <View style={styles.mapGrid}>
          <View style={[styles.mapRoad, styles.mapRoadH]} />
          <View style={[styles.mapRoad, styles.mapRoadV]} />
        </View>
        <View style={[styles.mapPin, styles.mapPinOffset1]}>
          <MaterialIcons name="place" size={14} color={Brand.primaryLight} />
        </View>
        <View style={[styles.mapPin, styles.mapPinOffset2]}>
          <MaterialIcons name="place" size={10} color="rgba(255,255,255,0.45)" />
        </View>
        <View style={styles.mapPinCenter}>
          <MaterialIcons name="place" size={22} color={Brand.primary} />
        </View>
        <View style={styles.mapOverlay}>
          <MaterialIcons name="map" size={16} color={Brand.white} />
          <Text style={styles.mapOverlayText}>Ver no mapa</Text>
        </View>
      </View>
      <Text style={styles.mapCaption} numberOfLines={2}>
        {titulo}
      </Text>
    </Pressable>
  );
}

const MAP_HEIGHT = 72;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  wrapperPressed: {
    opacity: 0.92,
  },
  mapFrame: {
    height: MAP_HEIGHT,
    borderRadius: Radius.sm,
    backgroundColor: '#1A2332',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D3A4F',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  mapRoad: {
    position: 'absolute',
    backgroundColor: '#3D4F66',
  },
  mapRoadH: {
    top: '42%',
    left: 0,
    right: 0,
    height: 3,
  },
  mapRoadV: {
    left: '38%',
    top: 0,
    bottom: 0,
    width: 3,
  },
  mapPin: {
    position: 'absolute',
  },
  mapPinOffset1: {
    top: 12,
    left: 24,
  },
  mapPinOffset2: {
    bottom: 14,
    right: 28,
  },
  mapPinCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -18,
    marginLeft: -11,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  mapOverlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.white,
  },
  mapCaption: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: Spacing.xs,
  },
});
