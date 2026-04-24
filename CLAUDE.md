# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start the app (node app.js)
node app.js        # Equivalent
```

- Web server runs on `http://127.0.0.1:3001` (configurable via `WEB_PORT` in `.env`)
- WebSocket server runs on port 5000 (hardcoded in `websocket/ws.js`)
- No test framework is configured

## Architecture Overview

This is a Node.js/Express app for managing dormitory power and access control across multiple schools. It communicates with RS485 hardware meters over serial port, stores data in SQLite, and serves school-specific web UIs.

### Request Flow

1. Browser sends `POST /command` with `{ module, args }`
2. [app.js](app.js) dispatches to the matching handler in `communication_js/index.js`
3. Handler queries SQLite, builds a 100-byte RS485 packet, sends via serial port, waits for response
4. Handler broadcasts result to WebSocket clients and returns JSON

### Key Layers

**Backend ([app.js](app.js))**
- Express routes for school UIs: `/`, `/oit`, `/knu`, `/cpu`, `/ntut`, `/hk`, `/hk-old`, `/settings`
- REST API at `/api/settings` for rooms, members, COM ports, and key/value config
- `POST /command` routes to `communication_js/index.js` dispatcher (lazy-loaded to avoid startup failures when no serial port is connected)
- SQLite connection initialized at startup; COM port loaded from DB, falling back to env

**Hardware Communication ([communication_js/](communication_js/))**
- `SerialDataHandler.js` — low-level RS485 I/O: opens port, sends packet, reads 100-byte response with 3 retries and 1000ms timeout
- `index.js` — dispatches `{ module, args }` to named handlers; `module` is a Python-style dotted class path (e.g. `communication.Alive`) and `args` is a key/value object
- Each handler: queries DB → builds packet → calls `executeTransaction()` → broadcasts via WebSocket → returns JSON
- `Data/model/HardWareEnum.js` — protocol constants (control tokens 0x10–0x1A, response tokens 0x30–0x38, kiosk 0xE0–0xF1)
- `Data/model/DataConvertBytes.js` — packet builders; packets are 100 bytes: byte[0]=0x55 (header), byte[97]=checksum, byte[98]=0, byte[99]=0x0A (footer), bytes[91–96]=timestamp

**Database ([communication_js/Data/dal/](communication_js/Data/dal/))**
- SQLite via `better-sqlite3`, WAL mode enabled
- Tables: `settings` (key/value), `host` (buildings), `room` (meters/rooms), `member` (students), `center_id_card`, `log_data`
- `db.js` — schema setup; `connect.js` — async wrapper; separate `sql_*.js` files per domain

**WebSocket ([websocket/ws.js](websocket/ws.js))**
- Server on port 5000; broadcasts JSON to all clients when `cmd: 'new_log'` received
- Client at `static/js/ws.js` listens and calls `addTable()` / `addDecEvent()` to update the UI in real time

**Frontend ([static/js/](static/js/), [views/](views/))**
- Each school has an isolated module directory: `hk/`, `ntut/`, `oit/`, `knu/`, `cpu/`
- Common files per school: `index.js` (controller), `type.js` (data types), `table.js` (rendering), `modeParser.js` (billing mode bits), `search.js` (filters), `commandBtn.js` (hardware commands), `move.js` (room/member movement)
- Vanilla JS + Bootstrap 5; no build step

### School Modules

| Route | Module dir | School |
|-------|-----------|--------|
| `/` | — | Portal (index.html) |
| `/ntut` | `static/js/ntut/` | 北科大 |
| `/oit` | `static/js/oit/` | 亞東 |
| `/knu` | `static/js/knu/` | 開南 |
| `/cpu` | `static/js/cpu/` | 警大 |
| `/hk` | `static/js/hk/` | HK |
| `/hk-old` | `static/js/hk-old/` | HK (legacy) |
| `/settings` | — | System config |

Each school's UI handles file-upload log parsing independently while sharing the same backend hardware commands.

## Environment Variables

See [.env_example](.env_example):

```
WEB_PORT=3001          # Express port
COM_PORT=COM7          # RS485 serial port (can be overridden by DB setting)
BAUD_RATE=57600        # Serial baud rate
PAYMENT_METHOD=EasyCard
DEFAULT_DONG=A         # Default building identifier
```

The COM port saved in the `settings` table takes precedence over `COM_PORT` in `.env`.
