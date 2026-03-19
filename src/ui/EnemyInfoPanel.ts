import { GameConfig } from '../config/GameConfig.ts';
import { Unit } from '../core/Types.ts';
import { SpriteManager } from '../render/SpriteManager.ts';

/**
 * UI Panel to display enemy unit statistics when clicked.
 */
export class EnemyInfoPanel {
  visible: boolean = false;
  unit: Unit | null = null;

  show(unit: Unit): void {
    this.unit = unit;
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
    this.unit = null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || !this.unit) return;

    const cw = GameConfig.CANVAS_WIDTH;

    const panelW = 220;
    const panelH = 160;
    const padding = 16;
    const panelX = cw - GameConfig.COMBAT_LOG_WIDTH - panelW - padding;
    const panelY = padding + 40; // Below HUD

    // Panel background
    ctx.fillStyle = 'rgba(40, 15, 15, 0.9)';
    ctx.strokeStyle = '#AA4444';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();

    // Portrait
    const sm = SpriteManager.getInstance();
    const portrait = sm.getSprite(`${this.unit.className}_portrait`);
    const portSize = 50;
    if (portrait) {
      ctx.drawImage(portrait, panelX + 12, panelY + 12, portSize, portSize);
    } else {
      ctx.fillStyle = this.unit.color;
      ctx.beginPath();
      ctx.arc(panelX + 12 + portSize/2, panelY + 12 + portSize/2, portSize/2 - 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Unit Name & Class
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(this.unit.name, panelX + portSize + 20, panelY + 28);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '12px monospace';
    ctx.fillText(`Lv ${this.unit.level} ${this.unit.className}`, panelX + portSize + 20, panelY + 44);

    // HP Bar
    const hpY = panelY + 54;
    const hpRatio = this.unit.currentHP / this.unit.maxHP;
    ctx.fillStyle = '#333';
    ctx.fillRect(panelX + 16, hpY, panelW - 32, 10);
    ctx.fillStyle = hpRatio > 0.3 ? '#44DD44' : '#DD4444';
    ctx.fillRect(panelX + 16, hpY, (panelW - 32) * hpRatio, 10);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.unit.currentHP}/${this.unit.maxHP}`, panelX + panelW - 16, hpY - 4);

    // MP Bar
    const mpY = hpY + 16;
    const mpRatio = this.unit.maxMP > 0 ? this.unit.currentMP / this.unit.maxMP : 0;
    ctx.fillStyle = '#333';
    ctx.fillRect(panelX + 16, mpY, panelW - 32, 8);
    ctx.fillStyle = GameConfig.COLORS.MP_BAR_FILL;
    ctx.fillRect(panelX + 16, mpY, (panelW - 32) * mpRatio, 8);

    ctx.fillStyle = '#AACCFF';
    ctx.textAlign = 'right';
    ctx.font = '10px monospace';
    ctx.fillText(`MP: ${this.unit.currentMP}/${this.unit.maxMP}`, panelX + panelW - 16, mpY - 2);

    // Stats
    const statsY = mpY + 20;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFDDDD';
    ctx.font = '12px monospace';
    const ca = 8 + Math.floor(this.unit.defense / 2);
    ctx.fillText(`ATK: ${this.unit.attack}`, panelX + 16, statsY);
    ctx.fillText(`CA: ${ca}`, panelX + 110, statsY);
    
    ctx.fillText(`DEF: ${this.unit.defense}`, panelX + 16, statsY + 18);
    ctx.fillText(`MOV: ${this.unit.movementRange}`, panelX + 110, statsY + 18);
    
    ctx.fillText(`RNG: ${this.unit.attackRange}`, panelX + 16, statsY + 36);

    // Prompt to close
    ctx.fillStyle = '#777777';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to close', panelX + panelW / 2, panelY + panelH - 10);
  }
}
