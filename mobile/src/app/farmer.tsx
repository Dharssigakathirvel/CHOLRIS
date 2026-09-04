import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// ---------------------------------------------------------------------------
// Index-to-label helpers
// These map computed index values to farmer-friendly display labels.
// Thresholds match the approved decision engine design (all [PROTOTYPE]).
// ---------------------------------------------------------------------------

function getWaterDisplay(IDI: number, irrigationNeeded: boolean): {
  status: string;
  statusTamil: string;
  color: string;
  iconBg: string;
} {
  if (irrigationNeeded && IDI >= 0.76) {
    return { status: 'IRRIGATE NOW',        statusTamil: 'இப்போதே தண்ணீர் பாய்ச்சவும்',      color: '#B71C1C', iconBg: '#FDECEA' };
  }
  if (irrigationNeeded) {
    return { status: 'IRRIGATION NEEDED',   statusTamil: 'தண்ணீர் தேவை',                       color: '#1565C0', iconBg: '#E4F1F8' };
  }
  if (IDI <= 0.30) {
    return { status: 'WATER OK',            statusTamil: 'தண்ணீர் நிலை சரியாக உள்ளது',       color: '#2E7D32', iconBg: '#E7F3E8' };
  }
  return   { status: 'MONITOR',             statusTamil: 'தண்ணீர் நிலையை கவனியுங்கள்',       color: '#E65100', iconBg: '#FFF0D9' };
}

function getWeatherDisplay(temperature: number): {
  status: string;
  statusTamil: string;
  emoji: string;
  color: string;
  iconBg: string;
} {
  // Temperature interpretation is a direct sensor mapping — not index-derived.
  // Thresholds are [PROTOTYPE].
  if (temperature > 32) {
    return { status: 'HOT TODAY',  statusTamil: 'இன்று வெப்பம் அதிகம்',            emoji: '☀️',  color: '#E65100', iconBg: '#FFF0D9' };
  }
  if (temperature >= 20) {
    return { status: 'NORMAL',     statusTamil: 'வெப்பநிலை சாதாரணமாக உள்ளது',     emoji: '🌤️', color: '#2E7D32', iconBg: '#E7F3E8' };
  }
  return   { status: 'COOL',       statusTamil: 'இன்று குளிர்ச்சியாக உள்ளது',      emoji: '🌡️', color: '#1565C0', iconBg: '#E4F1F8' };
}

// Phase 2 CVI is an environmental proxy only — no direct pest/disease detection.
// Wording deliberately says "conditions" not "detected."
function getPestDisplay(CVI: number): {
  status: string;
  statusTamil: string;
  color: string;
  iconBg: string;
} {
  if (CVI >= 0.76) {
    return { status: 'HIGH-RISK CONDITIONS',        statusTamil: 'பூச்சி ஆபத்து அதிக நிலை',           color: '#B71C1C', iconBg: '#FDECEA' };
  }
  if (CVI >= 0.51) {
    return { status: 'CONDITIONS UNFAVOURABLE',     statusTamil: 'பூச்சி நிலை சாதகமில்லை',             color: '#E65100', iconBg: '#FFF0D9' };
  }
  if (CVI >= 0.26) {
    return { status: 'WATCH',                       statusTamil: 'பூச்சி நிலையை கவனியுங்கள்',         color: '#F9A825', iconBg: '#FFF8E1' };
  }
  return   { status: 'LOW RISK',                    statusTamil: 'பூச்சிகளால் ஏற்படும் ஆபத்து குறைவு', color: '#2E7D32', iconBg: '#E7F3E8' };
}

