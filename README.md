# FindIT - Lost & Found Management System

A modern Lost & Found management application for Ateneo de Naga University's Office of Student Affairs, built with React, Node.js, Express, and PostgreSQL (Supabase).

## Features

- Report lost items with photos and descriptions
- Register and track found items
- Smart auto-matching algorithm (40-100 score scale)
- Claim management and verification workflow
- Storage management with capacity tracking
- Real-time dashboard and analytics
- Role-based access control (Student, Staff, Admin)

## Tech Stack

**Frontend:** React 18 · Vite · Tailwind CSS · React Router v6 · Lucide Icons

**Backend:** Node.js · Express · PostgreSQL (Supabase) · JWT Authentication · Multer + Supabase Storage (file uploads)

## Getting Started

### Prerequisites

- Node.js v18+ and npm v9+
- A PostgreSQL database — either a local Postgres server or a [Supabase](https://supabase.com) project

### Installation

**Backend Setup**

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL (and TEST_DATABASE_URL if you'll run tests) to point at
# your Postgres/Supabase database, and set JWT_SECRET to a long random string.
# For a local, non-TLS Postgres server also set PGSSL=disable.
npm run db:init   # applies the schema (tables/views/triggers) — run once per database
npm run db:seed   # loads demo data
npm run dev
```

Backend runs on `http://localhost:5000`

**Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Run with Docker (no Node/Postgres install needed)

With [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed,
one command runs the whole stack — database included:

```bash
docker compose up --build
```

Then open `http://localhost:8080`. On first start the database schema is
applied and demo data is seeded automatically; data persists across restarts
in a Docker volume. Stop with `Ctrl+C` (or `docker compose down`; add `-v` to
also wipe the database).

Note: photo uploads need a Supabase project — set `SUPABASE_URL` and
`SUPABASE_SERVICE_KEY` in your shell before `docker compose up` to enable
them. Every other feature works without it.

### Demo Credentials

All accounts use password: `Password123!`

| Role | Username |
|------|----------|
| Admin | admin |
| Staff | staff1 |
| Student | juan.delacruz |

## Project Structure

```
findit/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── database/
│   │   │   ├── init.js (schema)
│   │   │   └── seed.js (demo data)
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── lost-reports/
│   │   │   ├── found-items/
│   │   │   ├── matching/
│   │   │   ├── claims/
│   │   │   ├── storage/
│   │   │   └── dashboard/
│   │   └── utils/
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ui/ (12 modern components)
    │   ├── modules/
    │   ├── lib/
    │   └── App.jsx
    └── package.json
```

## Key Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Current user

### Lost Reports & Found Items
- `GET/POST /api/findit-lost-reports` - Lost report management
- `GET/POST /api/findit-found-items` - Found item management
- `GET /api/findit-matching` - View matches
- `GET/POST /api/findit-claims` - Claim management

### Dashboard (Staff/Admin only)
- `GET /api/findit-dashboard/stats` - Statistics
- `GET /api/findit-dashboard/analytics` - Analytics

## Matching Algorithm

Matches lost items with found items using weighted scoring:

| Attribute | Weight |
|-----------|--------|
| Category | 40% |
| Color | 20% |
| Brand | 20% |
| Size | 10% |
| Location | 10% |

Minimum match score: **60/100**

## User Roles

| Feature | Student | Staff | Admin |
|---------|---------|-------|-------|
| File lost report | Yes | Yes | Yes |
| Register found item | No | Yes | Yes |
| Verify claims | No | Yes | Yes |
| Run auto-match | No | Yes | Yes |
| Manage storage | No | Yes | Yes |
| View analytics | No | Yes | Yes |
| Manage users | No | No | Yes |

## Documentation

- **UI_UX_IMPROVEMENTS.md** - Implementation guide for UI components
- **COMPONENT_REFERENCE.md** - Component API documentation
- **QUICK_START.md** - Quick start guide for implementing UI changes

## Environment Setup

Backend `.env` file (see `backend/.env.example`):

```
PORT=5000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Postgres (Supabase). Use the Supabase transaction pooler (port 6543) in prod.
DATABASE_URL=postgres://postgres:postgres@localhost:5432/findit
# Used only by the test suite:
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/findit_test
# Set to "disable" for a local, non-TLS Postgres server; omit/leave default for Supabase.
PGSSL=disable

# Supabase Storage (photo uploads)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_BUCKET=item-photos

NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Architecture Highlights

- Modern React component library with 12 reusable components
- Professional design system with consistent tokens
- Async/await backend with proper error handling
- PostgreSQL database (Supabase) with views, triggers, and audit logging; schema applied once via `npm run db:init`, not on every boot in production
- JWT-based authentication
- Role-based access control middleware
- File upload support with Multer, stored in Supabase Storage
- Postgres-backed rate limiting for consistency across serverless instances
