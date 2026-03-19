// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Team {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
}

export enum GamePhase {
  MAIN_MENU = 'MAIN_MENU',
  SOUND_SETTINGS = 'SOUND_SETTINGS',
  HIGH_SCORES = 'HIGH_SCORES',
  CHALLENGE_SELECT = 'CHALLENGE_SELECT',
  SHOP = 'SHOP',
  DEPLOYMENT = 'DEPLOYMENT',
  PLAYER_TURN = 'PLAYER_TURN',
  ENEMY_TURN = 'ENEMY_TURN',
  MENU_OPEN = 'MENU_OPEN',
  MOVING = 'MOVING',
  ANIMATION = 'ANIMATION',
  SELECTING_ATTACK_TARGET = 'SELECTING_ATTACK_TARGET',
  SELECTING_ABILITY_TARGET = 'SELECTING_ABILITY_TARGET',
  COMBAT_ANIMATION = 'COMBAT_ANIMATION',
  BATTLE_RESULT = 'BATTLE_RESULT',
  EMPTY_TILE_MENU = 'EMPTY_TILE_MENU',
  NAME_ENTRY = 'NAME_ENTRY',
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface StatusEffect {
  name: string;
  duration: number;
  effectType: string;
  onTurnStart?: 'dealDamage' | 'skipTurn';
  damageDice?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface TerrainData {
  id: string;
  name: string;
  movementCost: number;
  defenseBonus: number;
  evasionBonus: number;
  passable: boolean;
  color: string;
}

export interface UnitData {
  id: string;
  name: string;
  className: string;
  maxHP: number;
  maxMP: number;
  attack: number;
  damageDice: string;
  defense: number;
  movementRange: number;
  attackRange: number;
  cost: number;
  color: string;
  abilities: string[];
  passives: string[];
}

export interface GrowthData {
  hp: number;       // probability 0-1
  attack: number;
  defense: number;
  movement: number;
}

export interface AbilityData {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'heal' | 'passive';
  mpCost: number;
  range: number;
}

export interface Unit {
  id: number;
  templateId: string;
  name: string;
  className: string;
  team: Team;
  position: Position;
  maxHP: number;
  currentHP: number;
  maxMP: number;
  currentMP: number;
  attack: number;
  damageDice: string;
  defense: number;
  movementRange: number;
  attackRange: number;
  level: number;
  experience: number;
  abilities: string[];
  passives: string[];
  statusEffects: StatusEffect[];
  hasActed: boolean;
  hasMoved: boolean;
  color: string;

  // Animation state
  animX: number;
  animY: number;
  isMoving: boolean;
  isDying: boolean;
  deathAlpha: number;
  flashTimer: number;
  offsetX: number;
  offsetY: number;
}

export interface Tile {
  terrainId: string;
}

export interface MapData {
  width: number;
  height: number;
  terrain: string[][];
  playerSpawns: Position[];
  enemySpawns: Position[];
  // Challenge mode fields
  playerUnits?: { id: string; position: Position }[];
  enemyUnits?: { id: string; position: Position }[];
}

export interface CombatResult {
  attacker: Unit;
  defender: Unit;
  damage: number;
  defenderDied: boolean;
  attackRoll?: number;
  targetAC?: number;
  isHit?: boolean;
  isCrit?: boolean;
  isCritFail?: boolean;
}

export interface SaveData {
  playerUnits: Unit[];
  enemyUnits: Unit[];
  gold: number;
  currentMap: string;
  turnNumber: number;
  battleNumber: number;
  enemyGoldBudget: number;
  mapData?: MapData;
}

export interface HighScore {
  name: string;
  battlesCompleted: number;
  date: string;
}
