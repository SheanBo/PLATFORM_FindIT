# Backend Documentation

Complete guides for the FindIT backend architecture and features.

## Available Guides

- **[Features Guide](./FEATURES_GUIDE.md)** - Overview of all backend features and modules
- **[Matching Guide](./MATCHING_GUIDE.md)** - How the item matching algorithm works
- **[Performance Guide](./PERFORMANCE_GUIDE.md)** - Performance optimization and monitoring

## Quick Start

```bash
# Install dependencies
npm install

# Initialize database
npm run db:init

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

## Useful Commands

- `npm run dev` - Start development server with auto-reload
- `npm run db:init` - Initialize SQLite database
- `npm run db:seed` - Seed database with sample data
- `node reset-db.js` - Reset all data (keeps users)
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
backend/
├── src/
│   ├── database/         # Database initialization and seeding
│   ├── middleware/       # Express middleware (auth, etc)
│   ├── modules/          # API route modules
│   ├── utils/            # Shared utilities (audit, upload, etc)
│   ├── server.js         # Main Express app
│   └── __tests__/        # Test files
├── docs/                 # Documentation (this folder)
├── package.json          # Dependencies
└── jest.config.js        # Test configuration
```

## Database

The backend uses **SQLite** for local development. The database schema includes:

- Users (ONLINE_USER, PERSON)
- Items (FOUND_ITEM, LOST_REPORT)
- Matching (ITEM_MATCH)
- Claims (CLAIM)
- Audit logs and other tracking tables

See [MATCHING_GUIDE.md](./MATCHING_GUIDE.md) for how item matching works.
