import { Unit } from '../core/Types.ts';
import { GameConfig } from '../config/GameConfig.ts';
import { getGrowthData } from '../database/ClassGrowthDatabase.ts';

// ─── Experience System ───────────────────────────────────────────────────────

export interface LevelUpResult {
  hpGain: number;
  attackGain: number;
  defenseGain: number;
  movementGain: number;
}

export function grantAttackXP(unit: Unit): void {
  unit.experience += GameConfig.XP_PER_ATTACK;
}

export function grantKillXP(unit: Unit): void {
  unit.experience += GameConfig.XP_PER_KILL;
}

export function canLevelUp(unit: Unit): boolean {
  return unit.experience >= GameConfig.XP_TO_LEVEL_UP;
}

export function applyLevelUp(unit: Unit): LevelUpResult {
  unit.experience -= GameConfig.XP_TO_LEVEL_UP;
  unit.level++;

  const growth = getGrowthData(unit.className);
  const result: LevelUpResult = {
    hpGain: 0,
    attackGain: 0,
    defenseGain: 0,
    movementGain: 0,
  };

  const applyGrowth = (val: number) => Math.floor(val) + (Math.random() < (val % 1) ? 1 : 0);

  const hpG = applyGrowth(growth.hp);
  if (hpG > 0) {
    unit.maxHP += hpG;
    result.hpGain = hpG;
  }
  
  // Note: Attack growth would modify damageDice in actual implementations
  // For now, we skip attack growth since damage is determined by damageDice rolls
  
  const defG = applyGrowth(growth.defense);
  if (defG > 0) {
    unit.defense += defG;
    result.defenseGain = defG;
  }
  
  const movG = applyGrowth(growth.movement);
  if (movG > 0) {
    unit.movementRange += movG;
    result.movementGain = movG;
  }

  // Restore HP and MP fully on level up
  unit.currentHP = unit.maxHP;
  unit.currentMP = unit.maxMP;

  return result;
}