// Same CVI used for disease conditions — Phase 2 wording is conservative.
function getDiseaseDisplay(CVI: number): {
  status: string;
  statusTamil: string;
  color: string;
  iconBg: string;
} {
  if (CVI >= 0.76) {
    return { status: 'HIGH-RISK CONDITIONS',        statusTamil: 'நோய் ஆபத்து அதிக நிலை',              color: '#B71C1C', iconBg: '#FDECEA' };
  }
  if (CVI >= 0.51) {
    return { status: 'MAY FAVOUR DISEASE',          statusTamil: 'நோய் ஏற்படும் நிலை உள்ளது',          color: '#E65100', iconBg: '#FFF0D9' };
  }
  if (CVI >= 0.26) {
    return { status: 'WATCH',                       statusTamil: 'நோய் நிலையை கவனியுங்கள்',            color: '#F9A825', iconBg: '#FFF8E1' };
  }
  return   { status: 'LOW RISK',                    statusTamil: 'நோயால் ஏற்படும் ஆபத்து குறைவு',       color: '#2E7D32', iconBg: '#E7F3E8' };
}

function getCropHealthStyle(cropHealth: string): {
  cardBg: string;
  textColor: string;
  tamileText: string;
  subtext: string;
} {
  switch (cropHealth) {
    case 'CRITICAL':
      return { cardBg: '#FDECEA', textColor: '#B71C1C', tamileText: 'பயிர் நிலை மிகவும் மோசமாக உள்ளது', subtext: 'Immediate attention required' };
    case 'ATTENTION':
      return { cardBg: '#FFF8E1', textColor: '#E65100', tamileText: 'பயிருக்கு கவனிப்பு தேவை',          subtext: 'Check field conditions today' };
    default: // GOOD
      return { cardBg: '#E8F4E9', textColor: '#26703D', tamileText: 'உங்கள் பயிர் நன்றாக உள்ளது',       subtext: 'No major crop risk detected' };
  }
}

