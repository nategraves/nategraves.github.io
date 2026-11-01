# Fifteen Multiplayer Balloon Game

A real-time, multiplayer balloon-throwing game with umbrella shields, built with a Dockerized client and server.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Client](#client)
- [Server](#server)
- [Running Locally](#running-locally)
- [Deployment](#deployment)

---

## Overview

Players move, charge and throw water balloons at opponents and block incoming balloons with umbrella shields. Hitting a player increases their wetness; max wetness triggers a team change and scoring.

## Architecture

This repository is structured as two main services:

```
fiveteen/
├── client/        # Frontend (browser-based game UI, built with TypeScript and Vite)
└── server/        # Backend (Node.js WebSocket game loop using Redis/KV for state storage)
```

Both are containerized with Docker and orchestrated together via `docker-compose.yml`.

## Client

- **Tech Stack**: TypeScript, Vite, HTML5 Canvas, WebSockets.
- **Key Features**:
  - Joystick controls for movement & aiming.
  - Umbrella rendering (arc, orientation, handle).
  - Balloon spawn, charging, and trajectory visualization.
  - Real-time synchronization via WebSocket.

## Server

- **Tech Stack**: Node.js, TypeScript, ws (WebSocket), Redis/KV store.
- **Key Features**:
  - Fixed-timestep game loop (60 Hz) for physics & balloon updates.
  - Collision detection: player-body and umbrella shields.
  - Game state persistence in Redis (players, balloons, scores, settings).
  - Team management, scoring, round-over detection.

## Running Locally

1. Install Docker & Docker Compose.
2. Clone this repo:
   ```sh
   git clone https://github.com/nategraves/fiveteen.git
   cd fiveteen
   ```
3. Build and start all services:
   ```sh
   docker-compose up --build -d
   ```
4. Open `http://localhost:3000` in your browser (client runs on port 3000; server on 3001).

## Deployment

A simple, cost-effective approach is to host both client and server together on a small VPS:

1. Push this repo to GitHub (or similar).
2. Provision a Linux VM (DigitalOcean, AWS Lightsail, etc.).
3. Install Docker & Docker Compose.
4. Clone the repo and run:
   ```sh
   cd fiveteen
   docker-compose pull
   docker-compose up -d
   ```
5. Configure DNS and (optionally) a reverse proxy (nginx/Caddy) for SSL.

---

Enjoy playing and customizing Fifteen!
