# FuelEU Maritime Compliance Dashboard

This repository contains a full-stack FuelEU Maritime compliance assignment built as a Node.js/React monorepo with PostgreSQL persistence and hexagonal architecture in both packages.

## Overview

- `backend`: Express + TypeScript + PostgreSQL APIs for routes, comparison, compliance balance, banking, and pooling.
- `frontend`: React + TypeScript + Tailwind dashboard with four tabs: Routes, Compare, Banking, and Pooling.
- `fueleu_varuna`: PostgreSQL database created and seeded locally as part of setup.

## Architecture Summary

Both packages follow a ports-and-adapters structure.

### Backend

```text
backend/src
  core/
    domain/
    application/
    ports/
  adapters/
    inbound/http/
    outbound/postgres/
  infrastructure/
    db/
    server/
  shared/
```

- `core/domain`: route, compliance, banking, and pooling models
- `core/application`: use-cases such as `GetComplianceBalanceUseCase`
- `core/ports`: repository contracts
- `adapters/inbound/http`: Express app and request validation
- `adapters/outbound/postgres`: PostgreSQL repository implementations

### Frontend

```text
frontend/src
  core/
    domain/
    application/
    ports/
  adapters/
    ui/
    infrastructure/
  shared/
```

- `core/domain`: dashboard-facing models
- `core/application`: `DashboardService`
- `core/ports`: API gateway contract
- `adapters/infrastructure`: HTTP gateway implementation
- `adapters/ui`: React components, tabs, and charts

## Setup

Prerequisites already used locally:

- Node.js 24+
- npm
- PostgreSQL 16+

Install dependencies:

```bash
npm install
```

The local env files used during verification are:

- `backend/.env`
- `frontend/.env`

Backend environment values:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fueleu_varuna
DB_USER=postgres
DB_PASSWORD=jayapal1012
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
```

## Database Bootstrap

Create, migrate, and seed:

```bash
npm run db:create
npm run db:schema
npm run db:seed
```

## Run

Start backend and frontend together from the repo root:

```bash
npm run dev
```

Expected local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Production Build

Build both packages from the repo root:

```bash
npm run build
```

Start the production app:

```bash
npm start
```

In production, the backend serves the built frontend from the same origin, so `VITE_API_URL` is only needed for local development.

## Azure App Service Notes

- Deploy the repo root as a single Node.js app.
- Use `npm run build` as the build command.
- Use `npm start` as the startup command.
- Point the app settings at Azure Database for PostgreSQL.
- For Azure PostgreSQL, set `DB_SSL=true`.
- If you prefer a single connection string, set `DATABASE_URL` instead of the individual `DB_*` settings.

## Test

Run both packages from the repo root:

```bash
npm test
```

## Sample API Requests

Get all routes:

```bash
curl http://localhost:4000/routes
```

Set a baseline route:

```bash
curl -X POST http://localhost:4000/routes/R003/baseline
```

Get compliance balance:

```bash
curl "http://localhost:4000/compliance/cb?shipId=R002&year=2024"
```

Bank surplus:

```bash
curl -X POST http://localhost:4000/banking/bank ^
  -H "Content-Type: application/json" ^
  -d "{\"shipId\":\"R002\",\"year\":2024,\"amountGco2eq\":100000}"
```

Create a pool:

```bash
curl -X POST http://localhost:4000/pools ^
  -H "Content-Type: application/json" ^
  -d "{\"year\":2024,\"members\":[{\"shipId\":\"R002\",\"year\":2024,\"adjustedCb\":300},{\"shipId\":\"R003\",\"year\":2024,\"adjustedCb\":-100}]}"
```

## Sample Responses

`GET /compliance/cb?shipId=R002&year=2024`

```json
{
  "shipId": "R002",
  "routeId": "R002",
  "year": 2024,
  "cbGco2eq": 263082240,
  "ghgIntensity": 88,
  "energyInScopeMj": 196800000
}
```

`GET /routes/comparison`

```json
[
  {
    "routeId": "R002",
    "baselineRouteId": "R001",
    "ghgIntensity": 88,
    "baselineIntensity": 91,
    "percentDiff": -3.3,
    "compliant": true
  }
]
```

## Notes

- The seeded dataset uses the five routes from the assignment brief.
- One seeded baseline is set to `R001`.
- Banking uses `bank_entries` with `BANK` and `APPLY` entry types.
- Pooling uses greedy surplus allocation and enforces the assignment validation rules.
