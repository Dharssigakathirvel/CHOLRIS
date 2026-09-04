import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { API_ENDPOINTS } from '../constants/api';
import { router } from 'expo-router';

// ---------------------------------------------------------------------------
// Types — mirror the /api/decisions response shape
// ---------------------------------------------------------------------------

interface SensorValues {
  moisture: number;
  temperature: number;
  humidity: number;
  ec: number;
  light: number;
  rain: number;
}

interface Indices {
  IDI: number;
  ERI: number;
  SNI: number;
  CVI: number;
}

interface Recommendation {
  cropHealth: string;
  irrigationNeeded: boolean;
  primaryAction: string;
  primaryActionTamil: string;
  environmentalRisk: string;
  cropVulnerability: string;
}

interface Meta {
  engineVersion: string;
  inputsAvailable: string[];
  inputsMissing: string[];
}

interface DecisionResponse {
  deviceId: string;
  timestamp: string;
  sensors: SensorValues;
  indices: Indices;
  recommendation: Recommendation;
  meta: Meta;
}

// ---------------------------------------------------------------------------
// Admin Dashboard
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const [data, setData] = useState<DecisionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    console.log('[Admin] Fetching /api/decisions ...');

    fetch(API_ENDPOINTS.decisions)
      .then((response) => {
        console.log('[Admin] Response status:', response.status);
        return response.json();
      })
      .then((json: DecisionResponse) => {
        console.log('[Admin] Decision data received:', json);
        setData(json);
        setLoading(false);
      })
      .catch((error) => {
        console.log('[Admin] /api/decisions error:', error);
        setFetchError(true);
        setLoading(false);
      });
  }, []);

  // Safe defaults while loading or if fetch failed
  const sensors: SensorValues = data?.sensors ?? {
    moisture: 0, temperature: 0, humidity: 0, ec: 0, light: 0, rain: 0,
  };
  const indices: Indices = data?.indices ?? {
    IDI: 0, ERI: 0, SNI: 0, CVI: 0,
  };
  const engineVersion = data?.meta?.engineVersion ?? '—';
  const inputsMissing = data?.meta?.inputsMissing ?? [];

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.smallText}>CHLORIS • ADMIN</Text>
          <Text style={styles.title}>System Dashboard</Text>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* System Status */}
      <View style={styles.systemCard}>
        <View>
          <Text style={styles.cardLabel}>SYSTEM STATUS</Text>
          <Text style={styles.systemTitle}>
            {loading ? 'Connecting…' : fetchError ? 'Backend Unreachable' : 'All Systems Operational'}
          </Text>
        </View>

        <View style={[styles.onlineBadge, fetchError && styles.offlineBadge]}>
          <View style={[styles.greenDot, fetchError && styles.redDot]} />
          <Text style={[styles.onlineText, fetchError && styles.offlineText]}>
            {loading ? 'LOADING' : fetchError ? 'OFFLINE' : 'ONLINE'}
          </Text>
        </View>
      </View>

      {/* Live Sensor Data */}
      <Text style={styles.sectionTitle}>Live Sensor Data</Text>

      <View style={styles.grid}>
        <SensorCard
          label="SOIL MOISTURE"
          value={sensors.moisture.toString()}
          unit="%"
        />

        <SensorCard
          label="TEMPERATURE"
          value={sensors.temperature.toString()}
          unit="°C"
        />

        <SensorCard
          label="HUMIDITY"
          value={sensors.humidity.toString()}
          unit="%"
        />

        <SensorCard
          label="SOIL EC"
          value={sensors.ec.toString()}
          unit="mS/cm"
        />

        <SensorCard
          label="LIGHT"
          value={sensors.light.toString()}
          unit="lux"
        />

        <SensorCard
          label="RAIN"
          value={sensors.rain.toString()}
          unit="mm"
        />
      </View>

      {/* Decision Indices — Phase 2 computed values */}
      <Text style={styles.sectionTitle}>Decision Indices</Text>

      {/* Engine version badge */}
      {!loading && !fetchError && (
        <View style={styles.engineBadge}>
          <Text style={styles.engineBadgeText}>
            Engine: {engineVersion}
            {inputsMissing.length > 0
              ? `  •  Missing: ${inputsMissing.join(', ')}`
              : ''}
          </Text>
        </View>
      )}

      <View style={styles.indexCard}>
        <IndexRow
          name="IDI"
          fullName="Irrigation Decision Index"
          value={loading ? '—' : indices.IDI.toFixed(3)}
        />

        <IndexRow
          name="ERI"
          fullName="Environmental Risk Index"
          value={loading ? '—' : indices.ERI.toFixed(3)}
        />

        <IndexRow
          name="SNI"
          fullName="Soil Nutrition Index"
          value={loading ? '—' : indices.SNI.toFixed(3)}
        />

        <IndexRow
          name="CVI"
          fullName="Crop Vulnerability Index"
          value={loading ? '—' : indices.CVI.toFixed(3)}
        />
      </View>

      {/* AI Analysis — Phase 2: sensor-based interpretation only */}
      <Text style={styles.sectionTitle}>AI Crop Analysis</Text>

      <View style={styles.analysisCard}>
        <AnalysisRow
          title="Crop Health"
          value={loading ? '—' : data?.recommendation.cropHealth ?? '—'}
        />

        <AnalysisRow
          title="Irrigation"
          value={loading ? '—' : data?.recommendation.irrigationNeeded ? 'REQUIRED' : 'NOT NEEDED'}
        />

        <AnalysisRow
          title="Environmental Risk"
          value={loading ? '—' : data?.recommendation.environmentalRisk ?? '—'}
        />

        <AnalysisRow
          title="Crop Conditions"
          value={loading ? '—' : data?.recommendation.cropVulnerability ?? '—'}
        />
      </View>

      {/* Field Information */}
      <Text style={styles.sectionTitle}>Field Information</Text>

      <View style={styles.fieldCard}>
        <Text style={styles.cardLabel}>ACTIVE FIELD</Text>

        <Text style={styles.fieldName}>
          My Field • {data?.deviceId || 'FIELD01'}
        </Text>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Device</Text>
          <Text style={styles.fieldValue}>ESP32</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Edge Processor</Text>
          <Text style={styles.fieldValue}>Raspberry Pi</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Connection</Text>
          <Text style={styles.fieldValue}>
            {fetchError ? 'Disconnected' : 'Connected'}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Engine Version</Text>
          <Text style={styles.fieldValue}>{engineVersion}</Text>
        </View>
      </View>

      {/* Alerts */}
      <Text style={styles.sectionTitle}>Recent Alerts</Text>

      {!loading && !fetchError && data?.recommendation.irrigationNeeded && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>
            💧 Irrigation Required
          </Text>
          <Text style={styles.alertText}>
            IDI = {indices.IDI.toFixed(3)} — Soil moisture is below the recommended threshold.
          </Text>
        </View>
      )}

      {!loading && !fetchError && !data?.recommendation.irrigationNeeded && (
        <View style={[styles.alertCard, styles.alertCardGood]}>
          <Text style={[styles.alertTitle, styles.alertTitleGood]}>
            ✅ No Alerts
          </Text>
          <Text style={styles.alertText}>
            No immediate action required based on current sensor data.
          </Text>
        </View>
      )}

      {fetchError && (
        <View style={[styles.alertCard, styles.alertCardError]}>
          <Text style={[styles.alertTitle, styles.alertTitleError]}>
            ⚠️ Backend Unreachable
          </Text>
          <Text style={styles.alertText}>
            Could not reach the CHLORIS backend. The server may be waking up — please try again in 30 seconds.
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          CHLORIS • Smart Farming Assistant
        </Text>
      </View>

    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components — unchanged from Phase 1
// ---------------------------------------------------------------------------

function SensorCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.sensorCard}>
      <Text style={styles.sensorLabel}>{label}</Text>

      <View style={styles.sensorValueRow}>
        <Text style={styles.sensorValue}>{value}</Text>
        <Text style={styles.sensorUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function IndexRow({
  name,
  fullName,
  value,
}: {
  name: string;
  fullName: string;
  value: string;
}) {
  return (
    <View style={styles.indexRow}>
      <View>
        <Text style={styles.indexName}>{name}</Text>
        <Text style={styles.indexFullName}>{fullName}</Text>
      </View>

      <Text style={styles.indexValue}>{value}</Text>
    </View>
  );
}

function AnalysisRow({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <View style={styles.analysisRow}>
      <Text style={styles.analysisTitle}>{title}</Text>
      <Text style={styles.analysisValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — preserved from Phase 1; only additions marked NEW
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F3',
    paddingHorizontal: 20,
  },

  header: {
    paddingTop: 30,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  smallText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#64806C',
  },

  title: {
    marginTop: 5,
    fontSize: 28,
    fontWeight: '800',
    color: '#193D29',
  },

  logoutButton: {
    backgroundColor: '#E7EFE9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  logoutText: {
    color: '#315A40',
    fontWeight: '700',
    fontSize: 12,
  },

  systemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5DE',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#718078',
  },

  systemTitle: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '800',
    color: '#203C2A',
  },

  onlineBadge: {
    backgroundColor: '#E7F5E9',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // NEW — offline variant
  offlineBadge: {
    backgroundColor: '#FDECEA',
  },

  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2E9B50',
    marginRight: 6,
  },

  // NEW — offline dot
  redDot: {
    backgroundColor: '#C62828',
  },

  onlineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E8147',
  },

  // NEW — offline text
  offlineText: {
    color: '#B71C1C',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#203A2A',
    marginTop: 24,
    marginBottom: 11,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  sensorCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5DE',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
  },

  sensorLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#718078',
  },

  sensorValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 9,
  },

  sensorValue: {
    fontSize: 25,
    fontWeight: '800',
    color: '#183D29',
  },

  sensorUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718078',
    marginLeft: 4,
  },

  // NEW — engine version badge shown above indices
  engineBadge: {
    backgroundColor: '#F0F4F1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D8E2DA',
  },

  engineBadgeText: {
    fontSize: 10,
    color: '#5A6B5E',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  indexCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCE5DE',
    paddingHorizontal: 17,
  },

  indexRow: {
    minHeight: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1ED',
  },

  indexName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E5133',
  },

  indexFullName: {
    fontSize: 10,
    color: '#718078',
    marginTop: 3,
  },

  indexValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C4A2E',
  },

  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCE5DE',
    paddingHorizontal: 17,
  },

  analysisRow: {
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1ED',
  },

  analysisTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#42564A',
  },

  analysisValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4C30',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },

  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCE5DE',
    padding: 18,
  },

  fieldName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#203D2B',
    marginTop: 6,
  },

  divider: {
    height: 1,
    backgroundColor: '#E8EEE9',
    marginVertical: 15,
  },

  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  fieldLabel: {
    fontSize: 12,
    color: '#718078',
  },

  fieldValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#294C36',
  },

  alertCard: {
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#F1D9A8',
    borderRadius: 15,
    padding: 17,
  },

  // NEW — good state alert card
  alertCardGood: {
    backgroundColor: '#F0FBF1',
    borderColor: '#B5DDB8',
  },

  // NEW — error state alert card
  alertCardError: {
    backgroundColor: '#FDECEA',
    borderColor: '#FFCDD2',
  },

  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8A5A12',
  },

  // NEW
  alertTitleGood: {
    color: '#1B5E20',
  },

  // NEW
  alertTitleError: {
    color: '#B71C1C',
  },

  alertText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#806A45',
    marginTop: 6,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  footerText: {
    fontSize: 10,
    color: '#87938B',
    letterSpacing: 0.5,
  },
});