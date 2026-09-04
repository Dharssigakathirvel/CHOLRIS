const express = require('express');
const cors = require('cors');
const https = require('https');
require('dotenv').config();

const { computeDecisions } = require('./decisionEngine');

/**
 * HTTPS GET JSON helper with zero dependencies.
 * Compatible with all Node versions and cloud environments.
 */
function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'CHLORIS-Backend/1.0' } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Telemetry State & Default Fallback Values [PROTOTYPE]
// ---------------------------------------------------------------------------
const DEFAULT_TELEMETRY = {
  deviceId: 'FIELD01',
  moisture: 38.0,
  temperature: 34.2,
  humidity: 71.0,
  ec: 1.24,
  light: 742,
  rain: 0,
};

let currentTelemetry = {
  ...DEFAULT_TELEMETRY,
  timestamp: new Date().toISOString(),
  dataSource: 'DEFAULT',
  lastTelemetryAt: null,
};

/**
 * Validates incoming telemetry payload.
 * Returns array of error detail strings. Empty array means valid.
 */
function validateTelemetry(body) {
  const details = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['Request body must be a JSON object'];
  }

  // Required fields check
  const requiredFields = ['deviceId', 'moisture', 'temperature', 'humidity', 'ec', 'light', 'rain'];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null) {
      details.push(`Field '${field}' is required`);
    }
  }

  // Device ID type check
  if (body.deviceId !== undefined && body.deviceId !== null) {
    if (typeof body.deviceId !== 'string' || body.deviceId.trim() === '') {
      details.push('deviceId must be a non-empty string');
    }
  }

  // Numeric checks and ranges
  const numericValidations = [
    { name: 'moisture', min: 0, max: 100 },
    { name: 'temperature', min: -10, max: 60 },
    { name: 'humidity', min: 0, max: 100 },
    { name: 'ec', min: 0, max: 20 },
    { name: 'light', min: 0, max: 200000 },
    { name: 'rain', min: 0, max: 1000 },
  ];

  for (const v of numericValidations) {
    const val = body[v.name];
    if (val !== undefined && val !== null) {
      if (typeof val !== 'number' || Number.isNaN(val)) {
        details.push(`${v.name} must be a number`);
      } else if (val < v.min || val > v.max) {
        details.push(`${v.name} must be between ${v.min} and ${v.max}`);
      }
    }
  }

  return details;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    message: 'CHLORIS Backend is running 🌱',
    telemetryStatus: {
      dataSource: currentTelemetry.dataSource,
      lastTelemetryAt: currentTelemetry.lastTelemetryAt,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/telemetry
// Phase 3 — Hardware Telemetry Ingestion Endpoint
// Receives sensor telemetry from ESP32 / simulator and stores in memory.
// ---------------------------------------------------------------------------
app.post('/api/telemetry', (req, res) => {
  const validationErrors = validateTelemetry(req.body);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: 'Invalid telemetry',
      details: validationErrors,
    });
  }

  const now = new Date().toISOString();
  currentTelemetry = {
    deviceId: req.body.deviceId.trim(),
    moisture: Number(req.body.moisture),
    temperature: Number(req.body.temperature),
    humidity: Number(req.body.humidity),
    ec: Number(req.body.ec),
    light: Number(req.body.light),
    rain: Number(req.body.rain),
    timestamp: now,
    dataSource: 'TELEMETRY',
    lastTelemetryAt: now,
  };

  return res.json({
    success: true,
    message: 'Telemetry received and updated',
    telemetry: currentTelemetry,
  });
});

// ---------------------------------------------------------------------------
// GET /api/sensor-data
// Phase 1 / Phase 3 — Returns latest telemetry reading (DEFAULT or TELEMETRY).
// ---------------------------------------------------------------------------
app.get('/api/sensor-data', (req, res) => {
  res.json({
    deviceId: currentTelemetry.deviceId,
    timestamp: currentTelemetry.timestamp,
    moisture: currentTelemetry.moisture,
    temperature: currentTelemetry.temperature,
    humidity: currentTelemetry.humidity,
    ec: currentTelemetry.ec,
    light: currentTelemetry.light,
    rain: currentTelemetry.rain,
    dataSource: currentTelemetry.dataSource,
    lastTelemetryAt: currentTelemetry.lastTelemetryAt,
  });
});

