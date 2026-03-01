# AGENTS.md - Coding Guidelines for Multiplayer-Proto

This guide provides coding standards and build instructions for AI coding agents working in this repository.

## Project Overview

Real-time multiplayer game using TypeScript, Socket.IO, HTML5 Canvas, and Express. Architecture:
- **Backend**: `/server/` - Node.js with Socket.IO for real-time networking
- **Frontend**: `/public/` - Vanilla TypeScript with Canvas rendering (no framework)
- **Shared Types**: `/types.ts` - Interfaces shared between client and server
- **Map Data**: Tiled map editor files (`.tmx`, `.json`, `.tsx`) at root

## Build & Development Commands

### Build
```bash
npm run build                # Build both backend and frontend
npm run build:backend        # Compile TypeScript → dist/
npm run build:frontend       # Bundle frontend with esbuild → public/dist/bundle.js
```

### Development (Hot Reload)
```bash
npm run dev                  # Run backend + frontend concurrently with auto-reload
npm run dev:backend          # Backend only (nodemon + ts-node)
npm run dev:frontend         # Frontend only (esbuild --watch)
```

### Production
```bash
npm start                    # Start compiled backend from dist/server/server.js
```

### Testing
**No test framework configured.** Test script exits with error.
- To add testing: Install Jest/Vitest, create `*.test.ts` files, add test script to package.json

### Linting & Formatting
**No linter or formatter configured.**
- No ESLint, Prettier, or similar tools installed
- Rely on TypeScript strict mode for type safety

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode enabled**: All strict checks active (`noImplicitAny`, `strictNullChecks`, etc.)
- **Module systems**: CommonJS for backend, ES2020 modules for frontend
- **Target**: ES2020 for both
- **Source maps**: Enabled for debugging

### Import Organization

**Order**:
1. External libraries (socket.io, express)
2. Type-only imports using `import type` keyword
3. Internal modules (relative paths)

**Examples**:
```typescript
// External
import { io } from "socket.io-client";
import express from "express";

// Type-only imports (separate from runtime)
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";

// Internal
import { PORT } from "./config/constants";
import { setupSocketHandlers } from "./handlers/socketHandlers";
```

**Always use relative imports** - no path aliases except `../types` for frontend.

### Type Definitions

**Use `interface` (not `type`)** for all object type definitions:
```typescript
// ✅ Correct
export interface Player {
  x: number;
  y: number;
  health: number;
}

// ❌ Avoid
export type Player = {
  x: number;
  y: number;
};
```

**Type-only imports**: Separate types from runtime code:
```typescript
import type { Player, Projectile } from "../types";  // ✅ Compile-time only
import { getNextProjectileId } from "./utils";       // Runtime
```

**No `any` types** - maintain strict type safety. TypeScript will catch violations.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables/Functions | camelCase | `backEndPlayers`, `resetPlayer()` |
| Classes | PascalCase | `Game`, `Player`, `Projectile` |
| Constants (config) | UPPER_SNAKE_CASE | `PORT`, `GAMEWIDTH`, `SPEED` |
| Interfaces | PascalCase | `PlayerInterface`, `CameraInterface` |
| Files (classes) | PascalCase | `Player.ts`, `Game.ts` |
| Files (utilities) | camelCase | `constants.ts`, `gameState.ts` |
| Booleans | Descriptive | `keys.w.pressed` (not `isPressed`) |

### Error Handling

**Use guard clauses** (early returns) instead of nested if-else:
```typescript
// ✅ Preferred
socket.on("keydown", ({ keycode }) => {
  const backEndPlayer = backEndPlayers[socket.id];
  if (!backEndPlayer) return;  // Guard clause
  
  // Continue with logic...
});

// ❌ Avoid deep nesting
if (backEndPlayer) {
  if (backEndPlayer.health > 0) {
    // nested logic
  }
}
```

**Defensive checks** for existence and boundaries:
```typescript
if (!frontEndPlayers[id]) {
  // Handle missing player
}

if (player.x - player.radius < 64) {
  player.x = player.radius + 64;  // Boundary enforcement
}
```

**No try-catch blocks in current codebase** - relies on defensive programming.

### Comments & Documentation

**JSDoc for functions**:
```typescript
/**
 * Checks if a rectangle collides with any obstacles on the map
 * @param x - X coordinate of the rectangle's top-left corner
 * @param y - Y coordinate of the rectangle's top-left corner
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @returns true if collision detected, false otherwise
 */
export function obstacleCollision(
  x: number,
  y: number,
  width: number,
  height: number
): boolean { ... }
```

**Module-level comments** at top of files:
```typescript
// Game State Management
// Socket.IO Event Handlers
```

**Inline comments** for complex logic:
```typescript
// Collision detection: projectile hit a player
if (DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius) { ... }

// Revert movement if collision detected
if (obstacleCollision(...)) {
  backEndPlayer.x += SPEED;
}
```

### Class Structure

