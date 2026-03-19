import { TerrainData } from '../core/Types.ts';

// ─── Terrain Definitions ─────────────────────────────────────────────────────
export const TerrainDatabase: Record<string, TerrainData> = {
  grass: {
    id: 'grass',
    name: 'Grass',
    movementCost: 1,
    defenseBonus: 0,
    evasionBonus: 0,
    passable: true,
    color: '#5A9E4B',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    movementCost: 2,
    defenseBonus: 2,
    evasionBonus: 0, // Evasion removed — forest only gives defense
    passable: true,
    color: '#2D6E2D',
  },
  rock: {
    id: 'rock',
    name: 'Rock',
    movementCost: 99,
    defenseBonus: 0,
    evasionBonus: 0,
    passable: false,
    color: '#7A7A7A',
  },
  water: {
    id: 'water',
    name: 'Water',
    movementCost: 2,
    defenseBonus: 0,
    evasionBonus: 0,
    passable: false, // Not passable by default; aquatic/flying override this
    color: '#3B7DD8',
  },
};

export function getTerrainData(id: string): TerrainData {
  return TerrainDatabase[id] ?? TerrainDatabase['grass'];
}