function getRecommendationCard(recommendation: Recommendation): {
  emoji: string;
  cardBg: string;
  borderColor: string;
  titleColor: string;
  tamilColor: string;
  bodyColor: string;
} {
  if (recommendation.irrigationNeeded) {
    return { emoji: '🚰', cardBg: '#E8F4F8', borderColor: '#B3D7E8', titleColor: '#0D47A1', tamilColor: '#1565C0', bodyColor: '#37607A' };
  }
  if (recommendation.cropHealth === 'CRITICAL') {
    return { emoji: '⚠️', cardBg: '#FDECEA', borderColor: '#FFCDD2', titleColor: '#B71C1C', tamilColor: '#C62828', bodyColor: '#7A3030' };
  }
  if (recommendation.cropHealth === 'ATTENTION') {
    return { emoji: '👀', cardBg: '#FFF7E8', borderColor: '#F1DFC0', titleColor: '#76551E', tamilColor: '#80672F', bodyColor: '#887858' };
  }
  return { emoji: '✅', cardBg: '#F0FBF1', borderColor: '#B5DDB8', titleColor: '#1B5E20', tamilColor: '#2E7D32', bodyColor: '#4A7A50' };
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function FarmerScreen() {
  const [data, setData] = useState<DecisionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/decisions')
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

  // Derived display values — computed from the engine response
  const IDI = data?.indices.IDI ?? 0;
  const CVI = data?.indices.CVI ?? 0;
  const irrigationNeeded = data?.recommendation.irrigationNeeded ?? false;
  const cropHealth       = data?.recommendation.cropHealth ?? 'GOOD';
  const temperature      = data?.sensors.temperature ?? 0;
  const deviceId         = data?.deviceId ?? 'My Field';

  const water      = getWaterDisplay(IDI, irrigationNeeded);
  const weather    = getWeatherDisplay(temperature);
  const pest       = getPestDisplay(CVI);
  const disease    = getDiseaseDisplay(CVI);
  const healthStyle = getCropHealthStyle(cropHealth);
  const recCard    = data ? getRecommendationCard(data.recommendation) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>வணக்கம் 👋</Text>
            <Text style={styles.title}>My Farm</Text>
          </View>

          <Pressable
            style={styles.logoutButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* FIELD STATUS */}
        <View style={styles.fieldCard}>
          <View>
            <Text style={styles.fieldLabel}>FIELD STATUS</Text>
            <Text style={styles.fieldName}>{deviceId}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#3D9B55" />
          ) : fetchError ? (
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>OFFLINE</Text>
            </View>
          ) : (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>ONLINE</Text>
            </View>
          )}
        </View>

        {/* API ERROR */}
        {fetchError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ Unable to get latest field data.</Text>
            <Text style={styles.errorSubtext}>
              தரவை பெற முடியவில்லை. இணையத்தை சரிபாருங்கள்.
            </Text>
          </View>
        )}

        {/* LOADING */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2F6B45" />
            <Text style={styles.loadingText}>Getting field data…</Text>
          </View>
        )}

        {/* CONTENT — only shown after data loads */}
        {!loading && !fetchError && data && (
          <>
            {/* CROP HEALTH */}
            <View style={[styles.healthCard, { backgroundColor: healthStyle.cardBg }]}>
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>🌱</Text>
              </View>

              <View style={styles.healthContent}>
                <Text style={styles.cardLabel}>CROP HEALTH</Text>
                <Text style={[styles.healthStatus, { color: healthStyle.textColor }]}>
                  {cropHealth}
                </Text>
                <Text style={styles.healthTamil}>
                  {healthStyle.tamileText}
                </Text>
                <Text style={styles.healthSubtext}>
                  {healthStyle.subtext}
                </Text>
              </View>
            </View>

            {/* QUICK STATUS GRID */}
            <Text style={styles.sectionTitle}>Today's Field Status</Text>

            <View style={styles.grid}>

              {/* WATER */}
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: water.iconBg }]}>
                  <Text style={styles.statusEmoji}>💧</Text>
                </View>
                <Text style={styles.statusLabel}>WATER</Text>
                <Text style={[styles.statusValue, { color: water.color }]}>
                  {water.status}
                </Text>
                <Text style={styles.statusTamil}>{water.statusTamil}</Text>
              </View>

              {/* WEATHER */}
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: weather.iconBg }]}>
                  <Text style={styles.statusEmoji}>{weather.emoji}</Text>
                </View>
                <Text style={styles.statusLabel}>WEATHER</Text>
                <Text style={[styles.statusValue, { color: weather.color }]}>
                  {weather.status}
                </Text>
                <Text style={styles.statusTamil}>{weather.statusTamil}</Text>
              </View>

              {/* PEST — Phase 2: condition-based wording */}
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: pest.iconBg }]}>
                  <Text style={styles.statusEmoji}>🐛</Text>
                </View>
                <Text style={styles.statusLabel}>PEST RISK</Text>
                <Text style={[styles.statusValue, { color: pest.color }]}>
                  {pest.status}
                </Text>
                <Text style={styles.statusTamil}>{pest.statusTamil}</Text>
              </View>

              {/* DISEASE — Phase 2: condition-based wording */}
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: disease.iconBg }]}>
                  <Text style={styles.statusEmoji}>🍃</Text>
                </View>
                <Text style={styles.statusLabel}>DISEASE</Text>
                <Text style={[styles.statusValue, { color: disease.color }]}>
                  {disease.status}
                </Text>
                <Text style={styles.statusTamil}>{disease.statusTamil}</Text>
              </View>

            </View>

            {/* RECOMMENDATION */}
            <Text style={styles.sectionTitle}>Today's Recommendation</Text>

            {recCard && (
              <View style={[
                styles.recommendationCard,
                { backgroundColor: recCard.cardBg, borderColor: recCard.borderColor }
              ]}>
                <View style={styles.recommendationIcon}>
                  <Text style={styles.recommendationEmoji}>{recCard.emoji}</Text>
                </View>

                <View style={styles.recommendationContent}>
                  <Text style={[styles.recommendationTitle, { color: recCard.titleColor }]}>
                    {data.recommendation.primaryAction}
                  </Text>
                  <Text style={[styles.recommendationTamil, { color: recCard.tamilColor }]}>
                    {data.recommendation.primaryActionTamil}
                  </Text>
                  {/* Brief supporting detail from indices */}
                  <Text style={[styles.recommendationText, { color: recCard.bodyColor }]}>
                    {data.recommendation.irrigationNeeded
                      ? `Soil moisture is low. Water the field today.`
                      : data.recommendation.cropHealth === 'CRITICAL'
                      ? `Conditions are critical. Inspect the field immediately.`
                      : data.recommendation.cropHealth === 'ATTENTION'
                      ? `Monitor field conditions closely today.`
                      : `Continue regular monitoring.`}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* MENU — always visible */}
        <Text style={styles.sectionTitle}>More</Text>

        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuEmoji}>🌾</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Crop Health</Text>
              <Text style={styles.menuSubtitle}>View crop condition</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuEmoji}>💧</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Irrigation</Text>
              <Text style={styles.menuSubtitle}>Watering information</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuEmoji}>🔔</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Alerts</Text>
              <Text style={styles.menuSubtitle}>Important field alerts</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>CHLORIS • Smart Farming Assistant</Text>
        <Text style={styles.footerTamil}>உங்கள் வயல் • உங்கள் முடிவு • எங்கள் உதவி</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles — Phase 1 styles fully preserved; additions noted
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
    marginBottom: 22,
  },

  greeting: {
    fontSize: 14,
    color: '#68736B',
    marginBottom: 3,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#173B27',
  },

  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#E7EEE8',
  },

  logoutText: {
    color: '#2F6B45',
    fontWeight: '700',
    fontSize: 12,
  },

  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
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
    fontWeight: '700',
    color: '#26352B',
    marginTop: 3,
  },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#3D9B55',
    marginRight: 6,
  },

  onlineText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2D7B40',
  },

  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  offlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#C62828',
    marginRight: 6,
  },

  offlineText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B71C1C',
  },

  errorCard: {
    backgroundColor: '#FDECEA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },

  errorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B71C1C',
  },

  errorSubtext: {
    fontSize: 12,
    color: '#C62828',
    marginTop: 4,
  },

  loadingCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#68736B',
  },

  healthCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  icon: {
    fontSize: 31,
  },

  healthContent: {
    flex: 1,
  },

  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: '#5D7062',
  },

  healthStatus: {
    fontSize: 25,
    fontWeight: '900',
    marginTop: 1,
  },

  healthTamil: {
    fontSize: 13,
    fontWeight: '600',
    color: '#355C40',
    marginTop: 2,
  },

  healthSubtext: {
    fontSize: 11,
    color: '#68776C',
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#25352A',
    marginBottom: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
    marginBottom: 25,
  },

  statusCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    minHeight: 145,
    borderWidth: 1,
    borderColor: '#E0E6E1',
  },

  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  statusEmoji: {
    fontSize: 19,
  },

  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#7B847D',
  },

  statusValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },

  statusTamil: {
    fontSize: 11,
    color: '#68736B',
    marginTop: 4,
  },

  recommendationCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    borderWidth: 1,
    marginBottom: 25,
  },

  recommendationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  recommendationEmoji: {
    fontSize: 23,
  },

  recommendationContent: {
    flex: 1,
  },

  recommendationTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  recommendationTamil: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  recommendationText: {
    fontSize: 11,
    marginTop: 5,
    lineHeight: 16,
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E6E1',
    overflow: 'hidden',
  },

  menuItem: {
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuEmoji: {
    fontSize: 23,
    width: 42,
  },

  menuTextContainer: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#29372E',
  },

  menuSubtitle: {
    fontSize: 11,
    color: '#7A837C',
    marginTop: 3,
  },

  menuArrow: {
    fontSize: 27,
    color: '#8C958E',
  },

  divider: {
    height: 1,
    backgroundColor: '#EDF0ED',
    marginLeft: 58,
  },

  footer: {
    textAlign: 'center',
    color: '#879188',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 30,
  },

  footerTamil: {
    textAlign: 'center',
    color: '#A0A8A1',
    fontSize: 10,
    marginTop: 5,
  },
});