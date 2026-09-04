/**
 * CHLORIS API Configuration
 * ==========================
 * Single source of truth for the backend base URL.
 *
 * To switch between environments, change ONLY this file:
 *   - Local development: 'http://localhost:5000'
 *   - Production (Render): 'https://chloris-backend.onrender.com'
 */

export const API_BASE_URL = 'https://chloris-backend.onrender.com';

export const API_ENDPOINTS = {
  /** Raw sensor values — Phase 1 endpoint (unchanged) */
  sensorData: `${API_BASE_URL}/api/sensor-data`,

  /** Computed Decision Engine indices + recommendation — Phase 2 */
  decisions: `${API_BASE_URL}/api/decisions`,

  /** Telemetry ingestion endpoint — Phase 3 */
  telemetry: `${API_BASE_URL}/api/telemetry`,

  /** Real-time weather endpoint — Phase 3.5 */
  weather: (lat: number, lon: number) => `${API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}`,
};
