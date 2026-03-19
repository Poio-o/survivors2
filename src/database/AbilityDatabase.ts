import { AbilityData } from '../core/Types.ts';

// ─── Ability Definitions ─────────────────────────────────────────────────────
// Placeholder ability pool — extend as needed
export const AbilityDatabase: Record<string, AbilityData> = {
  darkSlash: {
    id: 'darkSlash',
    name: 'Dark Slash',
    description: 'Golpea al enemigo 3 veces consecutivas.',
    type: 'attack',
    mpCost: 3,
    range: 1,
  },
  crazyDiamond: {
    id: 'crazyDiamond',
    name: 'Crazy Diamond',
    description: 'Cura vida a un aliado (heal = attack * 2).',
    type: 'heal',
    mpCost: 4,
    range: 1,
  },
};

export function getAbilityData(id: string): AbilityData | undefined {
  return AbilityDatabase[id];
}
