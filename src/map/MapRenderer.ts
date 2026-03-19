import { GameMap } from './GameMap.ts';
import { GameConfig } from '../config/GameConfig.ts';
import { TerrainData, Position } from '../core/Types.ts';
import { SpriteManager } from '../render/SpriteManager.ts';
import { getTerrainData } from '../database/TerrainDatabase.ts';

// ─── Map Renderer ────────────────────────────────────────────────────────────
export class MapRenderer {
  private ctx: CanvasRenderingContext2D;
  private tileSize: number;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.tileSize = GameConfig.TILE_SIZE;
  }

  render(map: GameMap, camX: number, camY: number, viewportW?: number, viewportH?: number): void {
    const ts = GameConfig.TILE_SIZE;
    const sm = SpriteManager.getInstance();
    const vw = viewportW ?? GameConfig.CANVAS_WIDTH;
    const vh = viewportH ?? GameConfig.CANVAS_HEIGHT;

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const terrainId = map.getTerrainId(x, y);
        const terrain = getTerrainData(terrainId);

        const sx = x * ts - camX;
        const sy = y * ts - camY;

        // Culling
        if (sx + ts < 0 || sx > vw || sy + ts < 0 || sy > vh) {
          continue;
        }

        // Forest tiles: draw grass base first, then forest overlay
        if (terrain.id === 'forest') {
          const grassSprite = sm.getSprite('tile_grass');
          if (grassSprite) {
            this.ctx.drawImage(grassSprite, sx, sy, ts, ts);
          } else {
            this.ctx.fillStyle = getTerrainData('grass').color;
            this.ctx.fillRect(sx, sy, ts, ts);
          }

          // Forest overlay
          const forestSprite = sm.getSprite('tile_forest');
          if (forestSprite) {
            this.ctx.drawImage(forestSprite, sx, sy, ts, ts);
          } else {
            // Fallback forest overlay
            this.drawForestDetail(sx, sy, ts);
          }
        } else {
          const sprite = sm.getSprite(`tile_${terrain.id}`);
          if (sprite) {
            this.ctx.drawImage(sprite, sx, sy, ts, ts);
          } else {
            // Fallback
            this.ctx.fillStyle = terrain.color;
            this.ctx.fillRect(sx, sy, ts, ts);

            if (terrain.id === 'rock') {
              this.drawRockDetail(sx, sy, ts);
            } else if (terrain.id === 'water') {
              this.drawWaterDetail(sx, sy, ts);
            }
          }
        }

        // Grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(sx, sy, ts, ts);
      }
    }
  }

  renderHighlights(
    tiles: Position[],
    color: string,
    cameraX: number,
    cameraY: number
  ): void {
    const ts = this.tileSize;
    this.ctx.fillStyle = color;
    for (const pos of tiles) {
      const sx = pos.x * ts - cameraX;
      const sy = pos.y * ts - cameraY;
      this.ctx.fillRect(sx, sy, ts, ts);
    }
  }

  renderPath(path: Position[], cameraX: number, cameraY: number): void {
    if (path.length < 2) return;
    const ts = this.tileSize;
    const half = ts / 2;

    this.ctx.strokeStyle = GameConfig.COLORS.PATH_PREVIEW;
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([8, 6]);
    this.ctx.beginPath();
    this.ctx.moveTo(path[0].x * ts + half - cameraX, path[0].y * ts + half - cameraY);
    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x * ts + half - cameraX, path[i].y * ts + half - cameraY);
    }
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  // ─── Terrain detail helpers ──────────────────────────────────────────────
  private drawForestDetail(x: number, y: number, ts: number): void {
    // Semi-transparent green canopy on top of grass
    this.ctx.fillStyle = 'rgba(30, 90, 30, 0.7)';
    this.ctx.beginPath();
    this.ctx.arc(x + ts * 0.3, y + ts * 0.35, ts * 0.18, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x + ts * 0.65, y + ts * 0.3, ts * 0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x + ts * 0.5, y + ts * 0.55, ts * 0.16, 0, Math.PI * 2);
    this.ctx.fill();
    // Trunks
    this.ctx.fillStyle = '#5D3A1A';
    this.ctx.fillRect(x + ts * 0.27, y + ts * 0.48, ts * 0.06, ts * 0.18);
    this.ctx.fillRect(x + ts * 0.62, y + ts * 0.45, ts * 0.06, ts * 0.2);
  }

  private drawRockDetail(x: number, y: number, ts: number): void {
    this.ctx.fillStyle = '#5A5A5A';
    this.ctx.beginPath();
    this.ctx.moveTo(x + ts * 0.2, y + ts * 0.75);
    this.ctx.lineTo(x + ts * 0.4, y + ts * 0.25);
    this.ctx.lineTo(x + ts * 0.7, y + ts * 0.3);
    this.ctx.lineTo(x + ts * 0.8, y + ts * 0.7);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = '#909090';
    this.ctx.beginPath();
    this.ctx.moveTo(x + ts * 0.4, y + ts * 0.25);
    this.ctx.lineTo(x + ts * 0.55, y + ts * 0.15);
    this.ctx.lineTo(x + ts * 0.7, y + ts * 0.3);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawWaterDetail(x: number, y: number, ts: number): void {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    this.ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const wy = y + ts * (0.3 + i * 0.2);
      this.ctx.beginPath();
      this.ctx.moveTo(x + ts * 0.1, wy);
      this.ctx.quadraticCurveTo(x + ts * 0.35, wy - 4, x + ts * 0.5, wy);
      this.ctx.quadraticCurveTo(x + ts * 0.65, wy + 4, x + ts * 0.9, wy);
      this.ctx.stroke();
    }
  }
}
