import { GameConfig } from '../config/GameConfig.ts';

interface LogEntry {
  message: string;
  timestamp: number;
}

/**
 * Scrolling combat log rendered as a right-side panel.
 */
export class CombatLog {
  private entries: LogEntry[] = [];
  private maxEntries: number = 20;
  private messageLifetime: number = 30000; // ms — longer lifetime for panel view

  addMessage(message: string): void {
    this.entries.push({
      message,
      timestamp: performance.now(),
    });

    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  update(time: number): void {
    // Fade out old messages
    this.entries = this.entries.filter(entry => time - entry.timestamp < this.messageLifetime);
  }

  /**
   * Render as right-side panel.
   */
  renderPanel(ctx: CanvasRenderingContext2D, time: number, canvasW: number, panelW: number, canvasH: number): void {
    const panelX = canvasW - panelW;

    // Panel background
    ctx.fillStyle = 'rgba(15, 18, 30, 0.95)';
    ctx.fillRect(panelX, 0, panelW, canvasH);

    // Left border
    ctx.strokeStyle = '#334466';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(panelX, 0);
    ctx.lineTo(panelX, canvasH);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#AABBCC';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('📜 COMBAT LOG', panelX + panelW / 2, 24);

    // Entries (newest at bottom)
    const pad = 8;
    const lineH = 18;
    const maxLines = Math.floor((canvasH - 40) / lineH);
    const visibleEntries = this.entries.slice(-maxLines);

    ctx.textAlign = 'left';
    ctx.font = '10px monospace';

    for (let i = 0; i < visibleEntries.length; i++) {
      const entry = visibleEntries[i];
      const age = time - entry.timestamp;

      // Calculate alpha
      let alpha = 1.0;
      if (age > this.messageLifetime - 2000) {
        alpha = 1.0 - ((age - (this.messageLifetime - 2000)) / 2000);
      }

      const y = 44 + i * lineH;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);

      // Alternate row background
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(panelX + 4, y - 12, panelW - 8, lineH);
      }

      ctx.fillStyle = '#CCCCCC';
      
      // Wrap text if too long
      const text = entry.message;
      const maxW = panelW - pad * 2;
      if (ctx.measureText(text).width > maxW) {
        ctx.fillText(text.substring(0, Math.floor(maxW / 6)) + '…', panelX + pad, y);
      } else {
        ctx.fillText(text, panelX + pad, y);
      }

      ctx.restore();
    }
  }

  render(ctx: CanvasRenderingContext2D, time: number): void {
    // Legacy render — no longer used, routing through renderPanel
  }
}
