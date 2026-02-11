# Multiplayer Prototype

A real-time multiplayer top-down shooter game built with TypeScript, Node.js, Socket.IO, and HTML5 Canvas.

## Overview

This is a browser-based multiplayer game featuring authoritative server architecture, client-side prediction, and tile-based rendering. Players can move around a 2D map, aim with their mouse, and shoot projectiles at other players.

## Technology Stack

### Backend
- **TypeScript** - Type-safe development
- **Express.js** - HTTP server
- **Socket.IO** - Real-time bidirectional communication
- **Node.js** - Runtime environment

### Frontend
- **HTML5 Canvas** - Rendering engine
- **TypeScript** - Compiled to JavaScript with esbuild
- **Socket.IO Client** - Server communication

## Getting Started

### Installation

```bash
npm install
```

### Building the Project

Build both backend and frontend:

```bash
npm run build
```

Or build separately:

```bash
# Backend only (TypeScript to JavaScript)
npm run build:backend

# Frontend only (Bundle with esbuild)
npm run build:frontend
```

### Running the Server

#### Development Mode

Run with auto-restart on file changes:

```bash
npm run dev
```

This runs both backend (with nodemon) and frontend (with esbuild watch) concurrently.

Or run separately:

```bash
# Backend only (with nodemon)
npm run dev:backend

# Frontend only (with esbuild watch)
npm run dev:frontend
```

#### Production Mode

First build the project, then start:

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

#### Production with PM2 (Recommended for Servers)

PM2 is a process manager that keeps your application running and provides automatic restarts.

**First-time setup:**

```bash
# Build the project
npm run build

# Start with PM2
pm2 start dist/backend.js --name "multiplayer-proto"

# Save the PM2 process list
pm2 save

# (Optional) Setup PM2 to start on system boot
pm2 startup
```

**Managing the server with PM2:**

```bash
# View status
pm2 status

# View real-time logs
pm2 logs multiplayer-proto

# View last 100 lines of logs
pm2 logs multiplayer-proto --lines 100

# Stop the server
pm2 stop multiplayer-proto

# Restart the server (e.g., after code changes)
pm2 restart multiplayer-proto

# Remove from PM2
pm2 delete multiplayer-proto

# Monitor resources (CPU, memory)
pm2 monit
```

**After updating code:**

```bash
# Rebuild and restart
npm run build && pm2 restart multiplayer-proto
```

### Starting the Game

1. Open your browser and navigate to `http://localhost:3000`
2. Enter your username
3. Click "Start!" to join the game

## Game Controls

- **WASD** - Movement
- **Mouse** - Aim direction
- **Left Click** - Shoot projectile

## Game Mechanics

### Player Stats
- **Health**: 100 HP
- **Damage**: 20 HP per projectile hit
- **Movement Speed**: 3 pixels/tick
- **Player Radius**: 15 pixels

### Projectiles
- **Speed**: 8 pixels/tick
- **Radius**: 4 pixels
- **Color**: Matches player color

### Map
- **Size**: 32x32 tiles (2048x2048 pixels)
- **Tile Size**: 64x64 pixels
- **Layers**: 4 (ground, decorations, foreground, obstacles)

### Scoring
- +1 point for eliminating another player
- Players respawn at random locations upon death

## Architecture

### File Structure

```
multiplayer-proto/
├── backend.ts              # Server-side game logic (TypeScript)
├── types.ts                # Shared TypeScript types
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript backend config
├── tsconfig.frontend.json  # TypeScript frontend config
├── multiMap.json           # Tiled map data
├── dist/                   # Compiled JavaScript output
│   ├── backend.js          # Compiled server code
│   └── types.js            # Compiled type definitions
├── public/
│   ├── index.html          # Game UI
│   ├── style.css           # Styles
│   ├── frontend.ts         # Client-side networking (TypeScript)
│   ├── Game.js             # Main game loop
│   ├── Player.js           # Player rendering
│   ├── Projectile.js       # Projectile rendering
│   ├── Camera.js           # Viewport management
│   ├── dist/
│   │   └── bundle.js       # Bundled frontend code
│   └── assets/             # Game assets
└── [Tiled map files]       # .tmx, .tsx, .png
```

### Server Architecture (backend.ts)

The server runs an authoritative game loop at ~66 FPS (15ms tick rate):

1. **Player Management**: Handles connections, disconnections, and player state
2. **Input Processing**: Receives and validates player inputs (WASD, mouse, shoot)
3. **Physics**: Updates player positions and projectile trajectories
4. **Collision Detection**: Checks projectile hits and obstacle collisions
5. **State Broadcasting**: Sends game state to all clients

