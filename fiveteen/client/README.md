# Fiveteen Client

A TypeScript-based multiplayer canvas client for the “Fiveteen” game, powered by Vite and the HTML5 Canvas API.

## Prerequisites
- Node.js (>=14)
- npm

## Setup
```bash
cd fiveteen/client
npm install
```

## Development
Start the local dev server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open \
http://localhost:3000
in your browser.

## Build & Preview
Build for production:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

## Features
- WebSocket-based real-time synchronization
- PS4 controller support with dead-zone filtering
- Responsive canvas rendering
- Gamepad connect/disconnect handling
- Score display and balloon rendering
- Level-select UI overlay

## License
MIT
