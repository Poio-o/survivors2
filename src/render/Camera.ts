import { GameConfig } from '../config/GameConfig.ts';

// ─── Camera ──────────────────────────────────────────────────────────────────
export class Camera {
  x: number = 0;
  y: number = 0;

  follow(tileX: number, tileY: number, mapWidth: number, mapHeight: number, viewportWidth?: number, viewportHeight?: number): void {
    const ts = GameConfig.TILE_SIZE;
    const viewW = viewportWidth ?? GameConfig.CANVAS_WIDTH;
    const viewH = viewportHeight ?? GameConfig.CANVAS_HEIGHT;

    const targetX = tileX * ts - viewW / 2 + ts / 2;
    const targetY = tileY * ts - viewH / 2 + ts / 2;

    const maxX = mapWidth * ts - viewW;
    const maxY = mapHeight * ts - viewH;

    // We allow maxX/maxY to be negative if the map is smaller than the viewport, 
    // which effectively centers the map.
    const clampedTargetX = mapWidth * ts <= viewW ? (mapWidth * ts - viewW) / 2 : Math.max(0, Math.min(maxX, targetX));
    const clampedTargetY = mapHeight * ts <= viewH ? (mapHeight * ts - viewH) / 2 : Math.max(0, Math.min(maxY, targetY));

    // Smooth lerp
    this.x += (clampedTargetX - this.x) * 0.15;
    this.y += (clampedTargetY - this.y) * 0.15;
  }
}
