# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Duperheroes" is a superhero identification web game featuring satirical animal-themed superheroes. The application consists of a public game website and a password-protected admin site for managing the superhero database. Players can compete in single-user modes (Beat the Clock, Speedrun, Practice) and optional multiplayer battles, earning in-game currency (Hero Points) to purchase cosmetic items.

## Development Commands

### Primary Development
- `npm run dev` - Start both client and server in development mode
- `npm run dev:server` - Start only the Express server (port 3001)
- `npm run dev:client` - Start only the Vite dev server (port 5173)

### Building
- `npm run build` - Build both client and server for production
- `npm run build:server` - Build server only (outputs to dist/)
- `npm run build:client` - Build client only (outputs to dist/client/)
- `npm start` - Run production server from dist/

### Testing
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- Coverage threshold: 70% branches, functions, lines, statements

### Code Quality
- `npm run lint` - Run ESLint on src/ directory
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without changes
- `npm run typecheck` - TypeScript type checking for client
- `npm run typecheck:server` - TypeScript type checking for server

### Database Management
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database (delete, migrate, seed)

### Docker
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run production container
- `npm run docker:dev` - Start development environment with docker-compose

## Architecture

### Full-Stack TypeScript Monolith
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + WebSocket
- **Database**: SQLite (single file, no installation required)
- **Build System**: Vite for client, TSC for server
- **Testing**: Jest with ts-jest preset

### Project Structure
```
src/
├── client/           # React frontend (Vite root)
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.html
│   └── pages/        # Page components
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   └── routes/       # API route handlers
├── database/         # SQLite schema and utilities
│   ├── database.ts   # Database connection
│   ├── migrate.ts    # Migration runner
│   ├── schema.sql    # Database schema
│   └── seed.ts       # Seed data
└── shared/           # Shared types and utilities
```

### Development Servers
- **Client Dev Server**: Vite on port 5173 with proxy to server
- **Server**: Express on port 3001 (proxied from Vite)
- **Proxied Routes**: `/api/*` and `/uploads/*` → backend server

### Database Architecture
- **SQLite Database**: Single file database (database.sqlite)
- **Key Tables**: superheroes, superhero_images, users, game_stats, admin_users
- **Admin System**: Password-protected interface for content management
- **Character Theme**: 50 satirical animal-themed superhero parodies

## Character Database

The game features 50 satirical animal-themed superheroes that parody Marvel characters:
- **Difficulty Levels**: Easy (4), Medium (33), Hard (13)
- **Animal Types**: Mammals (34), Birds (9), Reptiles/Amphibians (5), Sea Creatures (2)
- **Examples**: Captain Canine (Captain America), Hulk-a-Hopper (Hulk), Spider-Swinger (Spider-Man)

Each character includes:
- Real name and superhero name
- Powers and origin story
- Multiple high-quality images
- Difficulty rating for matchmaking
- Animal theme and original hero inspiration

## Configuration Files

### TypeScript
- `tsconfig.json` - Client TypeScript config (React, strict mode)
- `tsconfig.server.json` - Server TypeScript config (Node.js)
- Strict compilation with comprehensive type checking

### Code Quality
- **ESLint**: TypeScript + Prettier integration, Jest environment
- **Prettier**: Single quotes, 80 char width, 2-space tabs
- **Husky + lint-staged**: Pre-commit hooks for formatting and linting

### Testing
- **Jest**: Node environment with ts-jest preset
- **Path mapping**: `@/*` aliases for src directories
- **Setup file**: `src/test/setup.ts`
- **Coverage**: HTML and LCOV reports in coverage/

## Development Workflow

### Game Modes Implementation
- **Single-user modes**: Beat the Clock (60s), Speedrun (25 questions), Practice (unlimited)
- **Multiplayer**: Real-time WebSocket battles between players
- **Admin interface**: Superhero database management with image uploads

### Key Technologies
- **WebSocket**: Real-time multiplayer communication
- **SQLite**: Embedded database for simplicity
- **Vite**: Fast development and optimized builds
- **Tailwind CSS**: Utility-first styling
- **Sharp**: Image processing and optimization

### Environment Requirements
- Node.js ≥18.0.0
- npm ≥9.0.0
- Modern browser with WebSocket support

## Testing Strategy

### Unit Testing
- Jest with TypeScript support
- Component testing for React
- API endpoint testing with Supertest
- Database operation testing

### File Patterns
- `**/__tests__/**/*.+(ts|tsx|js)`
- `**/*.(test|spec).+(ts|tsx|js)`
- Setup file automatically loaded: `src/test/setup.ts`

### Coverage Requirements
- Minimum 70% coverage across all metrics
- Excludes: type definitions, test files, index files