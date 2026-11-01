import { getGameSettings, initializeDefaultGameSettings } from '../kvStore';
import type { TeamInfo as TeamInfoType } from '../types/index';
import { TEAM_INFO } from '../index';

export async function initGameSettings(): Promise<void> {
  try {
    let settings = await getGameSettings();
    if (!settings) {
      console.log(
        '[SERVER LOG] No game settings found in KV, initializing defaults.'
      );
      settings = await initializeDefaultGameSettings(
        TEAM_INFO.map((t: TeamInfoType) => t.name)
      );
    }
  } catch (error) {
    console.error('[SERVER LOG] Error initializing game settings:', error);
  }
}
