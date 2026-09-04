/**
 * CHLORIS Decision Engine — v0.1-prototype
 * =========================================
 * SIH 2026 Hardware Project — Problem Statement 26180
 *
 * This module computes the four CHLORIS decision indices from raw sensor data.
 * It is a pure function module: no I/O, no side effects, no external dependencies.
 *
 * IMPORTANT ASSUMPTION CLASSIFICATION
 * ------------------------------------
 * [CHLORIS-SPECIFIED]          — Named or required by the SIH problem statement.
 * [PROTOTYPE]                  — Mathematically proposed here; not validated against field data.
 * [CROP-CALIBRATION-REQUIRED]  — Must be replaced with crop-specific values before production.
 * [SENSOR-CALIBRATION-REQUIRED]— Depends on hardware calibration state not yet confirmed.
 * [PHASE-3-ONLY]               — Requires Raspberry Pi image input; excluded from Phase 2.
 *
 * PHASE 2 MISSING-INPUT POLICY
 * -----------------------------
 * Phase 3 inputs (diseaseConfidence, pestCount, leafColorScore) are NOT available yet.
 * They are NOT set to zero — that would incorrectly imply "no disease confirmed."
 * Instead, their weights are RESCALED among the available inputs so weights always sum to 1.0.
 * See each index for exact rescaled weights.
 */

'use strict';

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Clamps a value to [0, 1].
 * Applied after every normalization to handle out-of-range sensor readings.
 */
function clamp(v) {
  return Math.max(0, Math.min(1, v));
}

// ---------------------------------------------------------------------------
// IDI — Irrigation Decision Index [CHLORIS-SPECIFIED: name and role only]
// ---------------------------------------------------------------------------
// Formula structure, weights, and bounds are all [PROTOTYPE].
// No Phase 3 inputs needed — all inputs are sensor-based and available now.
//
// Full weights (no rescaling needed in Phase 2):
//   (1 - moisture_norm) × 0.45   — soil moisture deficit is primary driver     [PROTOTYPE]
//   temperature_norm   × 0.25   — proxy for evapotranspiration demand          [PROTOTYPE]
//   (1 - humidity_norm)× 0.20   — proxy for vapour pressure deficit            [PROTOTYPE]
//   (1 - rain_norm)    × 0.10   — rain reduces irrigation urgency              [PROTOTYPE]
//
// Interpretation: 0 = no need, 1 = urgent irrigation                          [PROTOTYPE]
//   0.00–0.30 = LOW NEED
//   0.31–0.55 = MODERATE NEED
//   0.56–0.75 = HIGH NEED (irrigation recommended)
//   0.76–1.00 = URGENT

function computeIDI(sensors) {
  const { moisture, temperature, humidity, rain } = sensors;

  // Normalization bounds are [PROTOTYPE]
  const M_n = clamp(moisture / 100);                    // [SENSOR-CALIBRATION-REQUIRED] — assumes moisture is already %
  const T_n = clamp((temperature - 15) / 30);           // [PROTOTYPE] bounds: 15°C lower, 45°C upper
  const H_n = clamp((humidity - 40) / 60);              // [PROTOTYPE] bounds: 40% lower (dry air), 100% upper
  const R_n = clamp(rain / 20);                         // [PROTOTYPE] ceiling: 20 mm  [SENSOR-CALIBRATION-REQUIRED]

  const IDI = clamp(
    0.45 * (1 - M_n) +   // [PROTOTYPE] weight
    0.25 * T_n       +   // [PROTOTYPE] weight
    0.20 * (1 - H_n) +   // [PROTOTYPE] weight
    0.10 * (1 - R_n)     // [PROTOTYPE] weight
  );

  return round(IDI);
}

