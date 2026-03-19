import { MapData, Position } from '../core/Types.ts';
import { GameConfig } from '../config/GameConfig.ts';

/**
 * Generates a random map with structured terrain (grouped forests/rocks, connected water).
 * Map size is randomized within configured min/max bounds.
 */
export class MapGenerator {
  static generate(width?: number, height?: number): MapData {
    // Random dimensions if not specified
    const w = width ?? this.randomRange(GameConfig.MAP_MIN_WIDTH, GameConfig.MAP_MAX_WIDTH);
    const h = height ?? this.randomRange(GameConfig.MAP_MIN_HEIGHT, GameConfig.MAP_MAX_HEIGHT);

    let terrain: string[][] = [];
    let isValid = false;
    let playerSpawns: Position[] = [];
    let enemySpawns: Position[] = [];

    // Keep generating until we have a valid map where player and enemy spawns are connected
    while (!isValid) {
      terrain = this.generateBaseTerrain(w, h);
      
      // Carve out spawn areas to ensure they are empty (grass)
      this.carveSpawnAreas(terrain, w, h);
      
      playerSpawns = [
        { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 1 },
        { x: 3, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }
      ];
      enemySpawns = [
        { x: w - 2, y: h - 2 }, { x: w - 3, y: h - 2 }, 
        { x: w - 2, y: h - 3 }, { x: w - 3, y: h - 3 }, { x: w - 4, y: h - 2 }
      ];

      isValid = this.checkConnectivity(terrain, w, h, playerSpawns[0], enemySpawns[0]);
    }

    return {
      width: w,
      height: h,
      terrain,
      playerSpawns,
      enemySpawns,
    };
  }

  private static randomRange(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  private static generateBaseTerrain(width: number, height: number): string[][] {
    const terrain: string[][] = Array.from({ length: height }, () => Array(width).fill('grass'));

    // Fewer but larger blobs for more cohesive features
    const waterClusters = Math.floor((width * height) / 120);
    const forestClusters = Math.floor((width * height) / 80);
    const rockClusters = Math.floor((width * height) / 100);

    // Water first: large cohesive lakes
    this.spawnBlobs(terrain, width, height, 'water', waterClusters, 15, 40); 
    // Forests next: medium groves
    this.spawnBlobs(terrain, width, height, 'forest', forestClusters, 8, 20);
    // Rocks last: small scattered outcroppings
    this.spawnBlobs(terrain, width, height, 'rock', rockClusters, 3, 8);

    return terrain;
  }

  private static spawnBlobs(
    terrain: string[][], 
    width: number, 
    height: number, 
    type: string, 
    count: number, 
    minSize: number, 
    maxSize: number
  ) {
    for (let c = 0; c < count; c++) {
      const startX = Math.floor(Math.random() * width);
      const startY = Math.floor(Math.random() * height);
      const targetSize = minSize + Math.floor(Math.random() * (maxSize - minSize));
      
      let currentSize = 0;
      const queue: Position[] = [{ x: startX, y: startY }];
      const visited = new Set<string>();
      visited.add(`${startX},${startY}`);

      while (queue.length > 0 && currentSize < targetSize) {
        // Randomly pick from queue to create less uniform blobs
        const idx = Math.floor(Math.random() * queue.length);
        const { x, y } = queue.splice(idx, 1)[0];

        // Check if we can place this terrain here (proximity buffer)
        if (this.canPlaceTerrain(terrain, x, y, width, height, type)) {
          terrain[y][x] = type;
          currentSize++;

          // Add neighbors
          const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
          for (const d of dirs) {
            const nx = x + d.x;
            const ny = y + d.y;
            const key = `${nx},${ny}`;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(key)) {
              visited.add(key);
              // Decreasing probability of growth as we reach target size
              const prob = 0.8 * (1 - currentSize / targetSize);
              if (Math.random() < prob + 0.2) {
                queue.push({ x: nx, y: ny });
              }
            }
          }
        }
      }
    }
  }

  /** Checks if terrain can be placed without being directly adjacent to another non-grass type */
  private static canPlaceTerrain(terrain: string[][], x: number, y: number, width: number, height: number, type: string): boolean {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    
    // Allow overwriting if it's already the same type or grass
    if (terrain[y][x] !== 'grass' && terrain[y][x] !== type) return false;

    const dirs = [
      { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
      { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
    ];

    for (const d of dirs) {
      const nx = x + d.x;
      const ny = y + d.y;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborType = terrain[ny][nx];
        // If neighbor is a different specialized terrain, don't allow placement (force grass buffer)
        if (neighborType !== 'grass' && neighborType !== type) {
          return false;
        }
      }
    }

    return true;
  }

  private static carveSpawnAreas(terrain: string[][], width: number, height: number) {
    // Top-left area (Player) — larger carve for deployment
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (y < height && x < width) terrain[y][x] = 'grass';
      }
    }
    // Bottom-right area (Enemy)
    for (let y = height - 5; y < height; y++) {
      for (let x = width - 5; x < width; x++) {
        if (y >= 0 && x >= 0) terrain[y][x] = 'grass';
      }
    }
  }

  private static checkConnectivity(terrain: string[][], width: number, height: number, start: Position, goal: Position): boolean {
    const queue: Position[] = [start];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.y}`);

    const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;

      if (x === goal.x && y === goal.y) return true;

      for (const d of dirs) {
        const nx = x + d.x;
        const ny = y + d.y;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          // Rock and Water are impassable for connectivity check
          if (terrain[ny][nx] !== 'rock' && terrain[ny][nx] !== 'water') {
            const key = `${nx},${ny}`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    return false; // No path found
  }
}
