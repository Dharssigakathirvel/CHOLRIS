const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { computeDecisions } = require('./decisionEngine');

const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    message: 'CHLORIS Backend is running 🌱',
  });
});

// ---------------------------------------------------------------------------
// GET /api/sensor-data
// UNCHANGED — Phase 1 endpoint. Do not modify.
// Both admin and farmer dashboards can still use this for raw sensor display.
// ---------------------------------------------------------------------------
app.get('/api/sensor-data', (req, res) => {
  res.json({
    deviceId: 'FIELD01',
    moisture: 38.0,
    temperature: 34.2,
    humidity: 71.0,
    ec: 1.24,
    light: 742,
    rain: 0,
  });
});

// ---------------------------------------------------------------------------
// GET /api/decisions
// NEW — Phase 2 Decision Engine endpoint.
// Computes IDI, ERI, SNI, CVI and a recommendation from the sensor values.
// The Decision Engine formulas are [PROTOTYPE] — see decisionEngine.js for
// full assumption classification.
// ---------------------------------------------------------------------------
app.get('/api/decisions', (req, res) => {
  // Sensor values — same source as /api/sensor-data.
  // In a future phase these will come from a live ESP32 / database read.
  const sensors = {
    deviceId:    'FIELD01',
    moisture:    38.0,
    temperature: 34.2,
    humidity:    71.0,
    ec:          1.24,
    light:       742,
    rain:        0,
  };

  const { indices, recommendation, meta } = computeDecisions(sensors);

  res.json({
    deviceId:  sensors.deviceId,
    timestamp: new Date().toISOString(),
    sensors: {
      moisture:    sensors.moisture,
      temperature: sensors.temperature,
      humidity:    sensors.humidity,
      ec:          sensors.ec,
      light:       sensors.light,
      rain:        sensors.rain,
    },
    indices,
    recommendation,
    meta,
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CHLORIS Backend running on port ${PORT}`);
  console.log(`  GET /api/sensor-data  — raw sensor values (Phase 1)`);
  console.log(`  GET /api/decisions    — computed indices + recommendation (Phase 2)`);
});