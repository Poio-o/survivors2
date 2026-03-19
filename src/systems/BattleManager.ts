import { Unit } from '../core/Types.ts';

/**
 * Manages the high-level progression of the tactical campaign.
 */
export class BattleManager {
  currentBattleNumber: number = 1;
  enemyGoldBudget: number = 300;

  /**
   * Prepares the state for the next battle.
   */
  advance(): void {
    this.currentBattleNumber++;
    this.enemyGoldBudget += 100;
  }

  /**
   * Processes player units after a battle:
   * - Removes dead units (perma-death).
   * - Heals survivors to full HP and MP.
   * - Resets action state and clears status effects.
   */
  processSurvivors(units: Unit[]): Unit[] {
    // Keep only those with HP > 0
    const survivors = units.filter(u => u.currentHP > 0);
    
    // Fully restore survivors
    for (const unit of survivors) {
      unit.currentHP = unit.maxHP;
      unit.currentMP = unit.maxMP;
      unit.hasActed = false;
      unit.statusEffects = [];
    }

    return survivors;
  }
}
