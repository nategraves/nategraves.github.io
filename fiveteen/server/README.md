# Fiveteen Server

A TypeScript-based WebSocket server for the “Fiveteen” multiplayer canvas game.

## Prerequisites
- Node.js (>=14)
- npm

## Setup
```bash
cd fiveteen/server
npm install
```

## Development
Run in watch mode with automatic restart:
```bash
npm run dev
```

## Build
Compile TypeScript to JavaScript:
```bash
npm run build
```

## Testing
Run unit tests:
```bash
npm test
```

## Start
Start the server on port 8080:
```bash
npm start
```

## Protocol
- **init**: `{ type: 'init', clientId: string }` — register a new player
- **input**: `{ type: 'input', clientId: string, axes: number[], buttons: boolean[] }` — send controller input
- **disconnect**: `{ type: 'disconnect', clientId: string }` — unregister a player
- **state**: `{ type: 'state', state: { players: Player[], balloons: GameObject[] } }` — broadcasted game state
- **level**: `{ type: 'level', levelId: string }` — level selection event

## License
MIT
