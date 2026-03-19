export class SoundManager {
  private static instance: SoundManager;

  musicVolume: number = 10;
  sfxVolume: number = 40;
  
  private musicCache: Map<string, HTMLAudioElement> = new Map();
  private sfxCache: Map<string, HTMLAudioElement> = new Map();
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicId: string = '';
  private battleTracks: string[] = [
    'Fire Emblem Fates OST - 11. Dusk Falls (Fire)',
    'Fire Emblem Fates OST - 3. Far Dawn (Storm)',
    'Fire Emblem Fates OST - 7. Justice RIP (Storm)'
  ];

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async loadAll(): Promise<void> {
    const sfxFiles = [
      'cannot select', 'death', 'heal', 'hit', 'level up', 'miss', 'select', 'win', 'losing'
    ];

    for (const file of sfxFiles) {
      const audio = new Audio(`/sounds/effects/${file}.mp3`);
      // We don't throw on error so the game still runs if sound is missing
      audio.onerror = () => console.warn(`Failed to load SFX: ${file}`);
      this.sfxCache.set(file, audio);
    }

    for (const file of this.battleTracks) {
      const audio = new Audio(`/sounds/battlemusic/${file}.mp3`);
      audio.loop = true;
      audio.onerror = () => console.warn(`Failed to load music: ${file}`);
      this.musicCache.set(file, audio);
    }
  }

  saveSettings(): void {
    const data = {
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
    };
    localStorage.setItem('survivors2_audio', JSON.stringify(data));
    this.applyVolumes();
  }

  loadSettings(): void {
    const saved = localStorage.getItem('survivors2_audio');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.musicVolume = typeof data.musicVolume === 'number' ? data.musicVolume : 10;
        this.sfxVolume = typeof data.sfxVolume === 'number' ? data.sfxVolume : 40;
      } catch (e) {
        console.warn('Failed to parse audio settings.');
      }
    }
    this.applyVolumes();
  }

  setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(100, vol));
    this.saveSettings();
  }

  setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(100, vol));
    this.saveSettings();
  }

  private applyVolumes(): void {
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume / 100;
    }
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.currentMusicId = '';
    }
  }

  playMusic(id: string): void {
    if (this.currentMusic) {
      if (this.currentMusicId === id) return; // Already playing
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }
    
    let exactId = id;
    if (id === 'victory') exactId = 'win';
    if (id === 'defeat') exactId = 'losing';

    const track = this.musicCache.get(exactId);
    if (track) {
      this.currentMusic = track;
      this.currentMusicId = id;
      track.volume = this.musicVolume / 100;
      
      const playPromise = track.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.warn('Music play prevented by browser restrictions', e));
      }
    } else {
       // If standard cache misses, try loading dynamically just in case
       const audioPath = (exactId === 'win' || exactId === 'losing') ? `/sounds/effects/${exactId}.mp3` : `/sounds/battlemusic/${exactId}.mp3`;
       const audio = new Audio(audioPath);
       audio.volume = this.musicVolume / 100;
       audio.play().catch(e => console.warn('Music play prevented', e));
       this.currentMusic = audio;
       this.currentMusicId = exactId;
    }
  }

  /**
   * Play a random battle music track, avoiding the previously played one.
   */
  playRandomBattleMusic(): void {
    const available = this.battleTracks.filter(t => t !== this.currentMusicId);
    if (available.length === 0) {
      if (this.battleTracks.length > 0) this.playMusic(this.battleTracks[0]);
      return;
    }
    const pick = available[Math.floor(Math.random() * available.length)];
    this.playMusic(pick);
  }

  /**
   * Maps generic game events to actual audio file names.
   */
  playSound(id: string): void {
    let exactFile = id;

    // Mapping game events to actual available sounds
    if (id === 'move_cursor') exactFile = 'select';
    else if (id === 'dodge') exactFile = 'miss';
    else if (id === 'ability') exactFile = 'heal';
    else if (id === 'shop_buy') exactFile = 'level up';
    else if (id === 'victory') exactFile = 'win';
    else if (id === 'defeat') exactFile = 'losing';
    
    // Prevent overlapping shop_buy sounds
    if (id === 'shop_buy') {
      const original = this.sfxCache.get(exactFile);
      if (original) {
        if (!original.paused && original.currentTime > 0) return; // already playing original instance
        original.volume = this.sfxVolume / 100;
        original.play().catch(e => console.warn('SFX play prevented', e));
        return; // We skip cloning for shop_buy so it can't overlap
      }
    }

    // Only play if it exists in cache
    const sfx = this.sfxCache.get(exactFile);
    if (sfx) {
      const clone = sfx.cloneNode() as HTMLAudioElement;
      clone.volume = this.sfxVolume / 100;
      
      const playPromise = clone.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.warn('SFX play prevented by browser restrictions', e));
      }
    } else {
      // Dynamic fallback for un-cached sounds
      const audio = new Audio(`/sounds/effects/${exactFile}.mp3`);
      audio.volume = this.sfxVolume / 100;
      audio.play().catch(e => console.warn('SFX play prevented', e));
    }
  }
}

