import { GameConfig } from '../config/GameConfig.ts';
import { SoundManager } from '../audio/SoundManager.ts';
import { hasSaveData } from '../save/SaveSystem.ts';

export class MainMenu {
  private menuIndex: number = 0;
  private soundIndex: number = 0;
  
  public gameMode: 'Random' | 'Challenges' = 'Random';

  private getOptions(): string[] {
    const opts = ['New Game'];
    if (hasSaveData()) opts.push('Continue');
    opts.push('Challenges');
    opts.push('High Scores');
    opts.push('Sound Settings');
    return opts;
  }

  private soundOptions: string[] = ['Music Volume', 'SFX Volume', 'Back'];

  reset(): void {
    this.menuIndex = 0;
    this.soundIndex = 0;
  }

  moveSelection(delta: number, isSoundMode: boolean): void {
    if (isSoundMode) {
      this.soundIndex = (this.soundIndex + delta + this.soundOptions.length) % this.soundOptions.length;
    } else {
      const opts = this.getOptions();
      this.menuIndex = (this.menuIndex + delta + opts.length) % opts.length;
    }
  }

  adjustVolume(delta: number): void {
    const sm = SoundManager.getInstance();
    if (this.soundIndex === 0) {
      sm.setMusicVolume(sm.musicVolume + delta);
    } else if (this.soundIndex === 1) {
      sm.setSfxVolume(sm.sfxVolume + delta);
    }
  }

  getSelected(isSoundMode: boolean): string {
    if (isSoundMode) return this.soundOptions[this.soundIndex];
    const opts = this.getOptions();
    this.menuIndex = Math.max(0, Math.min(this.menuIndex, opts.length - 1));
    return opts[this.menuIndex] || 'New Game';
  }

  render(ctx: CanvasRenderingContext2D, isSoundMode: boolean): void {
    const cw = GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
    ctx.fillRect(0, 0, cw, ch);

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#4488FF';
    ctx.shadowBlur = 10;
    ctx.fillText('TACTICAL SURVIVORS', cw / 2, ch / 4);
    ctx.shadowBlur = 0; // reset

    const startY = ch / 2 - 30;
    const itemHeight = 50;

    if (!isSoundMode) {
      const opts = this.getOptions();
      this.menuIndex = Math.max(0, Math.min(this.menuIndex, opts.length - 1));
      for (let i = 0; i < opts.length; i++) {
        const text = opts[i];
        const isSelected = i === this.menuIndex;

        ctx.font = isSelected ? 'bold 32px monospace' : '24px monospace';
        ctx.fillStyle = isSelected ? '#FFD700' : '#CCCCCC';
        if (isSelected) {
          ctx.fillText(`> ${text} <`, cw / 2, startY + i * itemHeight);
        } else {
          ctx.fillText(text, cw / 2, startY + i * itemHeight);
        }
      }
    } else {
      // Sound Settings
      ctx.font = 'bold 36px monospace';
      ctx.fillStyle = '#AAAAFF';
      ctx.fillText('Sound Settings', cw / 2, startY - 60);

      const sm = SoundManager.getInstance();
      
      for (let i = 0; i < this.soundOptions.length; i++) {
        const text = this.soundOptions[i];
        const isSelected = i === this.soundIndex;

        ctx.font = isSelected ? 'bold 28px monospace' : '24px monospace';
        ctx.fillStyle = isSelected ? '#FFD700' : '#CCCCCC';

        const y = startY + i * itemHeight;

        if (i === 0) {
          const arrowL = isSelected ? '< ' : '';
          const arrowR = isSelected ? ' >' : '';
          ctx.fillText(`Music: ${arrowL}${sm.musicVolume}${arrowR}`, cw / 2, y);
        } else if (i === 1) {
          const arrowL = isSelected ? '< ' : '';
          const arrowR = isSelected ? ' >' : '';
          ctx.fillText(`SFX: ${arrowL}${sm.sfxVolume}${arrowR}`, cw / 2, y);
        } else {
          ctx.fillText(isSelected ? `> ${text} <` : text, cw / 2, y);
        }
      }
    }
  }
}
