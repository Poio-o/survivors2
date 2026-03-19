import { UnitData } from '../core/Types.ts';
import { getAllUnitData } from '../database/UnitDatabase.ts';

/**
 * Generates an army of enemy units based on a gold budget.
 */
export class EnemyArmyGenerator {
  static generateArmy(budget: number): UnitData[] {
    const allUnits = getAllUnitData();
    const army: UnitData[] = [];
    let remainingBudget = budget;

    // Filter units that can actually be bought (at least one unit must fit)
    const affordableUnits = allUnits.filter(u => u.cost <= remainingBudget);
    
    if (affordableUnits.length === 0) return [];

    // Simple greedy random approach
    while (remainingBudget > 0) {
      // Pick a random unit that we can afford
      const candidates = affordableUnits.filter(u => u.cost <= remainingBudget);
      if (candidates.length === 0) break;

      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      army.push(selected);
      remainingBudget -= selected.cost;

      // Small optimization: if the cheapest unit is more expensive than remaining budget, stop
      const minCost = Math.min(...candidates.map(u => u.cost));
      if (remainingBudget < minCost) break;
    }

    return army;
  }
}
