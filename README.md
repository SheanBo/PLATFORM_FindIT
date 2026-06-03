# FindIT - Lost & Found Management System

A modern Lost & Found management application for Ateneo de Naga University's Office of Student Affairs, built with React, Node.js, Express, and SQLite.

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

**Backend:** Node.js · Express · SQLite · JWT Authentication · Multer (file uploads)

## Getting Started

### Prerequisites

- Node.js v18+ and npm v9+

### Installation

**Backend Setup**

```bash
cd backend
npm install
node src/database/seed.js
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

Backend `.env` file:

```
PORT=5000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
DB_PATH=./src/database/findit.db
UPLOAD_DIR=./uploads
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Architecture Highlights

- Modern React component library with 12 reusable components
- Professional design system with consistent tokens
- Async/await backend with proper error handling
- SQLite database with views, triggers, and audit logging
- JWT-based authentication
- Role-based access control middleware
- File upload support with Multer
