import { Game } from './core/Game.ts';
import { SpriteManager } from './render/SpriteManager.ts';
import { SoundManager } from './audio/SoundManager.ts';
// ─── Entry Point ─────────────────────────────────────────────────────────────

async function main() {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #gameCanvas not found');
  }

  await SpriteManager.getInstance().loadAll();
  await SoundManager.getInstance().loadAll();

  const game = new Game(canvas);
  game.startMainMenu();
}

main().catch(console.error);