// ---------------------------------------------------------------------------
// ERI — Environmental Risk Index [CHLORIS-SPECIFIED: name and role only]
// ---------------------------------------------------------------------------
// Phase 2: diseaseConfidence is [PHASE-3-ONLY] and is EXCLUDED.
// Its weight (0.15) is RESCALED among available inputs:
//
//   Full weights (Phase 3):    temp=0.35, humidity_dev=0.30, light=0.20, disease=0.15
//   Available in Phase 2 sum:  0.35 + 0.30 + 0.20 = 0.85
//   Scale factor:              1.00 / 0.85 = 1.1765
//
//   Phase 2 rescaled weights:
//     temperature_norm × 0.4118   (0.35 × 1.1765)                            [PROTOTYPE]
//     humidity_dev     × 0.3529   (0.30 × 1.1765)                            [PROTOTYPE]
//     light_stress     × 0.2353   (0.20 × 1.1765)                            [PROTOTYPE]
//   Sum = 1.0000 ✓
//
// Interpretation: 0 = favourable, 1 = extreme stress                         [PROTOTYPE]
//   0.00–0.25 = LOW
//   0.26–0.50 = MODERATE
//   0.51–0.75 = HIGH
//   0.76–1.00 = CRITICAL

function computeERI(sensors) {
  const { temperature, humidity, light } = sensors;
  // diseaseConfidence excluded — [PHASE-3-ONLY]

  const T_n      = clamp((temperature - 15) / 30);            // [PROTOTYPE] bounds
  const H_dev    = clamp(Math.abs(humidity - 70) / 30);       // optimal RH centre = 70 is [PROTOTYPE] / [CROP-CALIBRATION-REQUIRED]
  const L_stress = clamp(1 - (light / 1500));                 // 1500 lux ceiling is [PROTOTYPE] / [CROP-CALIBRATION-REQUIRED]

  // Phase 2 rescaled weights (disease excluded)
  const ERI = clamp(
    0.4118 * T_n     +   // [PROTOTYPE] rescaled weight
    0.3529 * H_dev   +   // [PROTOTYPE] rescaled weight
    0.2353 * L_stress    // [PROTOTYPE] rescaled weight
  );

  return round(ERI);
}

// ---------------------------------------------------------------------------
// SNI — Soil Nutrition Index [CHLORIS-SPECIFIED: name and role only]
// ---------------------------------------------------------------------------
// Phase 2: leafColorScore is [PHASE-3-ONLY] and is EXCLUDED.
// Its weight (0.15) is RESCALED among available inputs:
//
//   Full weights (Phase 3):    ec=0.60, moisture=0.25, leaf=0.15
//   Available in Phase 2 sum:  0.60 + 0.25 = 0.85
//   Scale factor:              1.00 / 0.85 = 1.1765
//
//   Phase 2 rescaled weights:
//     EC_score      × 0.7059   (0.60 × 1.1765)                               [PROTOTYPE]
//     moisture_norm × 0.2941   (0.25 × 1.1765)                               [PROTOTYPE]
//   Sum = 1.0000 ✓
//
// EC is scored with a tent function centred at EC_opt = 1.5 mS/cm.
// EC_opt = 1.5 mS/cm is [PROTOTYPE] / [CROP-CALIBRATION-REQUIRED]
// For paddy/rice the typical optimal is 0.8–1.2 mS/cm.
//
// EC_score = 1 − clamp( |EC − EC_opt| / EC_opt )
//   = 1.0 at EC = EC_opt (optimal)
//   = 0.0 at EC = 0 or EC = 2×EC_opt (extreme)
//
// Interpretation: 0 = poor nutrition, 1 = optimal                            [PROTOTYPE]
//   0.00–0.35 = POOR
//   0.36–0.60 = MARGINAL
//   0.61–0.80 = GOOD
//   0.81–1.00 = OPTIMAL

const EC_OPT = 1.5; // [PROTOTYPE] / [CROP-CALIBRATION-REQUIRED]