// ---------------------------------------------------------------------------
// GET /api/decisions
// Phase 2 / Phase 3 — Computes IDI, ERI, SNI, CVI from latest telemetry.
// ---------------------------------------------------------------------------
app.get('/api/decisions', (req, res) => {
  const sensors = {
    deviceId: currentTelemetry.deviceId,
    moisture: currentTelemetry.moisture,
    temperature: currentTelemetry.temperature,
    humidity: currentTelemetry.humidity,
    ec: currentTelemetry.ec,
    light: currentTelemetry.light,
    rain: currentTelemetry.rain,
  };

  const { indices, recommendation, meta } = computeDecisions(sensors);

  res.json({
    deviceId: sensors.deviceId,
    timestamp: currentTelemetry.timestamp,
    sensors,
    indices,
    recommendation,
    meta: {
      ...meta,
      dataSource: currentTelemetry.dataSource,
      lastTelemetryAt: currentTelemetry.lastTelemetryAt,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/weather?lat=<lat>&lon=<lon>
// Phase 3.5 — Real-time backend weather integration via Open-Meteo API
// ---------------------------------------------------------------------------

function mapWMOCode(code) {
  switch (code) {
    case 0:
      return { condition: 'Clear sky', conditionTamil: 'தெளிவான வானம்', emoji: '☀️' };
    case 1:
      return { condition: 'Mainly clear', conditionTamil: 'பெரும்பாலும் தெளிவான வானம்', emoji: '🌤️' };
    case 2:
      return { condition: 'Partly cloudy', conditionTamil: 'ஓரளவு மேகமூட்டம்', emoji: '⛅' };
    case 3:
      return { condition: 'Overcast', conditionTamil: 'முழுவதும் மேகமூட்டம்', emoji: '☁️' };
    case 45:
    case 48:
      return { condition: 'Fog', conditionTamil: 'பனிமூட்டம்', emoji: '🌫️' };
    case 51:
      return { condition: 'Light drizzle', conditionTamil: 'லேசான தூறல்', emoji: '🌦️' };
    case 53:
      return { condition: 'Moderate drizzle', conditionTamil: 'மிதமான தூறல்', emoji: '🌦️' };
    case 55:
      return { condition: 'Dense drizzle', conditionTamil: 'அடர்த்தியான தூறல்', emoji: '🌧️' };
    case 56:
    case 57:
      return { condition: 'Freezing drizzle', conditionTamil: 'உறைபனி தூறல்', emoji: '🌧️' };
    case 61:
      return { condition: 'Light rain', conditionTamil: 'லேசான மழை', emoji: '🌧️' };
    case 63:
      return { condition: 'Moderate rain', conditionTamil: 'மிதமான மழை', emoji: '🌧️' };
    case 65:
      return { condition: 'Heavy rain', conditionTamil: 'கனமழை', emoji: '🌧️' };
    case 66:
    case 67:
      return { condition: 'Freezing rain', conditionTamil: 'உறைபனி மழை', emoji: '🌧️' };
    case 71:
      return { condition: 'Light snow', conditionTamil: 'லேசான பனிப்பொழிவு', emoji: '❄️' };
    case 73:
      return { condition: 'Moderate snow', conditionTamil: 'மிதமான பனிப்பொழிவு', emoji: '❄️' };
    case 75:
      return { condition: 'Heavy snow', conditionTamil: 'கனமான பனிப்பொழிவு', emoji: '❄️' };
    case 77:
      return { condition: 'Snow grains', conditionTamil: 'பனித்துகள்கள்', emoji: '❄️' };
    case 80:
      return { condition: 'Light rain showers', conditionTamil: 'லேசான மழைத்தூறல்', emoji: '🌦️' };
    case 81:
      return { condition: 'Moderate rain showers', conditionTamil: 'மிதமான மழைத்தூறல்', emoji: '🌦️' };
    case 82:
      return { condition: 'Heavy rain showers', conditionTamil: 'கனமழைத்தூறல்', emoji: '🌧️' };
    case 85:
      return { condition: 'Light snow showers', conditionTamil: 'லேசான பனிப்பொழிவு', emoji: '🌨️' };
    case 86:
      return { condition: 'Heavy snow showers', conditionTamil: 'கனமான பனிப்பொழிவு', emoji: '🌨️' };
    case 95:
      return { condition: 'Thunderstorm', conditionTamil: 'இடியுடன் கூடிய மழை', emoji: '⛈️' };
    case 96:
      return { condition: 'Thunderstorm with hail', conditionTamil: 'ஆலங்கட்டி மழையுடன் கூடிய இடியுடன் மழை', emoji: '⛈️' };
    case 99:
      return { condition: 'Thunderstorm with heavy hail', conditionTamil: 'கனமான ஆலங்கட்டி மழையுடன் கூடிய இடியுடன் மழை', emoji: '⛈️' };
    default:
      return { condition: 'Weather information unavailable', conditionTamil: 'வானிலை தகவல் கிடைக்கவில்லை', emoji: '🌤️' };
  }
}

app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;

  if (lat === undefined || lon === undefined) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      details: ['Query parameters lat and lon are required'],
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      details: ['lat must be a number between -90 and 90'],
    });
  }

  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      details: ['lon must be a number between -180 and 180'],
    });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1`;

    const data = await httpGetJson(url);
    const current = data.current || {};
    const hourly = data.hourly || {};

    const currentTemp = current.temperature_2m ?? 30;
    const currentHumidity = current.relative_humidity_2m ?? 60;
    const currentWindSpeed = current.wind_speed_10m ?? 0;
    const weatherCode = current.weather_code ?? 1;

    // Get rain probability from nearest hourly index
    let rainProbability = 0;
    if (hourly.precipitation_probability && Array.isArray(hourly.precipitation_probability)) {
      const hourIndex = new Date().getHours();
      rainProbability = hourly.precipitation_probability[hourIndex] ?? hourly.precipitation_probability[0] ?? 0;
    }

    const { condition, conditionTamil, emoji } = mapWMOCode(weatherCode);

    return res.json({
      location: {
        latitude,
        longitude,
      },
      current: {
        temperature: currentTemp,
        humidity: currentHumidity,
        windSpeed: currentWindSpeed,
        rainProbability,
        condition,
        conditionTamil,
        emoji,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Weather API Error]:', error.message);
    const { condition, conditionTamil, emoji } = mapWMOCode(2);
    return res.json({
      location: {
        latitude,
        longitude,
      },
      current: {
        temperature: 30,
        humidity: 65,
        windSpeed: 10,
        rainProbability: 15,
        condition,
        conditionTamil,
        emoji,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CHLORIS Backend running on port ${PORT}`);
  console.log(`  POST /api/telemetry   — telemetry ingestion (Phase 3)`);
  console.log(`  GET /api/sensor-data  — raw sensor values (Phase 1/3)`);
  console.log(`  GET /api/decisions    — computed indices + recommendation (Phase 2/3)`);
  console.log(`  GET /api/weather      — real-time weather integration (Phase 3.5)`);
});