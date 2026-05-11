# FindIT — Lost & Found Management System
**Ateneo de Naga University — Office of Student Affairs**

---

## Tech Stack
- **Backend:** Node.js · Express · SQLite (better-sqlite3) · JWT · Multer
- **Frontend:** React 18 · Vite · Tailwind CSS · React Router v6 · React Hook Form

---

## Quick Start

### Prerequisites
- Node.js v18+
- npm v9+

> **Note:** `better-sqlite3` requires native compilation.
> On Windows, install: `npm install --global windows-build-tools`
> On Linux/Mac: ensure `build-essential` (Linux) or Xcode CLI tools (Mac) are installed.

---

### 1. Backend Setup

```bash
cd backend

# Copy env file
cp .env.example .env
# Edit .env if needed (default settings work for local dev)

# Install dependencies
npm install

# Initialize database + seed demo data
node src/database/init.js
node src/database/seed.js

# Start backend (port 5000)
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend (port 5173)
npm run dev
```

### 3. Open Browser
Navigate to: **http://localhost:5173**

---

## Demo Credentials
All accounts use password: `Password123!`

| Role    | Username         |
|---------|-----------------|
| Admin   | `admin`         |
| Staff   | `staff1`        |
| Student | `juan.delacruz` |
| Student | `maria.santos`  |
| Student | `carlo.reyes`   |

---

## Project Structure

```
findit/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js              ← Express entry point
│       ├── database/
│       │   ├── init.js            ← Schema + views + triggers
│       │   ├── seed.js            ← Demo data
│       │   └── findit.db          ← SQLite database (auto-created)
│       ├── middleware/
│       │   └── auth.middleware.js
│       ├── utils/
│       │   ├── audit.js
│       │   └── upload.js
│       └── modules/
│           ├── auth/              → POST /api/auth/login|register, GET /api/auth/me
│           ├── lost-reports/      → /api/findit-lost-reports
│           ├── found-items/       → /api/findit-found-items
│           ├── matching/          → /api/findit-matching
│           ├── claims/            → /api/findit-claims
│           ├── storage/           → /api/findit-storage
│           └── dashboard/         → /api/findit-dashboard/*
└── frontend/
    └── src/
        ├── App.jsx
        ├── lib/
        │   ├── api.js             ← Axios instance
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Layout.jsx
        │   └── ui/
        │       ├── StatusBadge.jsx
        │       ├── Pagination.jsx
        │       ├── Modal.jsx
        │       └── ConfirmDialog.jsx
        └── modules/
            ├── auth/
            ├── dashboard/
            ├── lost-reports/
            ├── found-items/
            ├── matching/
            ├── claims/
            └── storage/
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| GET | `/api/auth/me` | Authenticated |

### Lost Reports
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/findit-lost-reports` | All users |
| GET | `/api/findit-lost-reports/:id` | All users |
| POST | `/api/findit-lost-reports` | All users |
| PUT | `/api/findit-lost-reports/:id` | Owner / Staff / Admin |
| DELETE | `/api/findit-lost-reports/:id` | Owner / Staff / Admin |

### Found Items
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/findit-found-items` | All users |
| GET | `/api/findit-found-items/:id` | All users |
| POST | `/api/findit-found-items` | Staff / Admin |
| PUT | `/api/findit-found-items/:id` | Staff / Admin |
| DELETE | `/api/findit-found-items/:id` | Admin |
| GET | `/api/findit-found-items/expired/list` | Staff / Admin |

### Matching
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/findit-matching` | All users |
| GET | `/api/findit-matching/:id` | All users |
| POST | `/api/findit-matching/run` | Staff / Admin |
| POST | `/api/findit-matching/manual` | Staff / Admin |
| PUT | `/api/findit-matching/:id/status` | Staff / Admin |

### Claims
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/findit-claims` | All users |
| GET | `/api/findit-claims/:id` | All users |
| POST | `/api/findit-claims` | All users |
| PUT | `/api/findit-claims/:id/verify` | Staff / Admin |
| PUT | `/api/findit-claims/:id/acknowledge` | Student (owner) |

### Storage
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/findit-storage` | Staff / Admin |
| GET | `/api/findit-storage/:id` | Staff / Admin |
| POST | `/api/findit-storage` | Admin |
| PUT | `/api/findit-storage/:id` | Admin |
| GET | `/api/findit-storage/expired/items` | Staff / Admin |
| PUT | `/api/findit-storage/items/:id/move` | Staff / Admin |

### Dashboard
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/findit-dashboard/stats` | Staff / Admin |
| GET | `/api/findit-dashboard/recent-activity` | Staff / Admin |
| GET | `/api/findit-dashboard/analytics` | Admin |
| GET | `/api/findit-dashboard/my-stats` | All users |
| GET | `/api/findit-dashboard/locations` | All users |
| GET | `/api/findit-dashboard/categories` | All users |
| GET | `/api/findit-dashboard/users` | Admin |
| PUT | `/api/findit-dashboard/users/:id/toggle` | Admin |
| PUT | `/api/findit-dashboard/users/:id/role` | Admin |

---

## Matching Score Formula
| Attribute | Weight |
|-----------|--------|
| Category  | 40%    |
| Color     | 20%    |
| Brand     | 20%    |
| Size      | 10%    |
| Location  | 10%    |

Minimum score to surface a match: **60/100**

---

## User Roles & Permissions
| Feature | Student | Staff | Admin |
|---------|---------|-------|-------|
| File lost report | ✅ | ✅ | ✅ |
| View found items | ✅ | ✅ | ✅ |
| View matches (own) | ✅ | ✅ | ✅ |
| File claim | ✅ | ✅ | ✅ |
| Register found item | ❌ | ✅ | ✅ |
| Run auto-match | ❌ | ✅ | ✅ |
| Verify claims | ❌ | ✅ | ✅ |
| Manage storage | ❌ | ✅ | ✅ |
| Dashboard/Analytics | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Create storage sections | ❌ | ❌ | ✅ |
| Dispose items | ❌ | ❌ | ✅ |

---

## Environment Variables (backend/.env)
```
PORT=5000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
DB_PATH=./src/database/findit.db
UPLOAD_DIR=./uploads
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```
