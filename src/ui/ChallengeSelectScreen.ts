import { GameConfig } from '../config/GameConfig.ts';
import { CHALLENGES, ChallengeSystem } from '../systems/ChallengeSystem.ts';
import { SoundManager } from '../audio/SoundManager.ts';

export class ChallengeSelectScreen {
  private selectedIndex: number = 0;

  reset(): void {
    this.selectedIndex = 0;
  }

  moveSelection(delta: number): void {
    this.selectedIndex += delta;
    if (this.selectedIndex < 0) this.selectedIndex = CHALLENGES.length; // Extra option for "Back"
    else if (this.selectedIndex > CHALLENGES.length) this.selectedIndex = 0;
  }

  getSelected(): string | null {
    if (this.selectedIndex === CHALLENGES.length) return 'Back';
    return CHALLENGES[this.selectedIndex].id;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const cw = GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;

    ctx.fillStyle = GameConfig.COLORS.MENU_OVERLAY;
    ctx.fillRect(0, 0, cw, ch);

    ctx.textAlign = 'center';
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('⚡ CHALLENGES ⚡', cw / 2, 120);

    const startY = 240;
    const rowH = 60;

    for (let i = 0; i <= CHALLENGES.length; i++) {
      const y = startY + i * rowH;
      const isSelected = this.selectedIndex === i;

      if (i < CHALLENGES.length) {
        const challenge = CHALLENGES[i];
        const isCompleted = ChallengeSystem.isCompleted(challenge.id);
        
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#AAAAAA';
        ctx.font = isSelected ? 'bold 28px monospace' : '24px monospace';
        
        const prefix = isSelected ? '> ' : '  ';
        const star = isCompleted ? ' ⭐' : '';
        ctx.fillText(prefix + challenge.name + star, cw / 2, y);

        if (isSelected) {
          ctx.fillStyle = '#88AAFF';
          ctx.font = '18px monospace';
          ctx.fillText(challenge.description, cw / 2, y + 30);
        }
      } else {
        // Back button
        const yBack = y + 40; // Add some gap
        ctx.fillStyle = isSelected ? '#FF4444' : '#AA4444';
        ctx.font = isSelected ? 'bold 28px monospace' : '24px monospace';
        const prefix = isSelected ? '> ' : '  ';
        ctx.fillText(prefix + 'Back', cw / 2, yBack);
      }
    }
  }
}
