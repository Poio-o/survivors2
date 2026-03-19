import { Position } from '../core/Types.ts';
import { GameConfig } from '../config/GameConfig.ts';

// ─── Cursor ──────────────────────────────────────────────────────────────────
export class Cursor {
  x: number = 0;
  y: number = 0;
  private blinkTimer: number = 0;
  private visible: boolean = true;

  move(dx: number, dy: number, mapW: number, mapH: number): void {
    this.x = Math.max(0, Math.min(mapW - 1, this.x + dx));
    this.y = Math.max(0, Math.min(mapH - 1, this.y + dy));
    this.blinkTimer = 0;
    this.visible = true;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  getPosition(): Position {
    return { x: this.x, y: this.y };
  }

  update(dt: number): void {
    this.blinkTimer += dt;
    if (this.blinkTimer >= GameConfig.CURSOR_BLINK_RATE) {
      this.visible = !this.visible;
      this.blinkTimer = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (!this.visible) return;
    const ts = GameConfig.TILE_SIZE;
    const sx = this.x * ts - cameraX;
    const sy = this.y * ts - cameraY;

    ctx.strokeStyle = GameConfig.COLORS.CURSOR;
    ctx.lineWidth = 3;
    ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);

    // Corner accents
    const c = 10;
    ctx.lineWidth = 4;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(sx + 2, sy + c); ctx.lineTo(sx + 2, sy + 2); ctx.lineTo(sx + c, sy + 2);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(sx + ts - c, sy + 2); ctx.lineTo(sx + ts - 2, sy + 2); ctx.lineTo(sx + ts - 2, sy + c);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(sx + 2, sy + ts - c); ctx.lineTo(sx + 2, sy + ts - 2); ctx.lineTo(sx + c, sy + ts - 2);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(sx + ts - c, sy + ts - 2); ctx.lineTo(sx + ts - 2, sy + ts - 2); ctx.lineTo(sx + ts - 2, sy + ts - c);
    ctx.stroke();
  }
}
