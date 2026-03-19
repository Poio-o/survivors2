import { GameConfig } from '../config/GameConfig.ts';
import { GamePhase, Team } from '../core/Types.ts';
import { UnitManager } from '../units/UnitManager.ts';
import { EconomySystem } from '../economy/EconomySystem.ts';
import { getTerrainData } from '../database/TerrainDatabase.ts';
import { GameMap } from '../map/GameMap.ts';
import { SpriteManager } from '../render/SpriteManager.ts';

// ─── HUD ─────────────────────────────────────────────────────────────────────

export class HUD {
  private ctx: CanvasRenderingContext2D;
  private phaseBannerTimer: number = 0;
  private phaseBannerText: string = '';

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  showPhaseBanner(text: string): void {
    this.phaseBannerText = text;
    this.phaseBannerTimer = 1.5; // seconds
  }

  update(dt: number): void {
    if (this.phaseBannerTimer > 0) {
      this.phaseBannerTimer -= dt / 1000;
    }
  }

  render(
    phase: GamePhase,
    turnNumber: number,
    economy: EconomySystem,
    unitManager: UnitManager,
    cursorX: number,
    cursorY: number,
    map: GameMap,
    battleNumber: number = 1,
    offsetX: number = 0,
    areaWidth?: number
  ): void {
    const ctx = this.ctx;
    const aw = areaWidth ?? GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;

    // Top bar
    ctx.fillStyle = GameConfig.COLORS.HUD_BG;
    ctx.fillRect(offsetX, 0, aw, 36);

    ctx.fillStyle = GameConfig.COLORS.HUD_TEXT;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Battle number + Turn & phase
    const phaseLabel = phase === GamePhase.ENEMY_TURN ? 'ENEMY TURN' : 'PLAYER TURN';
    ctx.fillText(`Battle ${battleNumber} — Turn ${turnNumber} — ${phaseLabel}`, offsetX + 12, 18);

    // Gold
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`💰 ${economy.gold}`, offsetX + aw - 12, 18);

    // Unit counts
    const playerCount = unitManager.getTeamUnits(Team.PLAYER).length;
    const enemyCount = unitManager.getTeamUnits(Team.ENEMY).length;
    ctx.fillStyle = GameConfig.COLORS.PLAYER_COLOR;
    ctx.fillText(`👤${playerCount}`, offsetX + aw - 100, 18);
    ctx.fillStyle = GameConfig.COLORS.ENEMY_COLOR;
    ctx.fillText(`👹${enemyCount}`, offsetX + aw - 150, 18);

    // Bottom tile info
    const terrain = getTerrainData(map.getTerrainId(cursorX, cursorY));
    const unit = unitManager.getUnitAt({ x: cursorX, y: cursorY });
    ctx.fillStyle = GameConfig.COLORS.HUD_BG;
    ctx.fillRect(offsetX, ch - 32, aw, 32);

    ctx.fillStyle = '#CCCCCC';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    let info = `[${cursorX},${cursorY}] ${terrain.name}`;
    if (terrain.defenseBonus > 0) info += ` DEF+${terrain.defenseBonus}`;
    if (!terrain.passable) info += ' (Impassable)';
    ctx.fillText(info, offsetX + 12, ch - 14);

    if (unit) {
      ctx.textAlign = 'right';
      ctx.fillStyle = unit.team === Team.PLAYER ? GameConfig.COLORS.PLAYER_COLOR : GameConfig.COLORS.ENEMY_COLOR;
      const ca = 8 + Math.floor(unit.defense / 2);
      ctx.fillText(
        `${unit.name} HP:${unit.currentHP}/${unit.maxHP} MP:${unit.currentMP}/${unit.maxHP} ATK:${unit.attack} CA:${ca} DEF:${unit.defense}`,
        offsetX + aw - 12,
        ch - 14
      );
    }

    // Phase banner
    if (this.phaseBannerTimer > 0) {
      const alpha = Math.min(1, this.phaseBannerTimer * 2);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(offsetX, ch / 2 - 30, aw, 60);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.phaseBannerText, offsetX + aw / 2, ch / 2);
      ctx.restore();
    }
  }
}
