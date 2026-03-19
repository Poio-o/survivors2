import { Unit, SaveData, Team, MapData } from '../core/Types.ts';
import { UnitManager } from '../units/UnitManager.ts';
import { EconomySystem } from '../economy/EconomySystem.ts';

// ─── Save System ─────────────────────────────────────────────────────────────

const SAVE_KEY = 'tactical_survivors_save';

export function saveGame(
  unitManager: UnitManager,
  economy: EconomySystem,
  currentMap: string,
  turnNumber: number,
  battleNumber: number = 1,
  enemyGoldBudget: number = 300,
  mapData?: MapData
): void {
  const data: SaveData = {
    playerUnits: unitManager.getTeamUnits(Team.PLAYER),
    enemyUnits: unitManager.getTeamUnits(Team.ENEMY),
    gold: economy.gold,
    currentMap,
    turnNumber,
    battleNumber,
    enemyGoldBudget,
    mapData,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function hasSaveData(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
