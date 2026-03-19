// ─── Core Game Configuration ─────────────────────────────────────────────────
export const GameConfig = {
  // Map — random size per battle
  TILE_SIZE: 64,
  MAP_MIN_WIDTH: 20,
  MAP_MAX_WIDTH: 35,
  MAP_MIN_HEIGHT: 12,
  MAP_MAX_HEIGHT: 20,

  // Canvas / Viewport
  CANVAS_WIDTH: 1920,   // 15 tiles visible
  CANVAS_HEIGHT: 960,  // 15 tiles visible

  // UI Layout
  SHOP_PANEL_WIDTH: 280,
  COMBAT_LOG_WIDTH: 280,

  // Units
  INITIAL_PLAYER_UNITS: 5,
  INITIAL_ENEMY_UNITS: 3,

  // Economy
  BASE_GOLD_REWARD: 100,
  GOLD_PER_KILL: 20,
  STARTING_GOLD: 500,

  // Experience
  XP_PER_ATTACK: 10,
  XP_PER_KILL: 30,
  XP_TO_LEVEL_UP: 100,

  // Animation
  MOVE_SPEED: 6,           // tiles per second during movement animation
  CURSOR_BLINK_RATE: 500,  // ms

  // Colors
  COLORS: {
    CURSOR: '#FFD700',
    MOVE_HIGHLIGHT: 'rgba(0, 120, 255, 0.35)',
    ATTACK_HIGHLIGHT: 'rgba(255, 40, 40, 0.4)',
    DEPLOY_HIGHLIGHT: 'rgba(0, 120, 255, 0.35)',
    PATH_PREVIEW: 'rgba(0, 200, 255, 0.6)',
    GRID_LINE: 'rgba(0, 0, 0, 0.15)',
    MENU_OVERLAY: 'rgba(0, 0, 0, 0.55)',
    HUD_BG: 'rgba(20, 20, 30, 0.85)',
    HUD_TEXT: '#FFFFFF',
    HP_BAR_BG: '#333',
    HP_BAR_FILL: '#44DD44',
    HP_BAR_LOW: '#DD4444',
    MP_BAR_FILL: '#4488FF',
    PLAYER_COLOR: '#4488FF',
    ENEMY_COLOR: '#FF4444',
  },
} as const;
