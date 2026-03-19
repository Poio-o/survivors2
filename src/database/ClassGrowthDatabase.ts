import { GrowthData } from '../core/Types.ts';

// ─── Growth Rates per Class ──────────────────────────────────────────────────
// Each value = probability (0‐1) of gaining +1 in that stat on level-up
export const ClassGrowthDatabase: Record<string, GrowthData> = {
  knight: {
    hp: 2.0,
    attack: 1.0,
    defense: 1.0,
    movement: 0.05,
  },
  archer: {
    hp: 1.0,
    attack: 1.0,
    defense: 0.2,
    movement: 0.05,
  },
  mage: {
    hp: 1.0,
    attack: 2.0,
    defense: 0.2,
    movement: 0.05,
  },
  thief: {
    hp: 1.0,
    attack: 1.0,
    defense: 0.3,
    movement: 0.15, // ocasionalmente +1
  },
  zoroark: {
    hp: 1.0,
    attack: 2.0,
    defense: 0.2,
    movement: 0.0,
  },
  josuke: {
    hp: 2.0,
    attack: 0.2,
    defense: 1.0,
    movement: 0.0,
  },
};

export function getGrowthData(className: string): GrowthData {
  return ClassGrowthDatabase[className] ?? { hp: 0.5, attack: 0.4, defense: 0.3, movement: 0.05 };
}
