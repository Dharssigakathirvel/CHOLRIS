/**
 * Native Field Map Component (Android & iOS)
 * ===========================================
 * Imports and renders the real interactive map via react-native-maps.
 * This file is only resolved and bundled by Metro for native platforms.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export interface FieldMapProps {
  latitude: number;
  longitude: number;
  deviceId: string;
  field01MarkerLabel: string;
}

export default function FieldMap({
  latitude,
  longitude,
  deviceId,
  field01MarkerLabel,
}: FieldMapProps) {
  return (
    <View style={styles.mapFrame}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={deviceId}
          description={field01MarkerLabel}
        />
      </MapView>

      <View style={styles.mapBadge}>
        <Text style={styles.mapBadgeText}>📍 {deviceId} ({field01MarkerLabel})</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapFrame: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  mapBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7E1',
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#173B27',
  },
});
