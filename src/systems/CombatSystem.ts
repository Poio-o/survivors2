import { Unit, CombatResult } from '../core/Types.ts';
import { getTerrainData } from '../database/TerrainDatabase.ts';
import { getAbilityData } from '../database/AbilityDatabase.ts';
import { GameMap } from '../map/GameMap.ts';
import { rollDice } from './DiceSystem.ts';

// ─── Combat System ───────────────────────────────────────────────────────────

/**
 * CA = 8 (base) + floor(defense / 2) + terrain defense bonus
 */
export function calculateAC(unit: Unit, map: GameMap): number {
  const terrain = getTerrainData(map.getTerrainId(unit.position.x, unit.position.y));
  let defense = unit.defense;

  // Aquatic bonus on water
  if (unit.passives?.includes('aquatic') && terrain.id === 'water') {
    defense += 2;
  }

  return 8 + Math.floor(defense / 2) + terrain.defenseBonus;
}

/**
 * Attack bonus = floor(attack / 2), added to damage after dice roll.
 */
function getAttackBonus(unit: Unit, map: GameMap): number {
  let attack = unit.attack || 0;

  // Aquatic bonus on water
  const terrain = getTerrainData(map.getTerrainId(unit.position.x, unit.position.y));
  if (unit.passives?.includes('aquatic') && terrain.id === 'water') {
    attack += 2;
  }

  return Math.floor(attack / 2);
}

export function executeCombat(attacker: Unit, defender: Unit, map: GameMap): CombatResult {
  const targetAC = calculateAC(defender, map);
  const attackRoll = rollDice('1d20');

  let isCrit = false;
  let isCritFail = false;
  let isHit = false;

  if (attackRoll === 20) {
    isHit = true;
    isCrit = true;
  } else if (attackRoll === 1) {
    isHit = false;
    isCritFail = true;
  } else if (attackRoll >= targetAC) {
    isHit = true;
  }

  let damage = 0;
  if (isHit) {
    const rawDamage = rollDice(attacker.damageDice);
    const bonus = getAttackBonus(attacker, map);
    damage = isCrit ? (rawDamage + bonus) * 2 : rawDamage + bonus;
  }

  defender.currentHP = Math.max(0, defender.currentHP - damage);
  const defenderDied = defender.currentHP <= 0;

  return {
    attacker,
    defender,
    damage,
    defenderDied,
    attackRoll,
    targetAC,
    isHit,
    isCrit,
    isCritFail,
  };
}

export interface AbilityResult {
  attacker: Unit;
  target: Unit;
  combatResults: CombatResult[];
  healed: number;
  targetDied: boolean;
}

export function executeAbility(attacker: Unit, target: Unit, abilityId: string, map: GameMap): AbilityResult {
  const result: AbilityResult = {
    attacker,
    target,
    combatResults: [],
    healed: 0,
    targetDied: false,
  };

  const ability = getAbilityData(abilityId);
  if (!ability) return result;

  if (ability.id === 'darkSlash') {
    // 3 hits
    for (let i = 0; i < 3; i++) {
      if (target.currentHP <= 0) break;
      const combatRes = executeCombat(attacker, target, map);
      result.combatResults.push(combatRes);
      result.targetDied = combatRes.defenderDied;
      if (result.targetDied) break;
    }
  } else if (ability.id === 'crazyDiamond') {
    // Heal 1d8 + caster level
    const healAmount = rollDice('1d8') + attacker.level;
    target.currentHP = Math.min(target.maxHP, target.currentHP + healAmount);
    result.healed = healAmount;
  }

  // Deduct MP
  attacker.currentMP -= ability.mpCost;

  return result;
}
