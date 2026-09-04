# CHLORIS Phase 3 — Hardware Telemetry Pipeline

## 1. Overview & What Telemetry Means in CHLORIS

In **CHLORIS**, telemetry refers to the real-time transmission of physical field environmental readings from micro-controller hardware (ESP32) placed in the crop field to the cloud backend.

These telemetry streams quantify key soil and atmospheric metrics required to assess crop stress and calculate actionable decision indices (**IDI**, **ERI**, **SNI**, **CVI**).

---

## 2. Telemetry Architecture & Data Flow

```
+------------------------------------+
|   ESP32 Micro-controller           |
|   (Soil Moisture, NPK/EC, Temp,    |
|    Humidity, Light, Rain sensors)  |
+------------------------------------+
                 |
                 | HTTP POST (JSON Payload)
                 v
+------------------------------------+
|  CHLORIS Backend (Render Node.js)  |
|  POST /api/telemetry               |
|  - Validates types & ranges        |
|  - Updates in-memory telemetry     |
|  - Updates dataSource: "TELEMETRY" |
+------------------------------------+
                 |
                 | Dynamic Data Feed
                 v
+------------------------------------+
|  CHLORIS Decision Engine           |
|  GET /api/decisions                |
|  - Computes IDI, ERI, SNI, CVI     |
|  - Generates Priority Action       |
+------------------------------------+
                 |
                 | JSON Response
                 v
+------------------------------------+
|  Mobile Apps (Farmer & Admin)      |
|  - Display Tamil / English Guidance|
|  - System Health & Telemetry Info  |
+------------------------------------+
```

---

## 3. Ingestion Endpoint Specification

### `POST /api/telemetry`

**Request Headers**: `Content-Type: application/json`

**JSON Request Body**:
```json
{
  "deviceId": "FIELD01",
  "moisture": 38.0,
  "temperature": 34.2,
  "humidity": 71.0,
  "ec": 1.24,
  "light": 742,
  "rain": 0
}
```

**Field Requirements & Validation Bounds**:
| Field | Type | Min | Max | Unit | Description |
|---|---|---|---|---|---|
| `deviceId` | string | - | - | - | Unique identifier of the field hardware unit |
| `moisture` | number | 0 | 100 | % | Volumetric soil moisture percentage |
| `temperature` | number | -10 | 60 | °C | Ambient air temperature |
| `humidity` | number | 0 | 100 | % | Relative atmospheric humidity |
| `ec` | number | 0 | 20 | mS/cm | Soil Electrical Conductivity (salinity/fertilizer proxy) |
| `light` | number | 0 | 200,000 | lux | Solar illuminance intensity |
| `rain` | number | 0 | 1,000 | mm | Rain sensor reading |

**Success Response (HTTP 200)**:
```json
{
  "success": true,
  "message": "Telemetry received and updated",
  "telemetry": {
    "deviceId": "FIELD01",
    "moisture": 38,
    "temperature": 34.2,
    "humidity": 71,
    "ec": 1.24,
    "light": 742,
    "rain": 0,
    "timestamp": "2026-09-04T22:30:00.000Z",
    "dataSource": "TELEMETRY",
    "lastTelemetryAt": "2026-09-04T22:30:00.000Z"
  }
}
```

**Error Response (HTTP 400)**:
```json
{
  "error": "Invalid telemetry",
  "details": [
    "moisture must be between 0 and 100",
    "temperature must be a number"
  ]
}
```

---

## 4. In-Memory Telemetry Storage & Fallback

- The backend initializes with a safe prototype default state on startup (`dataSource: "DEFAULT"`).
- This ensures `GET /api/sensor-data` and `GET /api/decisions` function immediately without error even before the first telemetry packet is received.
- Once `POST /api/telemetry` succeeds, `dataSource` transitions to `"TELEMETRY"` and `lastTelemetryAt` records the exact ISO timestamp of ingestion.

---

## 5. Propagation into the Decision Engine

When `GET /api/decisions` is invoked:
1. The backend retrieves the latest stored `currentTelemetry`.
2. It passes these values directly into `computeDecisions(sensors)`.
3. The Decision Engine re-calculates all four core indices:
   - **IDI (Irrigation Decision Index)**
   - **ERI (Environmental Risk Index)**
   - **SNI (Soil Nutrition Index)**
   - **CVI (Crop Vulnerability Index)**
4. The output recommendation and Tamil translation update dynamically to reflect the latest field conditions.

---

## 6. Hardware Simulator (`backend/simulator.js`)

During development and testing (before deployment of physical hardware), a Node.js simulator script acts in place of the physical ESP32.

### Usage
- **Single-shot test**:
  ```bash
  node backend/simulator.js --once
  ```
- **Continuous push mode (every 5 seconds)**:
  ```bash
  node backend/simulator.js
  ```

---

## 7. Future Physical Hardware Transition Roadmap

| Feature | Prototype (Current Phase 3) | Production Hardware (Future) |
|---|---|---|
| Sensor Data Source | `backend/simulator.js` / POST API | ESP32 WiFi/GSM micro-controller |
| Data Storage | Node.js Server Memory | MongoDB / Time-series Database |
| Hardware Protocol | HTTP POST JSON | HTTP POST or MQTT over GSM |
| Decision Pipeline | `computeDecisions()` via `POST /api/telemetry` | Unchanged (fully compatible) |