Key features:
- Written in TypeScript for type safety
- Sequence numbers for client-side prediction reconciliation
- Obstacle collision system using bounding box detection
- Random spawn positioning with collision avoidance
- Enemy AI system (initial implementation)

### Client Architecture

**Game.js** - Core game loop and rendering manager
- Manages the main update loop using `requestAnimationFrame`
- Handles keyboard and mouse input
- Renders map layers, players, and projectiles
- Updates camera position

**Player.js** - Player rendering with sprite animation
- 4-frame walking animation
- Directional sprites (left/right based on mouse angle)
- Health bar rendering
- Username display

**Camera.js** - Viewport system
- Follows local player
- Boundary clamping to keep camera within map bounds
- Centers player in viewport

**frontend.js** - Networking layer
- Manages Socket.IO connection
- Client-side prediction with server reconciliation
- Interpolation for smooth player movement (lerp factor: 0.5)
- Leaderboard updates

## Networking

### Client-Side Prediction
The game implements client-side prediction to reduce perceived latency:
1. Client sends input with sequence number
2. Client immediately predicts movement locally
3. Server processes input and sends authoritative position
4. Client reconciles by replaying unacknowledged inputs

### State Synchronization
- **Player Updates**: Broadcast every 15ms
- **Projectile Updates**: Broadcast every 15ms
- **Map Data**: Sent once on connection

## Map System

The game uses Tiled Map Editor for level design:
- **multiMap.json** - Exported map data
- **multi.tmx** - Tiled map file
- **TilesetGround.png** - Ground tiles spritesheet
- **Tileset Wall.png** - Wall tiles spritesheet

### Map Layers
1. **Layer 0**: Base ground tiles
2. **Layer 1**: Ground decorations
3. **Layer 2**: Foreground elements (rendered on top of players)
4. **Layer 3**: Collision/obstacle data

## Performance Optimizations

- **Viewport Culling**: Only renders visible tiles (14x21 tiles)
- **Image Smoothing**: Disabled for pixel-art aesthetic
- **Device Pixel Ratio**: Supports high-DPI displays
- **Fixed Tick Rate**: Consistent 15ms server updates

## Known Issues

- Debug console.log statements present (backend.js:221, Projectile.js:25)
- Malformed HTML in username input (index.html:19-21)
- No rate limiting on player actions
- Missing input validation for edge cases
- Typo in Camera.js constructor parameter: "gameWidowHeight"

## Future Improvements

- [ ] Add rate limiting to prevent spam
- [ ] Implement player authentication
- [ ] Add sound effects and music
- [ ] Create multiple maps/game modes
- [ ] Add power-ups and weapon variety
- [ ] Implement matchmaking system
- [ ] Add mobile touch controls
- [ ] Improve error handling and validation
- [ ] Add reconnection logic
- [ ] Optimize collision detection for larger maps

## Development

### Development Workflow

```bash
# Run in development mode with auto-reload
npm run dev
```

This will:
- Start the backend with nodemon (auto-restarts on .ts file changes)
- Watch and rebuild the frontend bundle on changes

### Building for Production

```bash
# Build everything
npm run build

# Or build separately
npm run build:backend   # Compile TypeScript
npm run build:frontend  # Bundle frontend with esbuild
```

### TypeScript Configuration

- **tsconfig.json** - Backend configuration
- **tsconfig.frontend.json** - Frontend configuration (ES6 modules)

### Deployment

1. Build the project: `npm run build`
2. Start with PM2: `pm2 start dist/backend.js --name "multiplayer-proto"`
3. Save PM2 config: `pm2 save`
4. Setup auto-start: `pm2 startup`

### Map Editing

1. Open `multi.tmx` in Tiled Map Editor
2. Edit layers and tiles
3. Export as JSON to `multiMap.json`
4. Rebuild and restart the server

## Technical Details

### Server Constants (backend.ts)
```javascript
GAMEWIDTH = 32 * 64      // 2048 pixels
GAMEHEIGHT = 32 * 64     // 2048 pixels
SPEED = 3                // Player movement speed
RADIUS = 15              // Player collision radius
PROJECTILE_RADIUS = 4    // Projectile size
```

### Client Constants (frontend.js)
```javascript
gameWindowWidth = 1280   // Viewport width
gameWindowHeight = 800   // Viewport height
devicePixelRatio         // High-DPI support
```

## License

ISC

## Version History

- **v0.61** - Current version
- **v0.6** - Previous stable
- **v0.53** - Feature updates
- **v0.51** - Bug fixes
- **v0.5** - Major update
- **init** - Initial commit

---

Built with ❤️ as a multiplayer game prototype
