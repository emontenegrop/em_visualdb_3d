# VisualDB-3D

Navigate your PostgreSQL schema as an interactive 3D universe.

## Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy async, Psycopg3, NetworkX |
| Frontend | React 18, TypeScript, React Three Fiber, Three.js, Zustand, TailwindCSS, Framer Motion |
| Infra | Docker Compose, PostgreSQL 16, Nginx |

## Quick Start

```bash
# 1. Copy env
cp .env.example .env

# 2. Launch (PostgreSQL + backend + frontend)
docker compose up --build

# Open http://localhost
```

The UI will show a connection panel. Point it at any PostgreSQL instance.

## Development

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload
# API at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/connection/test` | Test arbitrary connection |
| GET | `/api/schemas` | List schemas |
| GET | `/api/tables?schema=X` | List tables |
| GET | `/api/table/{schema}/{table}` | Table detail |
| GET | `/api/graph?layout=force&schema=X` | Full graph |
| GET | `/api/relationships` | All FK relationships |
| GET | `/api/metrics` | Graph metrics |

## Layouts

- **force** — spring layout with d3-force-like positioning via NetworkX
- **sphere** — Fibonacci sphere distribution for even distribution

## Architecture

```
PostgreSQL
  → SQLAlchemy async metadata extraction
    → NetworkX DiGraph (nodes=tables, edges=FKs)
      → FastAPI REST (JSON graph)
        → React Three Fiber
          → 3D interactive visualization
```

## Demo Schema

The `scripts/01_demo_schema.sql` script creates a sample e-commerce schema across
three PostgreSQL schemas (`auth`, `shop`, `inventory`) with realistic FK relationships
for testing the visualization.

## Features

- Dynamic PostgreSQL connection (test any DB from the UI)
- Auto-extracts: tables, columns, PKs, FKs, indexes, views, row counts, sizes
- 3D graph with force-directed and sphere layouts
- Icosahedron nodes sized by row count and degree
- Bezier curve edges for FK relationships
- Node hover/click with detail panel (columns, FKs, stats)
- Schema filter and text search
- Graph metrics: density, centrality, isolated tables
- Cyberpunk dark UI with glass morphism