```typescript
export default class Player implements PlayerInterface {
  // Public properties (typed)
  x: number;
  y: number;
  health: number;
  
  // Constructor with destructured, typed params
  constructor({ x, y, health, ... }: PlayerConstructorParams) {
    this.x = x;
    this.y = y;
    this.health = health;
  }
  
  // Methods with explicit return types
  draw(camera: CameraInterface): void {
    // Implementation
  }
  
  update(): void {
    // Implementation
  }
}
```

### Function Patterns

**Destructured parameters** with types:
```typescript
socket.on("shoot", ({ x, y, angle }: { x: number; y: number; angle: number }) => {
  // Handle shoot event
});
```

**Explicit return types**:
```typescript
export function getNextProjectileId(): number {  // Explicit return type
  projectileIdCounter++;
  return projectileIdCounter;
}
```

### State Management

**Centralized state objects** with Record types:
```typescript
export const backEndPlayers: Record<string, Player> = {};
export const backEndProjectiles: Record<number, Projectile> = {};
```

**Counter pattern** for IDs:
```typescript
let projectileIdCounter = 0;

export function getNextProjectileId(): number {
  projectileIdCounter++;
  return projectileIdCounter;
}
```

## Project-Specific Patterns

### Socket.IO Event Handling
- Use typed events via `ClientToServerEvents` and `ServerToClientEvents` interfaces
- Always destructure event data with inline types
- Guard clause for player existence in all handlers

### Canvas Rendering
- All rendering classes implement interfaces ending in `Interface`
- Camera coordinates passed to `draw()` methods for viewport offset
- Use `ctx.save()` and `ctx.restore()` for isolated transformations

### Game Loop
- Fixed tick rate (~66 FPS) on backend (`TICK_RATE = 15ms`)
- State updates in `server/game/gameLoop.ts`
- Client interpolation in `public/Game.ts`

### Collision Detection
- Collision utilities in `server/game/collision.ts`
- Distance-based collision for circles: `Math.hypot(dx, dy) < radius1 + radius2`
- AABB collision for rectangles (obstacle detection)
- Always revert movement when collision detected
- Projectile collisions checked in order: obstacles → boundaries → players → enemies
- Use `break` to exit collision loops after first hit (projectiles consumed on impact)

### Game Configuration Constants
- All constants in `server/config/constants.ts` using UPPER_SNAKE_CASE
- **Damage values**: Use `PROJECTILE_DAMAGE` for unified damage system
- **Timer values**: Express in ticks (e.g., `ENEMY_SPAWN_INTERVAL = 133` for ~2 seconds at 66.6 FPS)
- **Spatial values**: Use base units (e.g., `GAMEWIDTH = 32 * 64`)
- Always import constants rather than hardcoding values

### Timer-Based Systems
- **Countdown pattern**: Decrement timer each tick, trigger at ≤ 0, reset to interval
```typescript
// Outside game loop
let enemySpawnTimer = 0;

// Inside game loop (runs every 15ms)
if (condition) {
  enemySpawnTimer--;
  if (enemySpawnTimer <= 0) {
    triggerAction();
    enemySpawnTimer = INTERVAL_CONSTANT; // Reset
  }
}
```
- **Enemy timers**: `shootTimer` and `targetTimer` count down in `enemyService.ts`
- Start timers at 0 for immediate first action, or at interval for delayed first action

### Enemy System Patterns
- Enemy spawning controlled by timer in `server/game/gameLoop.ts`
- Enemy behavior (movement, targeting, shooting) in `server/entities/enemyService.ts`
- Enemy creation via `addEnemy()` in `server/entities/enemiesHandler.ts`
- All enemies initialized with consistent values (health: 40, timers from constants)
- Enemy projectiles use `playerId: "npc"` to distinguish from player projectiles
- Collision filters check `projectile.playerId !== "npc"` to prevent friendly fire

## File Organization

When creating new features:
- **Server utilities**: `/server/utils/`
- **Game logic**: `/server/game/`
- **Network handlers**: `/server/handlers/`
- **Frontend classes**: `/public/` (PascalCase files)
- **Shared types**: `/types.ts` (root level)

## Common Tasks

**Adding a new entity type**:
1. Define interface in `/types.ts`
2. Create rendering class in `/public/EntityName.ts`
3. Add state management in `/server/state/gameState.ts`
4. Handle in game loop (`/server/game/gameLoop.ts`)

**Adding Socket.IO event**:
1. Add to `ClientToServerEvents` or `ServerToClientEvents` in `/types.ts`
2. Implement handler in `/server/handlers/socketHandlers.ts`
3. Emit/listen in `/public/frontend.ts`

**Modifying map**:
- Edit `.tmx` files with Tiled Map Editor
- Export to JSON with `npm run export-map` (if script exists)
- Map loads automatically in `/server/map/mapLoader.ts`

---

**Last Updated**: Enhanced with game patterns and enemy system details on 2026-03-01
