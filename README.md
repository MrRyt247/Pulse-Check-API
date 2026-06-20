# Pulse-Check-API ("Watchdog" Sentinel)

This challenge is designed to test your ability to bridge Computer Science fundamentals with Modern Backend Engineering.

---

## Overview

Pulse-Check-API is a dead man's switch API for monitoring remote sensors/devices. Each device ("monitor") is given a timeout. It must "check in" (send a heartbeat) before that timeout elapses. If it goes silent for longer than its timeout, the monitor is automatically marked **down** and an alert is triggered.

---

## How it works

1. An admin **registers** a monitor with an `id`, a `timeout` (in seconds), and an `alert_email`.
2. A countdown timer starts. The device is expected to send a **heartbeat** before the timer expires.
3. Each heartbeat **resets** the countdown.
4. If no heartbeat arrives in time, the timer fires: the monitor's status flips to `down` and an alert is logged.
5. Technicians can **pause** monitors to make repairs.
6. Admins can **edit**, **delete**, and **list** monitors.

---

## Tech stack

- **Runtime:** Node.js (ESM)
- **Language:** TypeScript
- **Framework:** Express 5
- **Validation:** Zod
- **CORS:** `cors` middleware
- **Persistence:** `node-localstorage` (a file-backed `localStorage` shim).
  Data is stored under `./scratch/` (one file per monitor).
- **Dev tooling:** `tsx` + `nodemon`

---

## Project structure

```
src/
├── index.ts                  # App bootstrap: CORS, JSON, routes, timer rehydration
├── modules/
│   └── monitors.routes.ts    # /monitors routes
└── utils/
    ├── model.ts              # Monitor interface + Zod schemas
    └── monitors.store.ts     # Persistence (localStorage) + in-memory countdown timers
```

---

## 1. Architecture Diagram

![sequence diagram](./sequence_diagram.webp)

## 2. Setup Instruction

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (v22+ recommended)
- npm (bundled with Node.js)
- [git](https://git-scm.com/)

### Installation

1. Clone the repository and move into the project directory:

   ```bash
   git clone https://github.com/MrRyt247/Pulse-Check-API.git
   cd Pulse-Check-API
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Running the project

Start the development server:

```bash
npm run dev
```

### Configuration (environment variables)

| Variable       | Default | Description                                             |
| -------------- | ------- | ------------------------------------------------------- |
| `PORT`         | `3000`  | Port the server listens on.                             |
| `FRONTEND_URL` | `*`     | Allowed CORS origin.`*` reflects any origin (dev only). |

The server starts on [http://localhost:3000](http://localhost:3000) by default.

## 3. API Documentation

### Health check

```
GET /
```

**200**

```json
{ "message": "Hello from Pulse-Check" }
```

---

### Admin Creates a New Monitor

```
POST /monitors
```

**Body**

| Field         | Type   | Description                            |
| ------------- | ------ | -------------------------------------- |
| `id`          | string | Unique monitor id.                     |
| `timeout`     | number | Seconds allowed between heartbeats.    |
| `alert_email` | string | Email to alert when the monitor trips. |

**Example**

```bash
curl -X POST http://localhost:3000/monitors \
  -H "Content-Type: application/json" \
  -d '{ "id": "device-1", "timeout": 30, "alert_email": "admin@critmon.com" }'
```

**201**

```json
{ "message": "Monitor device-1 registered for 30s" }
```

**400** — a monitor with that `id` already exists.

```json
{ "error": "Monitor device-1 already exists" }
```

---

### Monitor Sends a Heartbeat (Reset)

Resets the countdown and reactivates the monitor.

```
POST /monitors/:id/heartbeat
```

**Example**

```bash
curl -X POST http://localhost:3000/monitors/device-1/heartbeat
```

**200**

```json
{ "message": "Monitor device-1 heartbeat" }
```

**404** — unknown monitor id.

```json
{ "error": "Monitor device-1 not found" }
```

---

### Technician Pauses a Monitor

Stops the countdown for an `active` monitor. No alert fires while paused.

```
POST /monitors/:id/heartbeat/pause
```

**Example**

```bash
curl -X POST http://localhost:3000/monitors/device-1/heartbeat/pause
```

**200**

```json
{ "message": "Monitor device-1 paused" }
```

**404** — unknown monitor id.

**409** — the monitor cannot be paused in its current state:

```json
{ "error": "Monitor device-1 is already paused" }
```

```json
{ "error": "Monitor device-1 is already down" }
```

> To resume a paused monitor, send a heartbeat — it sets the monitor back to
> `active` and restarts the countdown with a fresh window.

---

### **The Developer's Choice**

### Admin Gets All Registered Monitors

```
GET /monitors
```

**200**

```json
{
  "count": 1,
  "monitors": [
    {
      "id": "device-1",
      "timeout": 30,
      "alert_email": "admin@critmon.com",
      "status": "active",
      "createdAt": 1750000000000,
      "lastSeen": 1750000000000
    }
  ]
}
```

An empty store returns `{ "count": 0, "monitors": [] }`.

---

### Admin Edits a Monitor's Details

Partial update of `timeout` and/or `alert_email`. Server-owned fields
(`id`, `status`, `createdAt`, `lastSeen`) cannot be edited. Input is validated with Zod.

```
PATCH /monitors/:id
```

**Body** (at least one field required)

| Field         | Type   | Validation                              |
| ------------- | ------ | --------------------------------------- |
| `timeout`     | number | Positive integer (coerced from string). |
| `alert_email` | string | Valid email address.                    |

**Example**

```bash
curl -X PATCH http://localhost:3000/monitors/device-1 \
  -H "Content-Type: application/json" \
  -d '{ "timeout": "60" }'
```

**200**

```json
{ "message": "Monitor device-1 updated" }
```

**400** — validation failed (the `error` field is an array of messages):

```json
{ "error": ["Provide timeout and/or alert_email to update"] }
```

**404** — unknown monitor id.

> Changing `timeout` re-arms the countdown with a fresh full window (only if the
> monitor is currently `active`). Editing `alert_email` alone leaves the timer
> untouched.

---

### Admin Deletes a Monitor

Removes the monitor and clears its timer.

```
DELETE /monitors/:id
```

**Example**

```bash
curl -X DELETE http://localhost:3000/monitors/device-1
```

**200**

```json
{ "message": "Monitor device-1 deleted" }
```

**404** — unknown monitor id.

## Notes

- **Persistent data** is written to `node-localstorage`, so it survives a process restart.
- **Live countdown timers** are plain `setTimeout` handles held in an in-memory `Map`. Timer handles cannot be serialized, so on startup `rehydrateTimers()` re-arms a timer for each active monitor based on the time remaining. If the window already elapsed while the process was down, the timer fires (near) immediately.
- **`timeout` is in seconds** everywhere, converted to milliseconds internally.
- **Storage location:** monitor records are written to `./scratch/`.
- **Single-process only.** Timers live in memory, so this won't work correctly across multiple instances or in serverless deployments. Fine for development and demos; production would need a durable scheduler or a periodic sweep over `lastSeen`.
- **No authentication** was implemented due to the focus on the dead man's swwitch API.
