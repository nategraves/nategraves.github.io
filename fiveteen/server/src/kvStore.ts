import { createClient } from '@vercel/kv';
import type { Player, GameObject, PlayerPersistentStats } from './types'; // Corrected import path

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing Vercel KV environment variables in production.');
  }
  // In development, you might use a local Redis instance or skip KV functionality.
  // For now, we'll log a warning if not in production and variables are missing.
  console.warn('Vercel KV environment variables are not set. KV store will not be fully functional.');
}

// Ensure KV_URL is also considered if that's what Vercel sets up for general use.
// createClient will automatically use environment variables if they are set.
export const kv = createClient({
  url: process.env.KV_REST_API_URL || '', // Fallback to empty string if not set
  token: process.env.KV_REST_API_TOKEN || '', // Fallback to empty string if not set
});

// Example functions (we will expand this)
export async function getPlayer(playerId: string): Promise<Player | null> { // Changed any to Player
  try {
    return await kv.get<Player>(`player:${playerId}`); // Added type assertion
  } catch (error) {
    console.error(`Error getting player ${playerId}:`, error);
    return null;
  }
}

export async function setPlayer(playerId: string, playerData: Player): Promise<void> { // Changed any to Player
  try {
    await kv.set(`player:${playerId}`, playerData);
  } catch (error) {
    console.error(`Error setting player ${playerId}:`, error);
  }
}

export async function deletePlayer(playerId: string): Promise<void> {
  try {
    await kv.del(`player:${playerId}`);
  } catch (error) {
    console.error(`Error deleting player ${playerId}:`, error);
  }
}

// --- Player Persistent Stats ---
export async function getPlayerStats(playerName: string): Promise<PlayerPersistentStats | null> {
  try {
    return await kv.get(`playerStats:${playerName}`);
  } catch (error) {
    console.error(`Error getting player stats for ${playerName}:`, error);
    return null;
  }
}

export async function setPlayerStats(playerName: string, stats: PlayerPersistentStats): Promise<void> {
  try {
    await kv.set(`playerStats:${playerName}`, stats);
  } catch (error) {
    console.error(`Error setting player stats for ${playerName}:`, error);
  }
}

export async function getAllPlayerStats(): Promise<PlayerPersistentStats[]> {
  try {
    const keys = [];
    for await (const key of kv.scanIterator({ match: 'playerStats:*', type: 'json' })) { // Added type: 'json' for scanIterator if applicable, or ensure values are stored as JSON
      keys.push(key);
    }
    if (keys.length === 0) return [];
    const statsArray = await kv.mget<PlayerPersistentStats[]>(...keys);
    return statsArray.filter(stats => stats !== null) as PlayerPersistentStats[];
  } catch (error) {
    console.error('Error getting all player stats:', error);
    return [];
  }
}


// --- Active Players Set ---
const ACTIVE_PLAYERS_SET_KEY = 'active_players';

export async function addActivePlayer(playerId: string): Promise<void> {
  try {
    await kv.sadd(ACTIVE_PLAYERS_SET_KEY, playerId);
  } catch (error) {
    console.error(`Error adding active player ${playerId}:`, error);
  }
}

export async function removeActivePlayer(playerId: string): Promise<void> {
  try {
    await kv.srem(ACTIVE_PLAYERS_SET_KEY, playerId);
  } catch (error) {
    console.error(`Error removing active player ${playerId}:`, error);
  }
}

export async function getActivePlayerIds(): Promise<string[]> {
  try {
    const ids = await kv.smembers<string[]>(ACTIVE_PLAYERS_SET_KEY); // Added type assertion
    return ids || []; // Ensure it returns an array
  } catch (error) {
    console.error('Error getting active player IDs:', error);
    return [];
  }
}

export async function getActivePlayerCount(): Promise<number> {
  try {
    return await kv.scard(ACTIVE_PLAYERS_SET_KEY);
  } catch (error) {
    console.error('Error getting active player count:', error);
    return 0;
  }
}

// --- Balloons ---
const BALLOONS_KEY = 'balloons';

export async function getBalloons(): Promise<GameObject[]> {
  try {
    const balloons = await kv.get<GameObject[]>(BALLOONS_KEY);
    return balloons || [];
  } catch (error) {
    console.error('Error getting balloons:', error);
    return [];
  }
}

export async function setBalloons(balloons: GameObject[]): Promise<void> {
  try {
    await kv.set(BALLOONS_KEY, balloons);
  } catch (error) {
    console.error('Error setting balloons:', error);
  }
}

export async function clearBalloons(): Promise<void> {
  try {
    await kv.del(BALLOONS_KEY);
  } catch (error) {
    console.error('Error clearing balloons:', error);
  }
}

// --- Game Settings ---
export interface GameSettings {
  teamScores: number[];
  gameOver: boolean;
  winningTeam: number | null;
  friendlyFireEnabled: boolean;
  teamSessionWins: number[];
  nextTeam: number;
  // teamNames: string[]; // Consider if this should be here or be static in constants
}

const GAME_SETTINGS_KEY = 'game_settings';

export async function getGameSettings(): Promise<GameSettings | null> {
  try {
    return await kv.get<GameSettings>(GAME_SETTINGS_KEY);
  } catch (error) {
    console.error('Error getting game settings:', error);
    return null;
  }
}

export async function setGameSettings(settings: GameSettings): Promise<void> {
  try {
    await kv.set(GAME_SETTINGS_KEY, settings);
  } catch (error) {
    console.error('Error setting game settings:', error);
  }
}

export async function initializeDefaultGameSettings(teamNames: string[]): Promise<GameSettings> {
  const defaultSettings: GameSettings = {
    teamScores: new Array(teamNames.length).fill(0),
    gameOver: false,
    winningTeam: null,
    friendlyFireEnabled: false, // Default based on previous logic
    teamSessionWins: new Array(teamNames.length).fill(0),
    nextTeam: 0,
    // teamNames: teamNames // If you decide to store it dynamically
  };
  await setGameSettings(defaultSettings);
  return defaultSettings;
}

// Add more functions for balloons, game state, etc. as we refactor.
