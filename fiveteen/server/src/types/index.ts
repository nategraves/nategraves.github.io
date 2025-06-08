export interface Player {
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
  wetnessColor: string;
  isGrounded: boolean;
  prevJump: boolean;
  jumpsRemaining: number;
  prevTrigger: boolean;
  triggerStart: number | null;
  buttons: boolean[];
  isUmbrellaOpen: boolean;
  umbrellaAngle: number;
}

export interface GameObject {
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

export interface GameState {
  players: Player[];
  balloons: GameObject[];
  teamScores: number[];
  friendlyFireEnabled: boolean;
  gameOver: boolean;
  winningTeam: number | null;
  persistentPlayerStats: PlayerPersistentStats[];
  teamSessionWins: number[];
  teamNames: string[];
}

export interface PlayerPersistentStats {
  playerName: string;
  conversions: number;
  deathsByConversion: number;
  gamesWon: number;
}
