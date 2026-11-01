import { createClient } from 'redis';
import type { RedisClientType } from 'redis'; // Import type separately
import {
  GameState,
  Player,
  GameObject,
  GameSettings,
  PlayerPersistentStats,
} from './types'; // Added GameObject, GameSettings, PlayerPersistentStats

// Use ReturnType to correctly type the client instance
let redisClient: ReturnType<typeof createClient> | null = null;

async function getClient(): Promise<ReturnType<typeof createClient>> {
  if (!redisClient) {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    client.on('error', (err) => console.error('Redis Client Error:', err));

    await client.connect();
    redisClient = client;
  }
  // After connect, redisClient is guaranteed to be non-null here if no error thrown
  return redisClient!;
}

export async function getGameState(gameId: string): Promise<GameState | null> {
  const client = await getClient();
  const gameStateString = await client.get(`game:${gameId}`);
  if (!gameStateString) {
    return null;
  }
  try {
    return JSON.parse(gameStateString) as GameState;
  } catch (error) {
    console.error(`Error parsing GameState for gameId ${gameId}:`, error);
    return null;
  }
}

export async function setGameState(
  gameId: string,
  gameState: GameState
): Promise<void> {
  const client = await getClient();
  try {
    await client.set(`game:${gameId}`, JSON.stringify(gameState));
  } catch (error) {
    console.error(`Error setting GameState for gameId ${gameId}:`, error);
  }
}

export async function getAllGameIds(): Promise<string[]> {
  const client = await getClient();
  try {
    const keys = await client.keys('game:*');
    return keys.map((key) => key.replace('game:', ''));
  } catch (error) {
    console.error('Error getting all game IDs:', error);
    return [];
  }
}

export async function deleteGameState(gameId: string): Promise<void> {
  const client = await getClient();
  try {
    await client.del(`game:${gameId}`);
  } catch (error) {
    console.error(`Error deleting GameState for gameId ${gameId}:`, error);
  }
}

export async function getPlayer(playerId: string): Promise<Player | null> {
  const client = await getClient();
  const playerString = await client.get(`player:${playerId}`);
  if (!playerString) {
    return null;
  }
  try {
    return JSON.parse(playerString) as Player;
  } catch (error) {
    console.error(`Error parsing Player for playerId ${playerId}:`, error);
    return null;
  }
}

export async function setPlayer(
  playerId: string,
  player: Player
): Promise<void> {
  const client = await getClient();
  try {
    await client.set(`player:${playerId}`, JSON.stringify(player));
  } catch (error) {
    console.error(`Error setting Player for playerId ${playerId}:`, error);
  }
}

export async function deletePlayer(playerId: string): Promise<void> {
  const client = await getClient();
  try {
    await client.del(`player:${playerId}`);
  } catch (error) {
    console.error(`Error deleting Player for playerId ${playerId}:`, error);
  }
}

// Generic key-value (use with caution, prefer specific functions)
export async function getValue(key: string): Promise<string | null> {
  const client = await getClient();
  try {
    return await client.get(key);
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, error);
    return null;
  }
}

export async function setValue(key: string, value: string): Promise<void> {
  const client = await getClient();
  try {
    await client.set(key, value);
  } catch (error) {
    console.error(`Error setting value for key ${key}:`, error);
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log('Redis client disconnected.');
    } catch (error) {
      console.error('Error disconnecting Redis client:', error);
    }
  }
}

// --- Added functions ---

// Active Players
const ACTIVE_PLAYERS_KEY = 'activePlayers';

export async function addActivePlayer(playerId: string): Promise<void> {
  const client = await getClient();
  try {
    await client.sAdd(ACTIVE_PLAYERS_KEY, playerId);
  } catch (error) {
    console.error(`Error adding active player ${playerId}:`, error);
  }
}

export async function removeActivePlayer(playerId: string): Promise<void> {
  const client = await getClient();
  try {
    await client.sRem(ACTIVE_PLAYERS_KEY, playerId);
  } catch (error) {
    console.error(`Error removing active player ${playerId}:`, error);
  }
}

