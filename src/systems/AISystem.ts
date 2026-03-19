import { Unit, Team, Position } from '../core/Types.ts';
import { UnitManager } from '../units/UnitManager.ts';
import { GameMap } from '../map/GameMap.ts';
import { getReachableTiles, findPath, getAttackableTiles } from './Pathfinding.ts';

// ─── AI System ───────────────────────────────────────────────────────────────

export interface AIAction {
  unit: Unit;
  movePath: Position[];
  targetPosition: Position;
  attackTarget: Unit | null;
}

export function computeAIActions(
  unitManager: UnitManager,
  map: GameMap
): AIAction[] {
  const enemies = unitManager.getTeamUnits(Team.ENEMY);
  const actions: AIAction[] = [];
  const reservedTiles = new Set<string>();

  for (const enemy of enemies) {
    if (enemy.hasActed) continue;

    const action = computeSingleAIAction(enemy, unitManager, map, reservedTiles);
    if (action) {
      actions.push(action);
      reservedTiles.add(`${action.targetPosition.x},${action.targetPosition.y}`);
    }
  }

  return actions;
}

function computeSingleAIAction(
  enemy: Unit,
  unitManager: UnitManager,
  map: GameMap,
  reservedTiles: Set<string> = new Set()
): AIAction | null {
  const playerUnits = unitManager.getTeamUnits(Team.PLAYER);
  if (playerUnits.length === 0) return null;

  // Find closest player unit (Manhattan distance)
  let closestPlayer: Unit | null = null;
  let closestDist = Infinity;

  for (const player of playerUnits) {
    const dist = Math.abs(enemy.position.x - player.position.x) +
                 Math.abs(enemy.position.y - player.position.y);
    if (dist < closestDist) {
      closestDist = dist;
      closestPlayer = player;
    }
  }

  if (!closestPlayer) return null;

  // Get reachable tiles (passing passives)
  const reachable = getReachableTiles(
    enemy.position.x,
    enemy.position.y,
    enemy.movementRange,
    map,
    unitManager,
    enemy.id,
    enemy.team,
    enemy.passives || [],
    reservedTiles
  );

  // Find best tile to move to (closest to target that allows attack, or just closest)
  let bestTile: Position = enemy.position;
  let bestDist = Infinity;
  let canAttack = false;

  for (const tile of reachable) {
    // Check if we can attack from this tile
    const attackTiles = getAttackableTiles(tile.x, tile.y, enemy.attackRange, map);
    const targetInRange = attackTiles.some(
      (at) => at.x === closestPlayer!.position.x && at.y === closestPlayer!.position.y
    );

    const dist = Math.abs(tile.x - closestPlayer.position.x) +
                 Math.abs(tile.y - closestPlayer.position.y);

    if (targetInRange && !canAttack) {
      canAttack = true;
      bestTile = tile;
      bestDist = dist;
    } else if (targetInRange && canAttack && dist < bestDist) {
      bestTile = tile;
      bestDist = dist;
    } else if (!canAttack && dist < bestDist) {
      bestTile = tile;
      bestDist = dist;
    }
  }

  // Compute path to chosen tile
  const path = findPath(enemy.position, bestTile, map, unitManager, enemy.id, enemy.team, enemy.passives || [], reservedTiles);

  return {
    unit: enemy,
    movePath: path.length > 0 ? path : [enemy.position],
    targetPosition: bestTile,
    attackTarget: canAttack ? closestPlayer : null,
  };
}