function computeSNI(sensors) {
  const { ec, moisture } = sensors;
  // leafColorScore excluded — [PHASE-3-ONLY]

  const EC_score      = clamp(1 - Math.abs(ec - EC_OPT) / EC_OPT); // [SENSOR-CALIBRATION-REQUIRED] — assumes calibrated soil EC
  const moisture_norm = clamp(moisture / 100);                      // [SENSOR-CALIBRATION-REQUIRED]

  // Phase 2 rescaled weights (leaf colour excluded)
  const SNI = clamp(
    0.7059 * EC_score      +   // [PROTOTYPE] rescaled weight
    0.2941 * moisture_norm     // [PROTOTYPE] rescaled weight
  );

  return round(SNI);
}

// ---------------------------------------------------------------------------
// CVI — Crop Vulnerability Index [CHLORIS-SPECIFIED: name and role only]
// ---------------------------------------------------------------------------
// Phase 2: diseaseConfidence and pestCount are [PHASE-3-ONLY] and EXCLUDED.
// Their combined weight (0.35 + 0.20 = 0.55) is RESCALED among available inputs:
//
//   Full weights (Phase 3):    humidity=0.25, temperature=0.20, disease=0.35, pest=0.20
//   Available in Phase 2 sum:  0.25 + 0.20 = 0.45
//   Scale factor:              1.00 / 0.45 = 2.2222
//
//   Phase 2 rescaled weights:
//     humidity_stress × 0.5556  (0.25 × 2.2222)                              [PROTOTYPE]
//     fungal_temp     × 0.4444  (0.20 × 2.2222)                              [PROTOTYPE]
//   Sum = 1.0000 ✓
//
// NOTE: 55% of the intended CVI signal is missing in Phase 2. This index is
// therefore a rough ENVIRONMENTAL PROXY, not a disease/pest detection result.
// UI must use wording like "conditions may favour disease" — NOT "disease detected."
//
// Normalization:
//   humidity_stress: onset = 60% RH is [PROTOTYPE] / [CROP-CALIBRATION-REQUIRED]
//   fungal_temp:     peak  = 28°C    is [PROTOTYPE] / [CROP-CALIBRATION-REQUIRED]
//                    half-width = 15°C is [PROTOTYPE]
//
// Interpretation: 0 = low risk conditions, 1 = high-risk conditions         [PROTOTYPE]
//   0.00–0.25 = LOW RISK CONDITIONS
//   0.26–0.50 = CONDITIONS MODERATELY FAVOURABLE
//   0.51–0.75 = CONDITIONS UNFAVOURABLE
//   0.76–1.00 = HIGH-RISK CONDITIONS

function computeCVI(sensors) {
  const { humidity, temperature } = sensors;
  // diseaseConfidence and pestCount excluded — [PHASE-3-ONLY]

  const H_stress = clamp((humidity - 60) / 40);                      // onset 60% RH is [PROTOTYPE] / [CROP-CALIBRATION-REQUIRED]
  const T_fungal = clamp(1 - Math.abs(temperature - 28) / 15);      // peak 28°C is [PROTOTYPE] / [CROP-CALIBRATION-REQUIRED]

  // Phase 2 rescaled weights (disease + pest excluded)
  const CVI = clamp(
    0.5556 * H_stress +   // [PROTOTYPE] rescaled weight
    0.4444 * T_fungal     // [PROTOTYPE] rescaled weight
  );

  return round(CVI);
}

// ---------------------------------------------------------------------------
// Priority Recommendation Logic [PROTOTYPE]
// ---------------------------------------------------------------------------
// Thresholds and priority order are [PROTOTYPE] — not validated against field data.

