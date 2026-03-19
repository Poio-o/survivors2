import { Unit } from '../core/Types.ts';
import { GameConfig } from '../config/GameConfig.ts';
import { SpriteManager } from '../render/SpriteManager.ts';

// ─── Unit Menu (Move / Attack / Ability / Wait) ──────────────────────────────

export type MenuOption = 'Move' | 'Attack' | 'Ability' | 'Wait';

export class UnitMenu {
  visible: boolean = false;
  unit: Unit | null = null;
  options: MenuOption[] = ['Move', 'Attack', 'Ability', 'Wait'];
  selectedIndex: number = 0;

  open(unit: Unit): void {
    this.unit = unit;
    this.visible = true;
    this.selectedIndex = 0;
  }

  close(): void {
    this.visible = false;
    this.unit = null;
    this.selectedIndex = 0;
  }

  moveSelection(dir: number): void {
    this.selectedIndex = Math.max(0, Math.min(this.options.length - 1, this.selectedIndex + dir));
  }

  getSelected(): MenuOption {
    return this.options[this.selectedIndex];
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || !this.unit) return;

    const cw = GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;

    // Darkened overlay
    ctx.fillStyle = GameConfig.COLORS.MENU_OVERLAY;
    ctx.fillRect(0, 0, cw, ch);

    // ─── Layout: Portrait LEFT, Menu Panel RIGHT ─────────────────────────
    const sm = SpriteManager.getInstance();
    const portrait = sm.getSprite(`${this.unit.className}_portrait`);

    // Portrait dimensions (keep aspect ratio)
    const portraitMaxW = 220;
    const portraitMaxH = 300;
    let portraitW = portraitMaxW;
    let portraitH = portraitMaxH;

    if (portrait) {
      const imgW = (portrait as HTMLImageElement).naturalWidth || portrait.width || 200;
      const imgH = (portrait as HTMLImageElement).naturalHeight || portrait.height || 200;
      const scale = Math.min(portraitMaxW / imgW, portraitMaxH / imgH);
      portraitW = imgW * scale;
      portraitH = imgH * scale;
    }

    // Menu panel
    const menuW = 260;
    const menuH = 340;
    const totalW = portraitW + 20 + menuW; // portrait + gap + menu
    const startX = (cw - totalW) / 2;
    const centerY = ch / 2;

    // Draw portrait
    const portraitX = startX;
    const portraitY = centerY - portraitH / 2;

    if (portrait) {
      ctx.drawImage(portrait, portraitX, portraitY, portraitW, portraitH);
    } else {
      // Fallback circle
      ctx.fillStyle = this.unit.color;
      ctx.beginPath();
      ctx.arc(portraitX + portraitW / 2, centerY, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Unit name below portrait
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.unit.name, portraitX + portraitW / 2, portraitY + portraitH + 24);

    // ─── Menu Panel ──────────────────────────────────────────────────────
    const panelX = startX + portraitW + 20;
    const panelY = centerY - menuH / 2;

    // Panel background
    ctx.fillStyle = 'rgba(20, 25, 40, 0.98)';
    ctx.strokeStyle = '#5577AA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, menuW, menuH, 12);
    ctx.fill();
    ctx.stroke();

    const contentX = panelX + 20;
    const contentW = menuW - 40;
    const centerMenuX = panelX + menuW / 2;

    // HP bar
    const hpBarW = contentW;
    const hpBarH = 14;
    const hpBarX = contentX;
    const hpBarY = panelY + 24;
    const hpRatio = this.unit.currentHP / this.unit.maxHP;

    ctx.fillStyle = GameConfig.COLORS.HP_BAR_BG;
    ctx.beginPath();
    ctx.roundRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);
    ctx.fill();

    ctx.fillStyle = hpRatio > 0.35 ? GameConfig.COLORS.HP_BAR_FILL : GameConfig.COLORS.HP_BAR_LOW;
    ctx.beginPath();
    ctx.roundRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH, 4);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `HP: ${this.unit.currentHP} / ${this.unit.maxHP}`,
      centerMenuX,
      hpBarY + hpBarH + 16
    );

    // MP bar
    const mpBarY = hpBarY + hpBarH + 24;
    const mpRatio = this.unit.maxMP > 0 ? this.unit.currentMP / this.unit.maxMP : 0;

    ctx.fillStyle = GameConfig.COLORS.HP_BAR_BG;
    ctx.beginPath();
    ctx.roundRect(hpBarX, mpBarY, hpBarW, hpBarH, 4);
    ctx.fill();

    ctx.fillStyle = GameConfig.COLORS.MP_BAR_FILL;
    ctx.beginPath();
    ctx.roundRect(hpBarX, mpBarY, hpBarW * mpRatio, hpBarH, 4);
    ctx.fill();

    ctx.fillStyle = '#AACCFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `MP: ${this.unit.currentMP} / ${this.unit.maxMP}`,
      centerMenuX,
      mpBarY + hpBarH + 16
    );

    // Stats Grid
    const statsStartY = mpBarY + hpBarH + 34;
    ctx.fillStyle = '#AABBCC';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const ca = 8 + Math.floor(this.unit.defense / 2);
    ctx.fillText(`ATK: ${this.unit.attack}`, contentX, statsStartY);
    ctx.fillText(`CA:  ${ca}`, contentX + 90, statsStartY);

    ctx.fillText(`DEF: ${this.unit.defense}`, contentX, statsStartY + 20);
    ctx.fillText(`MOV: ${this.unit.movementRange}`, contentX + 90, statsStartY + 20);

    ctx.fillText(`DMG: ${this.unit.damageDice}`, contentX, statsStartY + 40);
    ctx.fillText(`RNG: ${this.unit.attackRange}`, contentX + 90, statsStartY + 40);

    // Options
    const optStartY = statsStartY + 70;
    for (let i = 0; i < this.options.length; i++) {
      const oy = optStartY + i * 32;
      const isSelected = i === this.selectedIndex;
      const isDisabled = this.options[i] === 'Ability' && this.unit.abilities.length === 0;

      if (isSelected && !isDisabled) {
        ctx.fillStyle = 'rgba(80, 130, 220, 0.4)';
        ctx.beginPath();
        ctx.roundRect(contentX - 6, oy - 12, contentW + 12, 28, 6);
        ctx.fill();
        ctx.strokeStyle = '#88AAFF';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (isSelected && isDisabled) {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
        ctx.beginPath();
        ctx.roundRect(contentX - 6, oy - 12, contentW + 12, 28, 6);
        ctx.fill();
      }

      if (isDisabled) {
        ctx.fillStyle = '#666666';
      } else {
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#8899AA';
      }

      ctx.font = isSelected ? 'bold 16px monospace' : '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.options[i], centerMenuX, oy + 6);
    }
  }
}
