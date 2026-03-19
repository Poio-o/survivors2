import { GameConfig } from '../config/GameConfig.ts';

// ─── Economy System ──────────────────────────────────────────────────────────

export class EconomySystem {
  gold: number;

  constructor(startingGold: number = GameConfig.STARTING_GOLD) {
    this.gold = startingGold;
  }

  calculateReward(enemiesDefeated: number): number {
    return GameConfig.BASE_GOLD_REWARD + GameConfig.GOLD_PER_KILL * enemiesDefeated;
  }

  addGold(amount: number): void {
    this.gold += amount;
  }

  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  spend(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.gold -= cost;
    return true;
  }
}
