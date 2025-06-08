export interface PlayerState {
  id: string;
  playerName: string;
  ratioX: number;
  ratioY: number;
  aimX: number;
  aimY: number;
  score: number;
  team: number;
  wetnessLevel: number;
  wetnessColor: string;
  isUmbrellaOpen: boolean;
  umbrellaAngle: number;
}

export interface BalloonState {
  id: string;
  x: number;
  y: number;
  team: number;
  teamColor: string;
  wetnessLevel: number;
  power?: number;
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
  // Tilemap collision and rendering data
  tilemap: {
    width: number;
    height: number;
    data: number[];
    tileSize: number;
  };
}
