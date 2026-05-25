# SOIP.KEYRA.IE

**Sovereign Operational Intelligence Platform** — Keyra Global Trust Infrastructure.

Standalone Next.js app (port **3060**). Isolated PostgreSQL schema: `keyra_soip`.

## Quick start

```bash
cd soip
cp .env.example .env   # set DATABASE_URL (same Postgres as Keyra, different schema)
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3060](http://localhost:3060).

## Architecture

| Layer | Role |
|-------|------|
| **PostgreSQL (`keyra_soip`)** | Intelligence, simulation, telemetry, graph, AI context |
| **Ciright MySQL** | System of record — identity, teams, personas (sync via mapping tables) |
| **SSE `/api/telemetry/stream`** | Live operational telemetry |
| **Angel Agents** | Per-widget identity-aware copilots |

## Launch countries

- **Namibia (NA)** — full sovereign simulation model
- **Ireland (IE)** — full sovereign simulation model

## Operational modes

`SIMULATION` → `HYBRID` → `LIVE` — seamless transition without architecture changes.

## Production

Deploy to Railway with `soip/railway.toml`. Point `soip.keyra.ie` DNS to the service.

Register in Keyra ecosystem via admin Apps tab or `NEXT_PUBLIC_SOIP_URL`.
