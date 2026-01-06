# Tower Hybrid - Phygital Board Game Companion

## Overview

Tower Hybrid is a hybrid digital board game companion application that combines physical board game elements with a digital interface. The app provides a mobile-first player HUD (Heads-Up Display) for managing hero stats, daily quests, tactical combat grids, and card-based abilities. Players authenticate via Replit Auth and sync their game state in real-time.

The core gameplay loop includes:
- **Profile Management**: Track XP, levels, and permanent stat bonuses earned through daily quests
- **Tactical Combat**: 6x5 grid-based combat system with hero and enemy units
- **Card System**: Hand management with attack, movement, and defense cards
- **Procedural Maps**: Node-based dungeon exploration with combat, shops, and events

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth transitions and effects
- **UI Theme**: Cyberpunk/neon aesthetic with custom CSS variables for neon colors (cyan, magenta, yellow, purple)
- **Fonts**: Orbitron (display), Rajdhani (body), Fira Code (monospace)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build Tool**: esbuild for production server bundling, Vite for client
- **API Pattern**: RESTful endpoints defined in shared routes file with Zod validation
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Key Tables**: users, dailyQuests, games, units, cards, narrativeEvents, sessions

### Authentication
- **Method**: Custom authentication with bcrypt password hashing
- **Session Storage**: PostgreSQL-backed sessions (express-session + connect-pg-simple)
- **Password Security**: Passwords hashed with bcrypt (10 salt rounds), never stored in plain text
- **Admin Access**: Email `lafranconi.andrea96@gmail.com` has admin privileges
- **Auth Endpoints**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/permissions`
- **Custom Users Table**: `custom_users` stores email, hashed password, name, admin status, camera/location permissions

### Location Tracking
- **GPS Table**: `user_locations` stores latitude, longitude, accuracy, session type (solo/tabletop/idle)
- **Permissions**: Camera and location permissions requested after login/registration
- **Privacy**: Location data only saved for authenticated users
- **API Endpoint**: `POST /api/location` saves user position with session context

### Project Structure
```
client/           # React frontend (Vite)
  src/
    components/   # Reusable UI components
    pages/        # Route-level page components
    hooks/        # Custom React hooks for data fetching
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API routes including custom auth endpoints
shared/           # Shared types, schemas, and route definitions
  schema.ts       # Drizzle database schema (includes customUsers table)
```

### Key Design Decisions

1. **Shared Type Safety**: Schema and route definitions are shared between client and server via the `shared/` directory, ensuring type consistency across the stack.

2. **Mobile-First Design**: The UI is optimized for mobile devices with bottom navigation, touch-friendly controls, and responsive layouts.

3. **Real-time Sync**: Game state is polled every second via React Query to support multi-device gameplay scenarios.

4. **Modular Auth**: Authentication is isolated in `replit_integrations/auth/` for clean separation of concerns.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `./migrations`

### Authentication
- **bcrypt**: Password hashing library
- **Required Env Vars**: `SESSION_SECRET`, `DATABASE_URL`

### Third-Party Libraries
- **shadcn/ui**: Component primitives built on Radix UI
- **Radix UI**: Accessible UI primitives for dialogs, menus, forms
- **Framer Motion**: Animation library
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities

### Build & Development
- **Vite**: Frontend dev server and bundler
- **esbuild**: Production server bundling
- **TypeScript**: Type checking across full stack