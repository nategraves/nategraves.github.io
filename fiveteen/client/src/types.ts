// Client-side type definitions
export interface PlayerState {
  id: string;
  playerName: string;
  ratioX: number;
  ratioY: number;
  vx: number;
  vy: number;
  aimX: number;
  aimY: number;
  score: number;
  team: number;
  wetnessLevel: number;
  wetnessColor: string; // Consider if this is still needed or derived
  isGrounded: boolean;
  prevJump: boolean;
  jumpsRemaining: number;
  prevTrigger: boolean;
  triggerStart: number | null;
  buttons: boolean[];
  isUmbrellaOpen: boolean;
  umbrellaAngle: number;
}

export interface BalloonState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ownerId: string;
  team: number;
  power: number;
  teamColor: string;
}

export interface PlayerPersistentStats {
  playerName: string;
  conversions: number;
  deathsByConversion: number;
  gamesWon: number;
}

export interface GameState {
  players: PlayerState[];
  balloons: BalloonState[];
  teamScores: number[];
  friendlyFireEnabled: boolean;
  gameOver: boolean;
  winningTeam: number | null;
  persistentPlayerStats: PlayerPersistentStats[];
  teamSessionWins: number[];
  teamNames: string[];
  // tilemap?: any; // Or a more specific Tilemap type if needed on client
}

// Add other client-specific types as needed
