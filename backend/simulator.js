/**
 * CHLORIS Hardware Telemetry Simulator
 * =====================================
 * Development-only script that simulates an ESP32 micro-controller
 * sending periodic telemetry payload to the CHLORIS backend.
 *
 * Usage:
 *   Continuous mode (pushes every 5 seconds):
 *     node backend/simulator.js
 *
 *   Single-shot mode (sends 1 telemetry push and exits):
 *     node backend/simulator.js --once
 *
 * Target URL defaults to http://localhost:5000/api/telemetry
 * Override via environment variable: TARGET_URL=https://... node backend/simulator.js
 */

'use strict';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5000/api/telemetry';
const IS_ONCE = process.argv.includes('--once');
const INTERVAL_MS = 5000;

// Baseline state for realistic smooth drift simulation
let telemetryState = {
  deviceId: 'FIELD01',
  moisture: 38.0,
  temperature: 34.2,
  humidity: 71.0,
  ec: 1.24,
  light: 742,
  rain: 0,
};

function round(val, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Mutates telemetry state slightly to mimic real environmental fluctuations.
 */
function updateTelemetryState() {
  // Moisture drifts between 15% and 85%
  telemetryState.moisture = round(
    Math.max(15, Math.min(85, telemetryState.moisture + (Math.random() - 0.52) * 1.5))
  );

  // Temperature drifts between 20°C and 42°C
  telemetryState.temperature = round(
    Math.max(20, Math.min(42, telemetryState.temperature + (Math.random() - 0.48) * 0.8))
  );

  // Humidity drifts between 40% and 95%
  telemetryState.humidity = round(
    Math.max(40, Math.min(95, telemetryState.humidity + (Math.random() - 0.5) * 2.0))
  );

  // EC drifts between 0.8 and 2.5 mS/cm
  telemetryState.ec = round(
    Math.max(0.8, Math.min(2.5, telemetryState.ec + (Math.random() - 0.5) * 0.05))
  );

  // Light drifts between 200 and 1500 lux
  telemetryState.light = Math.round(
    Math.max(200, Math.min(1500, telemetryState.light + (Math.random() - 0.5) * 40))
  );

  // Rain: mostly 0, occasionally slight shower
  telemetryState.rain = Math.random() > 0.95 ? round(Math.random() * 3) : 0;
}

async function sendTelemetry() {
  updateTelemetryState();
  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n[${timestamp}] 📡 [SIMULATOR] Sending telemetry to ${TARGET_URL} ...`);
  console.log('   Payload:', JSON.stringify(telemetryState, null, 2));

  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telemetryState),
    });

    const status = response.status;
    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ Status ${status} OK — Server stored telemetry successfully.`);
      console.log(`   Data Source: ${data.telemetry?.dataSource}`);
    } else {
      console.error(`   ❌ Status ${status} Error:`, data);
    }
  } catch (error) {
    console.error(`   ❌ Connection Failed: ${error.message}`);
    console.error('   Ensure the CHLORIS backend server is running on ' + TARGET_URL);
  }
}

async function main() {
  console.log('=====================================================');
  console.log('🌱 CHLORIS ESP32 Telemetry Hardware Simulator');
  console.log(`   Target: ${TARGET_URL}`);
  console.log(`   Mode:   ${IS_ONCE ? 'Single Shot (--once)' : 'Continuous (every 5s)'}`);
  console.log('=====================================================');

  await sendTelemetry();

  if (IS_ONCE) {
    console.log('\n[SIMULATOR] Single shot complete. Exiting.');
    process.exit(0);
  } else {
    setInterval(sendTelemetry, INTERVAL_MS);
  }
}

main();