function buildRecommendation(indices, sensors) {
  const { IDI, ERI, SNI, CVI } = indices;
  const { rain } = sensors;

  // Irrigation boolean: IDI above threshold AND no meaningful rain         [PROTOTYPE] thresholds
  const irrigationNeeded = IDI >= 0.56 && rain < 5; // rain < 5 mm is [PROTOTYPE] / [SENSOR-CALIBRATION-REQUIRED]

  // Overall crop health label                                               [PROTOTYPE] thresholds
  let cropHealth;
  if (CVI >= 0.76 || IDI >= 0.76) {
    cropHealth = 'CRITICAL';
  } else if (CVI >= 0.51 || IDI >= 0.56 || ERI >= 0.51) {
    cropHealth = 'ATTENTION';
  } else {
    cropHealth = 'GOOD';
  }

  // Environmental risk label (for admin display)                            [PROTOTYPE] thresholds
  let environmentalRisk;
  if (ERI >= 0.76)      environmentalRisk = 'CRITICAL';
  else if (ERI >= 0.51) environmentalRisk = 'HIGH';
  else if (ERI >= 0.26) environmentalRisk = 'MODERATE';
  else                  environmentalRisk = 'LOW';

  // Crop vulnerability label — PHASE 2: conservative wording, no detection [PROTOTYPE] thresholds
  // Because 55% of CVI signal (disease + pest) is missing, we describe CONDITIONS only.
  let cropVulnerability;
  if (CVI >= 0.76)      cropVulnerability = 'HIGH-RISK CONDITIONS';
  else if (CVI >= 0.51) cropVulnerability = 'CONDITIONS UNFAVOURABLE';
  else if (CVI >= 0.26) cropVulnerability = 'CONDITIONS MODERATELY FAVOURABLE';
  else                  cropVulnerability = 'LOW RISK CONDITIONS';

  // Priority recommendation — first matching rule wins                      [PROTOTYPE] priority order
  let primaryAction, primaryActionTamil;
  if (IDI >= 0.56) {
    primaryAction      = 'Irrigation recommended';
    primaryActionTamil = 'நீர்ப்பாசனம் தேவை';
  } else if (CVI >= 0.51) {
    primaryAction      = 'Conditions may favour disease — check field';
    primaryActionTamil = 'நோய் ஏற்படும் நிலை — வயலை சரிபாருங்கள்';
  } else if (ERI >= 0.51) {
    primaryAction      = 'High environmental stress — monitor closely';
    primaryActionTamil = 'சுற்றுச்சூழல் அழுத்தம் அதிகமாக உள்ளது';
  } else if (SNI <= 0.35) {
    primaryAction      = 'Soil nutrients may be low — consider testing';
    primaryActionTamil = 'மண்ணில் சத்துக்கள் குறைவாக இருக்கலாம்';
  } else {
    primaryAction      = 'Field conditions look good today';
    primaryActionTamil = 'இன்று வயல் நிலை நன்றாக உள்ளது';
  }

  return {
    cropHealth,
    irrigationNeeded,
    primaryAction,
    primaryActionTamil,
    environmentalRisk,
    cropVulnerability,
  };
}

// ---------------------------------------------------------------------------
// Main export — computeDecisions(sensors) -> full decision response
// ---------------------------------------------------------------------------

function computeDecisions(sensors) {
  const indices = {
    IDI: computeIDI(sensors),
    ERI: computeERI(sensors),
    SNI: computeSNI(sensors),
    CVI: computeCVI(sensors),
  };

  const recommendation = buildRecommendation(indices, sensors);

  return {
    indices,
    recommendation,
    meta: {
      engineVersion:   '0.1-prototype',
      // All formulas, weights and thresholds in this engine are [PROTOTYPE].
      // They have not been validated against field data.
      inputsAvailable: ['moisture', 'temperature', 'humidity', 'ec', 'light', 'rain'],
      inputsMissing:   ['diseaseConfidence', 'pestCount', 'leafColorScore'],
      // Missing Phase 3 inputs were EXCLUDED via weight rescaling, not set to zero.
      phase2Rescaling: {
        ERI: 'diseaseConfidence excluded; temp/humidity/light weights rescaled by ÷0.85',
        SNI: 'leafColorScore excluded; ec/moisture weights rescaled by ÷0.85',
        CVI: 'diseaseConfidence+pestCount excluded; humidity/temp weights rescaled by ÷0.45',
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Helper — round to 3 decimal places for clean API output
// ---------------------------------------------------------------------------
function round(v) {
  return Math.round(v * 1000) / 1000;
}

module.exports = { computeDecisions };
