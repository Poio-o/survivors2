import { GameConfig } from '../config/GameConfig.ts';

// ─── Battle Result Screen (Victory / Defeat) ────────────────────────────────

export class BattleResultScreen {
  visible: boolean = false;
  victory: boolean = true;
  goldEarned: number = 0;
  enemiesDefeated: number = 0;

  show(victory: boolean, goldEarned: number, enemiesDefeated: number): void {
    this.visible = true;
    this.victory = victory;
    this.goldEarned = goldEarned;
    this.enemiesDefeated = enemiesDefeated;
  }

  hide(): void {
    this.visible = false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const cw = GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, cw, ch);

    // Panel
    const pw = 400;
    const ph = 260;
    const px = (cw - pw) / 2;
    const py = (ch - ph) / 2;

    ctx.fillStyle = 'rgba(20, 25, 40, 0.95)';
    ctx.strokeStyle = this.victory ? '#44DD44' : '#DD4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 12);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = this.victory ? '#44DD44' : '#DD4444';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.victory ? '⚔️ VICTORY!' : '💀 DEFEAT', cw / 2, py + 50);

    if (this.victory) {
      ctx.fillStyle = '#CCCCCC';
      ctx.font = '16px monospace';
      ctx.fillText(`Enemies Defeated: ${this.enemiesDefeated}`, cw / 2, py + 100);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`+${this.goldEarned} Gold`, cw / 2, py + 140);
    } else {
      ctx.fillStyle = '#AAAAAA';
      ctx.font = '16px monospace';
      ctx.fillText('Your army has been defeated...', cw / 2, py + 110);
    }

    ctx.fillStyle = '#556677';
    ctx.font = '13px monospace';
    ctx.fillText('Press SPACE to continue', cw / 2, py + ph - 30);
  }
}
