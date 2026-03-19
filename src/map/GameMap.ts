import { MapData, Tile } from '../core/Types.ts';
import { getTerrainData } from '../database/TerrainDatabase.ts';

// ─── Grid-based Game Map ─────────────────────────────────────────────────────
export class GameMap {
  width: number;
  height: number;
  tiles: Tile[][];
  playerSpawns: { x: number; y: number }[];
  enemySpawns: { x: number; y: number }[];

  constructor(data: MapData) {
    this.width = data.width;
    this.height = data.height;
    this.playerSpawns = data.playerSpawns;
    this.enemySpawns = data.enemySpawns;

    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        const terrainId = data.terrain[y]?.[x] ?? 'grass';
        this.tiles[y][x] = { terrainId };
      }
    }
  }

  getTile(x: number, y: number): Tile | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.tiles[y][x];
  }

  getTerrainId(x: number, y: number): string {
    return this.getTile(x, y)?.terrainId ?? 'grass';
  }

  isPassable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    return getTerrainData(tile.terrainId).passable;
  }

  /**
   * Check passability considering unit passives (flying, aquatic).
   */
  isPassableForUnit(x: number, y: number, passives: string[]): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    const terrain = getTerrainData(tile.terrainId);

    if (terrain.passable) return true;

    // Flying can cross water and rock
    if (passives.includes('flying')) return true;

    // Aquatic can cross water
    if (passives.includes('aquatic') && terrain.id === 'water') return true;

    return false;
  }

  getMovementCost(x: number, y: number): number {
    const tile = this.getTile(x, y);
    if (!tile) return 99;
    return getTerrainData(tile.terrainId).movementCost;
  }

  /**
   * Movement cost considering passives.
   */
  getMovementCostForUnit(x: number, y: number, passives: string[]): number {
    const tile = this.getTile(x, y);
    if (!tile) return 99;
    const terrain = getTerrainData(tile.terrainId);

    // Flying units treat all terrain as cost 1
    if (passives.includes('flying')) return 1;

    // Aquatic units treat water as cost 1
    if (passives.includes('aquatic') && terrain.id === 'water') return 1;

    return terrain.movementCost;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