export async function getActivePlayerIds(): Promise<string[]> {
  const client = await getClient();
  try {
    return (await client.sMembers(ACTIVE_PLAYERS_KEY)) || [];
  } catch (error) {
    console.error('Error getting active player IDs:', error);
    return [];
  }
}

export async function getActivePlayerCount(): Promise<number> {
  const client = await getClient();
  try {
    return (await client.sCard(ACTIVE_PLAYERS_KEY)) || 0;
  } catch (error) {
    console.error('Error getting active player count:', error);
    return 0;
  }
}

// Balloons
const BALLOONS_KEY = 'balloons';

export async function getBalloons(): Promise<GameObject[]> {
  const client = await getClient();
  try {
    const balloonsString = await client.get(BALLOONS_KEY);
    return balloonsString ? (JSON.parse(balloonsString) as GameObject[]) : [];
  } catch (error) {
    console.error('Error getting balloons:', error);
    return [];
  }
}

export async function setBalloons(balloons: GameObject[]): Promise<void> {
  const client = await getClient();
  try {
    await client.set(BALLOONS_KEY, JSON.stringify(balloons));
  } catch (error) {
    console.error('Error setting balloons:', error);
  }
}

export async function clearBalloons(): Promise<void> {
  const client = await getClient();
  try {
    await client.del(BALLOONS_KEY);
  } catch (error) {
    console.error('Error clearing balloons:', error);
  }
}

// Game Settings
const GAME_SETTINGS_KEY = 'gameSettings';

export async function getGameSettings(): Promise<GameSettings | null> {
  const client = await getClient();
  try {
    const settingsString = await client.get(GAME_SETTINGS_KEY);
    return settingsString ? (JSON.parse(settingsString) as GameSettings) : null;
  } catch (error) {
    console.error('Error getting game settings:', error);
    return null;
  }
}

export async function setGameSettings(settings: GameSettings): Promise<void> {
  const client = await getClient();
  try {
    await client.set(GAME_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error setting game settings:', error);
  }
}

export async function initializeDefaultGameSettings(
  teamNames: string[]
): Promise<GameSettings> {
  const defaultSettings: GameSettings = {
    teamScores: new Array(teamNames.length).fill(0),
    gameOver: false,
    winningTeam: null,
    friendlyFireEnabled: false, // Default value
    teamSessionWins: new Array(teamNames.length).fill(0),
    nextTeam: 0,
  };
  await setGameSettings(defaultSettings);
  console.log('[KVSTORE LOG] Default game settings initialized and saved.');
  return defaultSettings;
}

// Player Persistent Stats
const PLAYER_STATS_PREFIX = 'playerStats:';

export async function getPlayerStats(
  playerName: string
): Promise<PlayerPersistentStats | null> {
  const client = await getClient();
  try {
    const statsString = await client.get(`${PLAYER_STATS_PREFIX}${playerName}`);
    return statsString
      ? (JSON.parse(statsString) as PlayerPersistentStats)
      : null;
  } catch (error) {
    console.error(`Error getting player stats for ${playerName}:`, error);
    return null;
  }
}

export async function setPlayerStats(
  playerName: string,
  stats: PlayerPersistentStats
): Promise<void> {
  const client = await getClient();
  try {
    await client.set(
      `${PLAYER_STATS_PREFIX}${playerName}`,
      JSON.stringify(stats)
    );
  } catch (error) {
    console.error(`Error setting player stats for ${playerName}:`, error);
  }
}

export async function getAllPlayerStats(): Promise<PlayerPersistentStats[]> {
  const client = await getClient();
  try {
    const keys = await client.keys(`${PLAYER_STATS_PREFIX}*`);
    if (!keys || keys.length === 0) {
      return [];
    }
    const statsStrings = await client.mGet(keys);
    return statsStrings
      .filter((s) => s !== null)
      .map((s) => JSON.parse(s!) as PlayerPersistentStats);
  } catch (error) {
    console.error('Error getting all player stats:', error);
    return [];
  }
}
