import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import FieldMap from '../components/FieldMap';
import { API_ENDPOINTS } from '../constants/api';
import { Language, TRANSLATIONS } from '../constants/translations';
import { getSavedLanguage, saveLanguage } from '../utils/languageStorage';

// ---------------------------------------------------------------------------
// Types — mirror /api/decisions & /api/weather response shapes
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

interface DecisionResponse {
  deviceId: string;
  timestamp: string;
  sensors: SensorValues;
  indices: Indices;
  recommendation: Recommendation;
  meta: {
    engineVersion: string;
    inputsAvailable: string[];
    inputsMissing: string[];
  };
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  condition: string;
  conditionTamil: string;
  emoji: string;
  timestamp: string;
}

// Default fallback coordinates (Coimbatore / Tamil Nadu farming belt)
const DEFAULT_LAT = 11.0168;
const DEFAULT_LON = 76.9558;

// ---------------------------------------------------------------------------
// Helper — Relative Time Formatter
// ---------------------------------------------------------------------------
function formatRelativeTime(isoString: string | null, lang: Language): string {
  if (!isoString) return TRANSLATIONS[lang].updatedJustNow;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) {
    return TRANSLATIONS[lang].updatedJustNow;
  }
  return TRANSLATIONS[lang].updatedAgo(diffMin);
}

// ---------------------------------------------------------------------------
// Main Farmer Component
// ---------------------------------------------------------------------------

