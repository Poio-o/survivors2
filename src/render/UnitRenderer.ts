import { Unit, Team } from '../core/Types.ts';
import { GameConfig } from '../config/GameConfig.ts';
import { SpriteManager } from './SpriteManager.ts';

// ─── Unit Renderer ───────────────────────────────────────────────────────────
export class UnitRenderer {
  private ctx: CanvasRenderingContext2D;
  private ts: number;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.ts = GameConfig.TILE_SIZE;
  }

  render(units: Unit[], cameraX: number, cameraY: number, time: number): void {
    const sm = SpriteManager.getInstance();

    for (const unit of units) {
      if (unit.isDying && unit.deathAlpha <= 0) continue;
      this.renderUnit(unit, cameraX, cameraY, time, sm);
    }
  }

  private renderUnit(unit: Unit, cameraX: number, cameraY: number, time: number, sm: SpriteManager): void {
    const ts = this.ts;
    const sx = unit.animX * ts - cameraX + unit.offsetX;
    const sy = unit.animY * ts - cameraY + unit.offsetY;
    const cx = sx + ts / 2;
    const cy = sy + ts / 2;

    this.ctx.save();

    // Death fade
    if (unit.isDying) {
      this.ctx.globalAlpha = unit.deathAlpha;
    }

    // Flash feedback (damage taken)
    if (unit.flashTimer > 0) {
      this.ctx.globalAlpha = Math.abs(Math.sin(unit.flashTimer * 10)) * 0.5 + 0.5;
    }

    // Determine colors (these are mostly for fallback or text now)
    let bodyColor = unit.color;
    let strokeColor = unit.team === Team.PLAYER ? '#FFFFFF' : '#330000';
    
    // Enemy tint (for fallback)
    if (unit.team === Team.ENEMY) {
      bodyColor = '#DD3333'; // Force red tint
    }

    // Acted visual cue 
    if (unit.hasActed && !unit.isDying) {
      this.ctx.filter = 'grayscale(100%) brightness(60%)';
    }

    // Idle bob animation
    let bobbing = 0;
    if (!unit.isMoving && !unit.isDying) {
      bobbing = Math.sin(time * 0.003 + unit.id) * 2;
    }

    const spriteId = unit.team === Team.ENEMY ? `${unit.className}_map_enemy` : `${unit.className}_map`;
    const sprite = sm.getSprite(spriteId);

    if (sprite) {
      this.ctx.drawImage(sprite, sx, sy - bobbing, ts, ts);
    } else {
      // Fallback circle if no sprite is found
      const radius = ts * 0.35;
      this.ctx.fillStyle = bodyColor;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 4 + bobbing, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Border based on team & state (for fallback)
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Reset filter for UI elements (HP Bar, Level)
    this.ctx.filter = 'none';

    // HP Bar
    this.renderHPBar(unit, sx, sy);

    // MP Bar (below HP bar)
    if (unit.maxMP > 0) {
      this.renderMPBar(unit, sx, sy);
    }

    // Level indicator
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${ts * 0.17}px monospace`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Lv${unit.level}`, sx + 2, sy + ts - 3);

    this.ctx.restore();
  }

  private renderHPBar(unit: Unit, sx: number, sy: number): void {
    const ts = this.ts;
    const barW = ts * 0.7;
    const barH = 4;
    const barX = sx + (ts - barW) / 2;
    const barY = sy + ts - 14;
    const ratio = unit.currentHP / unit.maxHP;

    this.ctx.fillStyle = GameConfig.COLORS.HP_BAR_BG;
    this.ctx.fillRect(barX, barY, barW, barH);

    this.ctx.fillStyle = ratio > 0.35 ? GameConfig.COLORS.HP_BAR_FILL : GameConfig.COLORS.HP_BAR_LOW;
    this.ctx.fillRect(barX, barY, barW * ratio, barH);
  }

  private renderMPBar(unit: Unit, sx: number, sy: number): void {
    const ts = this.ts;
    const barW = ts * 0.7;
    const barH = 3;
    const barX = sx + (ts - barW) / 2;
    const barY = sy + ts - 9;
    const ratio = unit.maxMP > 0 ? unit.currentMP / unit.maxMP : 0;

    this.ctx.fillStyle = GameConfig.COLORS.HP_BAR_BG;
    this.ctx.fillRect(barX, barY, barW, barH);

    this.ctx.fillStyle = GameConfig.COLORS.MP_BAR_FILL;
    this.ctx.fillRect(barX, barY, barW * ratio, barH);
  }
}
