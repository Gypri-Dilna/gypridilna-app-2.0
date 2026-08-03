# RFID Access Control - API Documentation

This document provides a detailed overview of the API endpoints for the RFID Access Control system. The backend is a Flask server that communicates with the frontend dashboard and the RFID hardware (e.g., ESP32).

## Base URL

All API endpoints are relative to the server's base URL. When running locally, this is typically `http://localhost:5000`.

---

## 1. Authentication

The web dashboard uses a simple username/password login (`admin`/`password`). API endpoints do not require a token and are accessible on the local network.

---

## 2. Endpoints

### 2.1. Access Control

#### `POST /api/check-access`

Validates an RFID chip ID, logs the attempt, and returns the result. This is the primary endpoint used by the RFID reader hardware.

**Request Body:**

```json
{
  "chip_id": "string"
}
```
*   `chip_id`: The unique identifier of the RFID chip being scanned.

**Success Response (`200 OK`):**

If access is granted:
```json
{
  "status": "GRANTED",
  "name": "John Doe",
  "daily_entry_count": 2
}
```

**Denied Response (`200 OK`):**

If access is denied for a known reason (e.g., chip blocked, expired, or unknown):
```json
{
  "status": "DENIED",
  "reason": "CHIP_BLOCKED"
}
```
*   Possible `reason` values: `UNKNOWN_CHIP`, `CHIP_BLOCKED`, `CHIP_EXPIRED`.

**Error Response (`400 Bad Request`):**

If the `chip_id` is not provided in the request.
```json
{
  "status": "DENIED",
  "reason": "NO_CHIP_ID"
}
```
---

### 2.2. Chip Management (CRUD)

#### `GET /api/chips`

Retrieves a list of all registered RFID chips.

**Request Body:** None.

**Success Response (`200 OK`):**
An array of chip objects.
```json
[
  {
    "id": 1,
    "chip_id": "1A2B3C4D",
    "name": "John Doe",
    "is_allowed": true,
    "is_one_time": false,
    "valid_until": "2025-12-31T23:59:59"
  },
  {
    "id": 2,
    "chip_id": "5E6F7G8H",
    "name": "Jane Smith",
    "is_allowed": false,
    "is_one_time": false,
    "valid_until": null
  }
]
```

#### `POST /api/chips`

Adds a new RFID chip to the system.

**Request Body:**

```json
{
  "name": "Visitor Pass",
  "chip_id": "9I0J1K2L",
  "is_allowed": true,
  "is_one_time": true,
  "valid_until": "2024-10-28T18:00:00.000Z"
}
```

**Success Response (`201 Created`):**
The newly created chip object, including its database `id`.
```json
{
  "id": 3,
  "name": "Visitor Pass",
  "chip_id": "9I0J1K2L",
  "is_allowed": true,
  "is_one_time": true,
  "valid_until": "2024-10-28T18:00:00"
}
```

#### `PUT /api/chips/<int:id>`

Updates the details of an existing chip, identified by its `id`.

**Request Body:** Same as `POST /api/chips`.

**Success Response (`200 OK`):**
The updated chip object.
```json
{
  "id": 1,
  "name": "John Doe (Admin)",
  "chip_id": "1A2B3C4D",
  "is_allowed": true,
  "is_one_time": false,
  "valid_until": null
}
```

#### `DELETE /api/chips/<int:id>`

Deletes a chip from the system, identified by its `id`.

**Request Body:** None.

**Success Response (`200 OK`):**
```json
{
  "message": "Chip deleted successfully"
}
```

---

### 2.3. Access Logs

#### `GET /api/logs`

Retrieves a list of all access log entries, sorted from newest to oldest.

**Query Parameters:**
*   `limit` (optional, integer): Limits the number of log entries returned. Example: `/api/logs?limit=5`

**Success Response (`200 OK`):**
An array of log objects.
```json
[
  {
    "id": 102,
    "timestamp": "2024-10-27T11:00:00",
    "chip_id": "MANUAL_OVERRIDE",
    "name": "Admin",
    "result": "GRANTED (OVERRIDE)"
  },
  {
    "id": 101,
    "timestamp": "2024-10-27T10:30:00",
    "chip_id": "1A2B3C4D",
    "name": "John Doe",
    "result": "GRANTED"
  }
]
```

---

### 2.4. Manual Override

This feature allows unlocking the door from the dashboard. It uses a two-endpoint system: one for the dashboard to trigger the unlock, and one for the hardware to poll.

#### `GET /api/manual-override`

Triggered by the "Unlock Door" button in the dashboard. It sets an internal server flag to request an unlock and logs the event.

**Request Body:** None.

**Success Response (`200 OK`):**
```json
{
  "status": "OVERRIDE_REQUESTED"
}
```

#### `GET /api/override-status`

This endpoint should be polled by the hardware (e.g., ESP32) every few seconds. When it returns `true`, the hardware should unlock the door. The server automatically resets the flag to `false` after sending a `true` response to prevent repeated unlocks.

**Request Body:** None.

**Success Response (`200 OK`):**

If an override was requested:
```json
{
  "override": true
}
```

If no override was requested:
```json
{
  "override": false
}
```

---

### 2.5. Service Mode

This feature allows an administrator to keep the door permanently unlocked for maintenance or other service-related needs. It uses a two-endpoint system: one for the dashboard to set the mode, and one for the hardware to poll for the current status.

#### `GET /api/service-mode`

Sets the service mode status. This is triggered by the 'Service Mode' toggle in the dashboard.

**Query Parameters:**
*   `enabled` (boolean, required): Set to `true` to enable service mode or `false` to disable it. Example: `/api/service-mode?enabled=true`

**Success Response (`200 OK`):**
```json
{
  "status": "Service mode enabled"
}
```

#### `GET /api/service-mode-status`

This endpoint should be polled by the hardware (e.g., ESP32) every few seconds to check the current state of the service mode.

**Request Body:** None.

**Success Response (`200 OK`):**

If service mode is active:
```json
{
  "enabled": true
}
```

If service mode is not active:
```json
{
  "enabled": false
}
```

---

### 2.6. Hardware Helpers

#### `GET /api/last-unknown-chip`

A helper endpoint for the web UI's 'learn mode'. When an unregistered chip is scanned at the main door, its ID is temporarily stored. This endpoint allows the frontend to retrieve that ID to auto-fill the 'Add Chip' form.

**Request Body:** None.

**Success Response (`200 OK`):**

If a new unknown chip was scanned:
```json
{
  "chip_id": "A1B2C3D4"
}
```

If no new unknown chip has been scanned since the last poll:
```json
{
  "chip_id": null
}
```