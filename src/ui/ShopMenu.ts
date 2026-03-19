import { GameConfig } from '../config/GameConfig.ts';
import { UnitData } from '../core/Types.ts';
import { getAllUnitData } from '../database/UnitDatabase.ts';
import { getAbilityData } from '../database/AbilityDatabase.ts';
import { EconomySystem } from '../economy/EconomySystem.ts';
import { SpriteManager } from '../render/SpriteManager.ts';

// ─── Shop Menu (Left-side panel, always visible) ─────────────────────────────

export class ShopMenu {
  visible: boolean = false;
  items: UnitData[] = [];
  selectedIndex: number = 0;
  message: string = '';
  messageTimer: number = 0;
  purchaseEnabled: boolean = true;
  scrollOffset: number = 0;

  open(): void {
    this.visible = true;
    this.items = getAllUnitData();
    this.selectedIndex = 0;
    this.message = '';
    this.purchaseEnabled = true;
    this.scrollOffset = 0;
  }

  close(): void {
    this.visible = false;
  }

  /** Disable purchasing (during battle) but keep panel visible */
  disablePurchase(): void {
    this.purchaseEnabled = false;
  }

  enablePurchase(): void {
    this.purchaseEnabled = true;
  }

  /** Show shop panel without opening the full shop mode */
  showPanel(): void {
    if (this.items.length === 0) {
      this.items = getAllUnitData();
    }
    this.visible = true;
  }

  moveSelection(dir: number): void {
    this.selectedIndex = Math.max(0, Math.min(this.items.length - 1, this.selectedIndex + dir));
  }

  getSelected(): UnitData {
    return this.items[this.selectedIndex];
  }

  update(dt: number): void {
    if (this.messageTimer > 0) {
      this.messageTimer -= dt / 1000;
      if (this.messageTimer <= 0) this.message = '';
    }
  }

  showMessage(msg: string): void {
    this.message = msg;
    this.messageTimer = 2;
  }

  /**
   * Render shop as a left-side panel.
   */
  renderPanel(ctx: CanvasRenderingContext2D, economy: EconomySystem, panelW: number, canvasH: number): void {
    if (!this.visible) return;
    const sm = SpriteManager.getInstance();

    // Panel background
    ctx.fillStyle = 'rgba(15, 18, 30, 0.95)';
    ctx.fillRect(0, 0, panelW, canvasH);

    // Right border
    ctx.strokeStyle = '#334466';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(panelW, 0);
    ctx.lineTo(panelW, canvasH);
    ctx.stroke();

    const pad = 10;

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🏪 SHOP', panelW / 2, 24);

    // Gold
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px monospace';
    ctx.fillText(`Gold: ${economy.gold}`, panelW / 2, 42);

    if (!this.purchaseEnabled) {
      ctx.fillStyle = '#FF6644';
      ctx.font = '10px monospace';
      ctx.fillText('(Battle in progress)', panelW / 2, 56);
    }

    // Items list
    const startY = 68;
    const itemH = 90; // Taller items for stats + abilities
    const maxVisible = Math.floor((canvasH - startY - 40) / itemH);

    for (let vi = 0; vi < Math.min(this.items.length, maxVisible); vi++) {
      const i = vi + this.scrollOffset;
      if (i >= this.items.length) break;
      const item = this.items[i];
      const iy = startY + vi * itemH;
      const isSelected = i === this.selectedIndex;

      // Selection highlight
      if (isSelected) {
        ctx.fillStyle = 'rgba(80, 130, 220, 0.3)';
        ctx.beginPath();
        ctx.roundRect(pad - 2, iy - 2, panelW - pad * 2 + 4, itemH - 4, 6);
        ctx.fill();
      }

      // Map sprite
      const sprite = sm.getSprite(`${item.className}_map`);
      if (sprite) {
        ctx.drawImage(sprite, pad, iy + 2, 28, 28);
      } else {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(pad + 14, iy + 16, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Name + cost
      ctx.textAlign = 'left';
      ctx.fillStyle = isSelected ? '#FFFFFF' : '#8899AA';
      ctx.font = isSelected ? 'bold 12px monospace' : '12px monospace';
      ctx.fillText(item.name, pad + 34, iy + 14);

      const canAfford = economy.canAfford(item.cost);
      ctx.textAlign = 'right';
      ctx.fillStyle = canAfford ? '#FFD700' : '#FF4444';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${item.cost}g`, panelW - pad, iy + 14);

      // Stats line
      ctx.textAlign = 'left';
      ctx.fillStyle = '#667788';
      ctx.font = '9px monospace';
      const ca = 8 + Math.floor(item.defense / 2);
      ctx.fillText(`HP:${item.maxHP} MP:${item.maxMP} ATK:${item.attack}`, pad + 4, iy + 32);
      ctx.fillText(`CA:${ca} DEF:${item.defense} MOV:${item.movementRange}`, pad + 4, iy + 44);
      ctx.fillText(`DMG:${item.damageDice} RNG:${item.attackRange}`, pad + 4, iy + 56);

      // Abilities
      if (item.abilities.length > 0) {
        ctx.fillStyle = '#AABB55';
        ctx.font = '9px monospace';
        for (let a = 0; a < item.abilities.length; a++) {
          const abilData = getAbilityData(item.abilities[a]);
          if (abilData) {
            ctx.fillText(`⚡${abilData.name}`, pad + 4, iy + 68 + a * 10);
          }
        }
      }

      // Passives
      if (item.passives && item.passives.length > 0) {
        ctx.fillStyle = '#55AADD';
        ctx.font = '9px monospace';
        for (let p = 0; p < item.passives.length; p++) {
          const passiveName = item.passives[p].charAt(0).toUpperCase() + item.passives[p].slice(1);
          ctx.fillText(`🔹${passiveName}`, pad + 4, iy + 68 + (item.abilities.length + p) * 10);
        }
      }
    }

    // Message
    if (this.message) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, panelW / 2, canvasH - 30);
    }

    // Instructions (only when purchases enabled)
    if (this.purchaseEnabled) {
      ctx.fillStyle = '#445566';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('↑↓ Nav | SPACE Buy | ESC Start', panelW / 2, canvasH - 10);
    }
  }

  /**
   * Legacy centered render for pre-battle shop (when no map loaded).
   */
  render(ctx: CanvasRenderingContext2D, economy: EconomySystem): void {
    if (!this.visible) return;

    const cw = GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, cw, ch);

    // Use the panel render at left
    this.renderPanel(ctx, economy, GameConfig.SHOP_PANEL_WIDTH, ch);
  }
}
