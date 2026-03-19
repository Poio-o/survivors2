import { GameConfig } from '../config/GameConfig.ts';
import { getHighScores } from '../save/HighScoreSystem.ts';

/**
 * High Scores screen + Name Entry screen on defeat.
 */
export class HighScoreScreen {
  visible: boolean = false;
  nameEntryMode: boolean = false;
  playerName: string = '';
  battlesCompleted: number = 0;
  onNameSubmit: ((name: string) => void) | null = null;

  showScores(): void {
    this.visible = true;
    this.nameEntryMode = false;
  }

  showNameEntry(battlesCompleted: number, onSubmit: (name: string) => void): void {
    this.visible = true;
    this.nameEntryMode = true;
    this.battlesCompleted = battlesCompleted;
    this.playerName = '';
    this.onNameSubmit = onSubmit;
  }

  hide(): void {
    this.visible = false;
    this.nameEntryMode = false;
    this.onNameSubmit = null;
  }

  handleInput(key: string): boolean {
    if (!this.visible) return false;

    if (this.nameEntryMode) {
      if (key === 'Backspace') {
        this.playerName = this.playerName.slice(0, -1);
        return true;
      } else if (key === 'Enter' || key === ' ') {
        if (this.playerName.length > 0 && this.onNameSubmit) {
          this.onNameSubmit(this.playerName);
        }
        return true;
      } else if (key.length === 1 && this.playerName.length < 12) {
        this.playerName += key;
        return true;
      }
      return true;
    } else {
      if (key === 'Escape' || key === ' ') {
        this.hide();
        return true;
      }
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const cw = GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, cw, ch);

    if (this.nameEntryMode) {
      this.renderNameEntry(ctx, cw, ch);
    } else {
      this.renderScoreTable(ctx, cw, ch);
    }
  }

  private renderNameEntry(ctx: CanvasRenderingContext2D, cw: number, ch: number): void {
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#DD4444';
    ctx.fillText('💀 DEFEAT', cw / 2, ch / 3 - 40);

    ctx.fillStyle = '#CCCCCC';
    ctx.font = '18px monospace';
    ctx.fillText(`You survived ${this.battlesCompleted} battle${this.battlesCompleted !== 1 ? 's' : ''}!`, cw / 2, ch / 3 + 10);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('Enter your name:', cw / 2, ch / 2 - 30);

    // Name input box
    const boxW = 300;
    const boxH = 40;
    const boxX = (cw - boxW) / 2;
    const boxY = ch / 2 - 10;

    ctx.fillStyle = 'rgba(30, 35, 50, 0.9)';
    ctx.strokeStyle = '#5577AA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    const displayName = this.playerName + (Date.now() % 1000 < 500 ? '|' : '');
    ctx.fillText(displayName, cw / 2, boxY + 28);

    ctx.fillStyle = '#556677';
    ctx.font = '13px monospace';
    ctx.fillText('Press ENTER to submit', cw / 2, boxY + boxH + 30);
  }

  private renderScoreTable(ctx: CanvasRenderingContext2D, cw: number, ch: number): void {
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('🏆 HIGH SCORES', cw / 2, 80);

    const scores = getHighScores();

    if (scores.length === 0) {
      ctx.fillStyle = '#666666';
      ctx.font = '18px monospace';
      ctx.fillText('No scores yet. Play a game!', cw / 2, ch / 2);
    } else {
      const startY = 140;
      const rowH = 40;

      // Header
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#8899AA';
      ctx.textAlign = 'left';
      ctx.fillText('#', cw / 2 - 200, startY);
      ctx.fillText('NAME', cw / 2 - 170, startY);
      ctx.fillText('BATTLES', cw / 2 + 80, startY);
      ctx.fillText('DATE', cw / 2 + 170, startY);

      for (let i = 0; i < scores.length; i++) {
        const s = scores[i];
        const y = startY + (i + 1) * rowH;
        const isGold = i === 0;

        ctx.fillStyle = isGold ? '#FFD700' : (i < 3 ? '#CCCCCC' : '#888888');
        ctx.font = isGold ? 'bold 16px monospace' : '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}.`, cw / 2 - 200, y);
        ctx.fillText(s.name, cw / 2 - 170, y);
        ctx.fillText(`${s.battlesCompleted}`, cw / 2 + 80, y);
        ctx.fillStyle = '#667788';
        ctx.fillText(s.date, cw / 2 + 170, y);
      }
    }

    ctx.fillStyle = '#556677';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE or ESC to return', cw / 2, ch - 40);
  }
}
