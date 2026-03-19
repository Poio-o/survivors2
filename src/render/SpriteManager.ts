export class SpriteManager {
  private static instance: SpriteManager;
  private sprites: Map<string, HTMLImageElement | HTMLCanvasElement> = new Map();

  private constructor() {}

  static getInstance(): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager();
    }
    return SpriteManager.instance;
  }

  async loadAll(): Promise<void> {
    const units = ['knight', 'archer', 'mage', 'thief', 'zoroark', 'josuke', 'pegasus', 'merfolk', 'skeleton'];
    const tiles = ['grass', 'forest', 'rock', 'water'];

    const promises: Promise<void>[] = [];

    // Load units
    for (const u of units) {
      // Map Sprites
      promises.push(this.loadImage(`${import.meta.env.BASE_URL}sprites/units_map/${u}.png`, u).then(img => {
        if (img) {
          this.sprites.set(`${u}_map`, img);
          // Generate tinted enemy version
          this.sprites.set(`${u}_map_enemy`, this.createTintedSprite(img, 'rgba(255, 0, 0, 0.4)'));
        }
      }));

      // Portrait Sprites
      promises.push(this.loadImage(`${import.meta.env.BASE_URL}sprites/units_portrait/${u}.png`, u).then(img => {
        if (img) {
          this.sprites.set(`${u}_portrait`, img);
        }
      }));
    }

    // Load tiles
    for (const t of tiles) {
      promises.push(this.loadImage(`${import.meta.env.BASE_URL}sprites/tiles/${t}.png`, t).then(img => {
        if (img) this.sprites.set(`tile_${t}`, img);
      }));
    }

    await Promise.allSettled(promises);
  }

  private loadImage(src: string, id: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Sprite not found: ${src}`);
        resolve(null);
      };
      img.src = src;
    });
  }

  private createTintedSprite(img: HTMLImageElement, color: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width || 64;
    canvas.height = img.height || 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }

  getSprite(id: string): HTMLImageElement | HTMLCanvasElement | undefined {
    return this.sprites.get(id);
  }
}
