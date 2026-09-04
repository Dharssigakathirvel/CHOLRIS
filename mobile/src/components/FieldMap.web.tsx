/**
 * Web Field Map Component (Expo Web)
 * ===================================
 * Web-compatible field location component.
 * DOES NOT import react-native-maps to prevent codegenNativeComponent errors.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.webMapFrame}>
      <View style={styles.gridPattern}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapTitle}>FIELD LOCATION & MAP</Text>
        <Text style={styles.coordsText}>
          📍 Lat: {latitude.toFixed(4)}° | Lon: {longitude.toFixed(4)}°
        </Text>
        <View style={styles.webBadge}>
          <Text style={styles.webBadgeText}>
            {deviceId} ({field01MarkerLabel}) • Interactive GPS map enabled in Mobile App (Android/iOS)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapFrame: {
    height: 180,
    width: '100%',
    backgroundColor: '#EBF3EC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E0E7E1',
  },
  gridPattern: {
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  mapTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#173B27',
    letterSpacing: 1.2,
  },
  coordsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F6B45',
    marginTop: 4,
  },
  webBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C5DCC9',
  },
  webBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#49524B',
  },
});
