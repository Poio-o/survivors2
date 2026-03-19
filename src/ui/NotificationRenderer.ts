import { GameConfig } from '../config/GameConfig.ts';

interface NotificationInfo {
  text: string;
  timer: number;
}

export class NotificationRenderer {
  private notifications: NotificationInfo[] = [];

  show(text: string): void {
    this.notifications.push({ text, timer: 3.0 });
  }

  update(dt: number): void {
    for (const notif of this.notifications) {
      notif.timer -= dt;
    }
    this.notifications = this.notifications.filter(n => n.timer > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.notifications.length === 0) return;

    const cw = GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;

    for (let i = 0; i < this.notifications.length; i++) {
      const notif = this.notifications[i];
      const alpha = Math.min(1, notif.timer);
      
      const y = (ch / 4) + (i * 40);

      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Background bar
      ctx.fillStyle = 'rgba(20, 10, 30, 0.8)';
      ctx.fillRect(0, y - 24, cw, 48);
      
      // Top/bottom borders
      ctx.fillStyle = '#AA44FF';
      ctx.fillRect(0, y - 24, cw, 2);
      ctx.fillRect(0, y + 22, cw, 2);

      // Text
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      
      // Shadow
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText(notif.text, cw / 2, y + 8);
      
      ctx.restore();
    }
  }
}