export default function FarmerScreen() {
  const [lang, setLang] = useState<Language>('en');
  const [data, setData] = useState<DecisionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Location & Weather state
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const t = TRANSLATIONS[lang];

  // Load language preference
  useEffect(() => {
    getSavedLanguage().then((saved) => setLang(saved));
  }, []);

  const handleToggleLanguage = async () => {
    const nextLang: Language = lang === 'en' ? 'ta' : 'en';
    setLang(nextLang);
    await saveLanguage(nextLang);
  };

  // Fetch Decision Engine Data
  useEffect(() => {
    fetch(API_ENDPOINTS.decisions)
      .then((res) => res.json())
      .then((json: DecisionResponse) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }, []);

  // Fetch Weather helper with debug logging & error banner preservation
  const fetchWeather = async (lat: number, lon: number) => {
    setWeatherLoading(true);
    const url = API_ENDPOINTS.weather(lat, lon);
    console.log('[CHLORIS WEATHER] Weather URL:', url);
    try {
      const res = await fetch(url);
      console.log('[CHLORIS WEATHER] Response status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log('[CHLORIS WEATHER] Weather response:', json);
      if (json && json.current) {
        setWeatherData(json.current);
        setWeatherError(false);
      }
    } catch (err: any) {
      console.log('[CHLORIS WEATHER] Weather fetch error:', err?.message || err);
      setWeatherError(true);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Request Location & Update Coordinates
  const requestLocationAndWeather = async () => {
    // Instantly fetch for current target coordinates (location or default fallback)
    const targetLat = location?.latitude ?? DEFAULT_LAT;
    const targetLon = location?.longitude ?? DEFAULT_LON;
    fetchWeather(targetLat, targetLon);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[CHLORIS WEATHER] Location permission:', status);

      if (status !== 'granted') {
        setLocationPermissionStatus('denied');
        return;
      }

      setLocationPermissionStatus('granted');
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };

      console.log('[CHLORIS WEATHER] Latitude:', coords.latitude);
      console.log('[CHLORIS WEATHER] Longitude:', coords.longitude);

      setLocation(coords);
      fetchWeather(coords.latitude, coords.longitude);
    } catch (err: any) {
      console.log('[CHLORIS WEATHER] Location error:', err?.message || err);
      setLocationPermissionStatus('denied');
    }
  };

  // Auto-request location and set up 12-minute weather refresh
  useEffect(() => {
    requestLocationAndWeather();

    const interval = setInterval(() => {
      const currentLat = location?.latitude ?? DEFAULT_LAT;
      const currentLon = location?.longitude ?? DEFAULT_LON;
      fetchWeather(currentLat, currentLon);
    }, 12 * 60 * 1000); // 12 minutes

    return () => clearInterval(interval);
  }, []);

  // Derived display values
  const IDI = data?.indices.IDI ?? 0;
  const CVI = data?.indices.CVI ?? 0;
  const irrigationNeeded = data?.recommendation.irrigationNeeded ?? false;
  const cropHealth = data?.recommendation.cropHealth ?? 'GOOD';
  const deviceId = data?.deviceId ?? 'FIELD01';

  const mapLat = location?.latitude ?? DEFAULT_LAT;
  const mapLon = location?.longitude ?? DEFAULT_LON;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t.greeting}</Text>
            <Text style={styles.title}>{t.myFarm}</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.langToggle} onPress={handleToggleLanguage}>
              <Text style={styles.langToggleText}>
                {lang === 'en' ? 'தமிழ் 🇮🇳' : 'English 🇬🇧'}
              </Text>
            </Pressable>

            <Pressable style={styles.logoutButton} onPress={() => router.replace('/')}>
              <Text style={styles.logoutText}>{t.logout}</Text>
            </Pressable>
          </View>
        </View>

        {/* FIELD STATUS CARD */}
        <View style={styles.fieldCard}>
          <View>
            <Text style={styles.fieldLabel}>{t.fieldStatus}</Text>
            <Text style={styles.fieldName}>{deviceId}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#3D9B55" />
          ) : fetchError ? (
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>{t.offline}</Text>
            </View>
          ) : (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{t.online}</Text>
            </View>
          )}
        </View>

        {/* API ERROR */}
        {fetchError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{t.unableToGetFieldData}</Text>
            <Text style={styles.errorSubtext}>{t.checkInternet}</Text>
          </View>
        )}

        {/* LOADING */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2F6B45" />
            <Text style={styles.loadingText}>{t.gettingFieldData}</Text>
          </View>
        )}

        {/* DECISION ENGINE CONTENT */}
        {!loading && !fetchError && data && (
          <>
            {/* CROP HEALTH CARD */}
            <View
              style={[
                styles.healthCard,
                {
                  backgroundColor:
                    cropHealth === 'CRITICAL'
                      ? '#FDECEA'
                      : cropHealth === 'ATTENTION'
                      ? '#FFF8E1'
                      : '#E8F4E9',
                },
              ]}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>🌱</Text>
              </View>

              <View style={styles.healthContent}>
                <Text style={styles.cardLabel}>{t.cropHealthLabel}</Text>
                <Text
                  style={[
                    styles.healthStatus,
                    {
                      color:
                        cropHealth === 'CRITICAL'
                          ? '#B71C1C'
                          : cropHealth === 'ATTENTION'
                          ? '#E65100'
                          : '#26703D',
                    },
                  ]}
                >
                  {lang === 'ta'
                    ? cropHealth === 'CRITICAL'
                      ? t.critical
                      : cropHealth === 'ATTENTION'
                      ? t.attention
                      : t.good
                    : cropHealth}
                </Text>
                <Text style={styles.healthTamil}>
                  {cropHealth === 'CRITICAL'
                    ? t.cropHealthCritical
                    : cropHealth === 'ATTENTION'
                    ? t.cropHealthAttention
                    : t.cropHealthGood}
                </Text>
              </View>
            </View>

            {/* QUICK STATUS GRID */}
            <Text style={styles.sectionTitle}>{t.todaysFieldStatus}</Text>

            <View style={styles.grid}>
              {/* WATER */}
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: '#E4F1F8' }]}>
                  <Text style={styles.statusEmoji}>💧</Text>
                </View>
                <Text style={styles.statusLabel}>{t.water}</Text>
                <Text style={styles.statusValue}>
                  {irrigationNeeded ? t.irrigationNeeded : t.waterOk}
                </Text>
              </View>

              {/* WEATHER QUICK STATUS */}
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: '#FFF0D9' }]}>
                  <Text style={styles.statusEmoji}>{weatherData?.emoji || '🌤️'}</Text>
                </View>
                <Text style={styles.statusLabel}>{t.weather}</Text>
                <Text style={styles.statusValue}>
                  {weatherData ? `${Math.round(weatherData.temperature)}°C` : '—'}
                </Text>
              </View>

              {/* PEST RISK */}
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: '#FFF8E1' }]}>
                  <Text style={styles.statusEmoji}>🐛</Text>
                </View>
                <Text style={styles.statusLabel}>{t.pestRisk}</Text>
                <Text style={styles.statusValue}>{t.monitoring}</Text>
              </View>

              {/* DISEASE WATCH */}
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: '#E8F4F8' }]}>
                  <Text style={styles.statusEmoji}>🍃</Text>
                </View>
                <Text style={styles.statusLabel}>{t.diseaseWatch}</Text>
                <Text style={styles.statusValue}>{t.monitoring}</Text>
              </View>
            </View>

            {/* TODAY'S RECOMMENDATION */}
            <Text style={styles.sectionTitle}>{t.todaysRecommendation}</Text>

            <View
              style={[
                styles.recommendationCard,
                {
                  backgroundColor: irrigationNeeded
                    ? '#E8F4F8'
                    : cropHealth === 'CRITICAL'
                    ? '#FDECEA'
                    : cropHealth === 'ATTENTION'
                    ? '#FFF7E8'
                    : '#F0FBF1',
                  borderColor: irrigationNeeded
                    ? '#B3D7E8'
                    : cropHealth === 'CRITICAL'
                    ? '#FFCDD2'
                    : cropHealth === 'ATTENTION'
                    ? '#F1DFC0'
                    : '#B5DDB8',
                },
              ]}
            >
              <View style={styles.recommendationIcon}>
                <Text style={styles.recommendationEmoji}>
                  {irrigationNeeded ? '🚰' : cropHealth === 'CRITICAL' ? '⚠️' : '✅'}
                </Text>
              </View>

              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>
                  {lang === 'ta' && data.recommendation.irrigationNeeded
                    ? t.irrigationRecommended
                    : data.recommendation.primaryAction}
                </Text>
                <Text style={styles.recommendationTamil}>
                  {data.recommendation.primaryActionTamil}
                </Text>
                <Text style={styles.recommendationText}>
                  {irrigationNeeded
                    ? t.waterNeededBody(data.sensors.moisture)
                    : cropHealth === 'CRITICAL'
                    ? t.criticalBody
                    : cropHealth === 'ATTENTION'
                    ? t.attentionBody
                    : t.goodBody}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* =================================================================== */}
        {/* PHASE 3.5 — FIELD MAP & REAL-TIME WEATHER SECTION                  */}
        {/* =================================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t.fieldMapAndWeather}</Text>
          <Pressable
            style={styles.refreshButton}
            onPress={() => location && fetchWeather(location.latitude, location.longitude)}
          >
            <Text style={styles.refreshButtonText}>🔄 {t.refresh}</Text>
          </Pressable>
        </View>

        {/* LOCATION PERMISSION PROMPT / DENIED CARD */}
        {locationPermissionStatus === 'denied' && (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>📍 {t.locationPermissionTitle}</Text>
            <Text style={styles.permissionText}>{t.locationPermissionExplanation}</Text>
            <Text style={styles.permissionDeniedText}>{t.locationPermissionDenied}</Text>
            <Pressable style={styles.grantButton} onPress={requestLocationAndWeather}>
              <Text style={styles.grantButtonText}>{t.grantPermission}</Text>
            </Pressable>
          </View>
        )}

        {/* MAP & WEATHER CONTAINER CARD */}
        <View style={styles.mapWeatherContainer}>
          {/* FIELD MAP (PLATFORM SPECIFIC MODULE RESOLUTION) */}
          <FieldMap
            latitude={mapLat}
            longitude={mapLon}
            deviceId={deviceId}
            field01MarkerLabel={t.field01Marker}
          />

          {/* REAL-TIME WEATHER CARD */}
          <View style={styles.weatherBody}>
            {weatherError && weatherData && (
              <View style={styles.weatherWarningBanner}>
                <Text style={styles.weatherWarningText}>
                  ⚠️ {lang === 'ta' ? 'வானிலையை புதுப்பிக்க முடியவில்லை' : 'Unable to update weather'}
                </Text>
              </View>
            )}

            {weatherLoading && !weatherData ? (
              <View style={styles.weatherLoadingBox}>
                <ActivityIndicator size="small" color="#2F6B45" />
                <Text style={styles.weatherLoadingText}>{t.gettingFieldData}</Text>
              </View>
            ) : !weatherData ? (
              <View style={styles.weatherErrorBox}>
                <Text style={styles.weatherErrorText}>⚠️ {t.weatherUnavailable}</Text>
              </View>
            ) : (
              <>
                <View style={styles.weatherMainRow}>
                  <View style={styles.tempGroup}>
                    <Text style={styles.weatherEmoji}>{weatherData.emoji}</Text>
                    <Text style={styles.tempText}>{Math.round(weatherData.temperature)}°C</Text>
                  </View>

                  <View style={styles.conditionGroup}>
                    <Text style={styles.conditionText}>
                      {lang === 'ta' ? weatherData.conditionTamil : weatherData.condition}
                    </Text>
                    <Text style={styles.timestampText}>
                      {t.lastUpdated}: {formatRelativeTime(weatherData.timestamp, lang)}
                    </Text>
                  </View>
                </View>

                {/* METRICS ROW */}
                <View style={styles.weatherMetricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>💧 {t.humidity}</Text>
                    <Text style={styles.metricValue}>{weatherData.humidity}%</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>🌧 {t.rainChance}</Text>
                    <Text style={styles.metricValue}>{weatherData.rainProbability}%</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>💨 {t.wind}</Text>
                    <Text style={styles.metricValue}>
                      {weatherData.windSpeed} {lang === 'ta' ? 'கி.மீ/மணி' : 'km/h'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>CHLORIS • Smart Farming Assistant</Text>
        <Text style={styles.footerTamil}>உங்கள் வயல் • உங்கள் முடிவு • எங்கள் உதவி</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles — Clean agricultural green design system
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8F3',
  },

  container: {
    padding: 22,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  greeting: {
    fontSize: 14,
    color: '#68736B',
    marginBottom: 2,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#173B27',
  },

  langToggle: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#2F6B45',
  },

  langToggleText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },

  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#E7EEE8',
  },

  logoutText: {
    color: '#2F6B45',
    fontWeight: '700',
    fontSize: 12,
  },

  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7E1',
    marginBottom: 16,
  },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#7A847C',
  },

  fieldName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#173B27',
    marginTop: 2,
  },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#E7F3E8',
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },

  onlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },

  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#FDECEA',
  },

  offlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C62828',
  },

  offlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C62828',
  },

  errorCard: {
    backgroundColor: '#FDECEA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  errorText: {
    color: '#B71C1C',
    fontWeight: '700',
    fontSize: 14,
  },

  errorSubtext: {
    color: '#7A3030',
    fontSize: 12,
    marginTop: 4,
  },

  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 16,
  },

  loadingText: {
    color: '#68736B',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },

  healthCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 24,
  },

  healthContent: {
    flex: 1,
  },

  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#68736B',
  },

  healthStatus: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },

  healthTamil: {
    fontSize: 13,
    color: '#49524B',
    marginTop: 2,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#173B27',
    marginBottom: 12,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },

  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#E7EEE8',
  },

  refreshButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F6B45',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },

  statusCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E7E1',
  },

  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  statusEmoji: {
    fontSize: 18,
  },

  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#7A847C',
  },

  statusValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#173B27',
    marginTop: 4,
  },

  recommendationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },

  recommendationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recommendationEmoji: {
    fontSize: 22,
  },

  recommendationContent: {
    flex: 1,
  },

  recommendationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173B27',
  },

  recommendationTamil: {
    fontSize: 13,
    color: '#2F6B45',
    fontWeight: '700',
    marginTop: 2,
  },

  recommendationText: {
    fontSize: 12,
    color: '#49524B',
    marginTop: 6,
    lineHeight: 17,
  },

  permissionCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
    padding: 16,
    marginBottom: 14,
  },

  permissionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8D6E63',
  },

  permissionText: {
    fontSize: 12,
    color: '#5D4037',
    marginTop: 4,
    lineHeight: 17,
  },

  permissionDeniedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
    marginTop: 6,
  },

  grantButton: {
    backgroundColor: '#2F6B45',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9,
    alignSelf: 'flex-start',
    marginTop: 10,
  },

  grantButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  mapWeatherContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E7E1',
    overflow: 'hidden',
    marginBottom: 24,
  },

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

  weatherBody: {
    padding: 16,
  },

  weatherLoadingBox: {
    padding: 20,
    alignItems: 'center',
  },

  weatherLoadingText: {
    fontSize: 12,
    color: '#68736B',
    marginTop: 8,
  },

  weatherErrorBox: {
    padding: 14,
    alignItems: 'center',
  },

  weatherErrorText: {
    color: '#B71C1C',
    fontSize: 13,
    fontWeight: '700',
  },

  weatherMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  tempGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  weatherEmoji: {
    fontSize: 32,
  },

  weatherWarningBanner: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  weatherWarningText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '700',
    textAlign: 'center',
  },

  tempText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#173B27',
  },

  conditionGroup: {
    alignItems: 'flex-end',
  },

  conditionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2F6B45',
  },

  timestampText: {
    fontSize: 10,
    color: '#8A928C',
    marginTop: 3,
  },

  weatherMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F7F9F5',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  metricItem: {
    alignItems: 'center',
  },

  metricLabel: {
    fontSize: 11,
    color: '#68736B',
    fontWeight: '600',
  },

  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#173B27',
    marginTop: 3,
  },

  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#D7DED8',
  },

  footer: {
    textAlign: 'center',
    color: '#8A928C',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },

  footerTamil: {
    textAlign: 'center',
    color: '#2F6B45',
    fontSize: 11,
    marginTop: 4,
  },
});