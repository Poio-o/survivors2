import { Position } from '../core/Types.ts';
import { GameMap } from '../map/GameMap.ts';

/**
 * Handles unit deployment logic for both player and enemy teams.
 */
export class SpawnSystem {
  /**
   * Finds valid spawn positions for the player team, usually grouped in an area.
   */
  static getPlayerSpawnPositions(map: GameMap, count: number): Position[] {
    const spawns: Position[] = [];
    // Search for passable tiles starting from bottom-left corner area
    for (let x = 1; x < map.width && spawns.length < count; x++) {
      for (let y = map.height - 2; y > 0 && spawns.length < count; y--) {
        if (map.isPassable(x, y)) {
          // Check if already in spawns (shouldn't happen with nested loops)
          spawns.push({ x, y });
        }
      }
    }
    return spawns;
  }

  /**
   * Finds random spawn positions for enemies, at least 3 tiles away from deployment zone, and 5 tiles away from player units.
   */
  static getEnemySpawnPositions(map: GameMap, count: number, playerPositions: Position[], deployMaxX: number = -1): Position[] {
    const spawns: Position[] = [];
    const maxAttempts = 500;
    let attempts = 0;

    while (spawns.length < count && attempts < maxAttempts) {
      attempts++;
      const x = Math.floor(Math.random() * map.width);
      const y = Math.floor(Math.random() * map.height);

      if (!map.isPassable(x, y)) continue;

      // Rule: Keep away from deployment zone (x <= deployMaxX) by at least 4 tiles
      if (deployMaxX >= 0) {
        if (x <= deployMaxX + 3) continue; // +3 means 4th tile is x=deployMaxX+4
      }

      // Rule: At least 5 tiles distance from any player unit
      const isFarEnough = playerPositions.every(pp => {
        const dist = Math.abs(pp.x - x) + Math.abs(pp.y - y);
        return dist >= 5;
      });

      if (!isFarEnough) continue;

      // Check if already occupied by another enemy in this list
      const isOccupied = spawns.some(s => s.x === x && s.y === y);
      if (isOccupied) continue;

      spawns.push({ x, y });
    }

    return spawns;
  }
}
