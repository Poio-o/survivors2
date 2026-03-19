import { Position, Unit, Team } from '../core/Types.ts';
import { GameMap } from '../map/GameMap.ts';
import { UnitManager } from '../units/UnitManager.ts';

// ─── BFS Pathfinding ─────────────────────────────────────────────────────────

interface BFSNode {
  x: number;
  y: number;
  cost: number;
}

const DIRS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

/**
 * Returns all tiles reachable by a unit with given movement range.
 * Respects movement costs, obstacles, occupied tiles, and unit passives.
 */
export function getReachableTiles(
  startX: number,
  startY: number,
  movementRange: number,
  map: GameMap,
  unitManager: UnitManager,
  unitId: number,
  team: Team,
  passives: string[] = [],
  reservedTiles: Set<string> = new Set()
): Position[] {
  const key = (x: number, y: number) => `${x},${y}`;
  const visited = new Map<string, number>(); // key -> best cost
  const queue: BFSNode[] = [{ x: startX, y: startY, cost: 0 }];
  visited.set(key(startX, startY), 0);

  const result: Position[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push({ x: node.x, y: node.y });

    for (const dir of DIRS) {
      const nx = node.x + dir.x;
      const ny = node.y + dir.y;

      if (!map.inBounds(nx, ny)) continue;
      if (!map.isPassableForUnit(nx, ny, passives)) continue;

      // Allow passing through ALLIES, block ENEMIES
      const unitAt = unitManager.getUnitAt({ x: nx, y: ny });
      if (unitAt && unitAt.id !== unitId && unitAt.team !== team) {
        continue;
      }

      const moveCost = map.getMovementCostForUnit(nx, ny, passives);
      const newCost = node.cost + moveCost;

      if (newCost > movementRange) continue;

      const k = key(nx, ny);
      const prevCost = visited.get(k);
      if (prevCost !== undefined && prevCost <= newCost) continue;

      visited.set(k, newCost);
      queue.push({ x: nx, y: ny, cost: newCost });
    }
  }

  // Filter out tiles occupied by other units (can't stop on occupied tile)
  return result.filter((p) => {
    if (p.x === startX && p.y === startY) return true;
    const key = `${p.x},${p.y}`;
    if (reservedTiles.has(key)) return false;
    return !unitManager.isOccupied(p.x, p.y, unitId);
  });
}

/**
 * A* path from start to goal. Returns array of positions (including start and goal).
 */
export function findPath(
  start: Position,
  goal: Position,
  map: GameMap,
  unitManager: UnitManager,
  unitId: number,
  team: Team,
  passives: string[] = [],
  reservedTiles: Set<string> = new Set()
): Position[] {
  const key = (x: number, y: number) => `${x},${y}`;
  const heuristic = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  interface AStarNode {
    x: number;
    y: number;
    g: number;
    f: number;
    parent: AStarNode | null;
  }

  const open: AStarNode[] = [{ x: start.x, y: start.y, g: 0, f: heuristic(start, goal), parent: null }];
  const closed = new Set<string>();

  while (open.length > 0) {
    // Find lowest f
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const ck = key(current.x, current.y);

    if (current.x === goal.x && current.y === goal.y) {
      // Reconstruct path
      const path: Position[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closed.add(ck);

    for (const dir of DIRS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const nk = key(nx, ny);

      if (!map.inBounds(nx, ny)) continue;
      if (!map.isPassableForUnit(nx, ny, passives)) continue;
      if (closed.has(nk)) continue;

      // Allow passing through ALLIES, block ENEMIES
      // Exception: the goal tile is allowed to be targeted even if blocked (filter result later)
      if (nx !== goal.x || ny !== goal.y) {
        const unitAt = unitManager.getUnitAt({ x: nx, y: ny });
        if (unitAt && unitAt.id !== unitId && unitAt.team !== team) continue;
        
        const key = `${nx},${ny}`;
        if (reservedTiles.has(key)) continue;
      }

      const moveCost = map.getMovementCostForUnit(nx, ny, passives);
      const g = current.g + moveCost;
      const f = g + heuristic({ x: nx, y: ny }, goal);

      const existing = open.find((n) => n.x === nx && n.y === ny);
      if (existing && existing.g <= g) continue;

      if (existing) {
        existing.g = g;
        existing.f = f;
        existing.parent = current;
      } else {
        open.push({ x: nx, y: ny, g, f, parent: current });
      }
    }
  }

  return []; // No path found
}

/**
 * Get all tiles within attack range from a position (Manhattan distance).
 */
export function getAttackableTiles(
  x: number,
  y: number,
  attackRange: number,
  map: GameMap
): Position[] {
  const tiles: Position[] = [];
  for (let dy = -attackRange; dy <= attackRange; dy++) {
    for (let dx = -attackRange; dx <= attackRange; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > attackRange) continue;
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (map.inBounds(nx, ny)) {
        tiles.push({ x: nx, y: ny });
      }
    }
  }
  return tiles;
}
