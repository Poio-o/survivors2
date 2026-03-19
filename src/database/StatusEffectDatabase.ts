import { StatusEffect } from '../core/Types.ts';

export const StatusEffectDatabase: Record<string, StatusEffect> = {
  bleed: {
    name: 'Bleed',
    duration: 3,
    effectType: 'bleed',
    onTurnStart: 'dealDamage',
    damageDice: '1d4'
  },
  poison: {
    name: 'Poison',
    duration: 4,
    effectType: 'poison',
    onTurnStart: 'dealDamage',
    damageDice: '1d3'
  },
  stun: {
    name: 'Stun',
    duration: 1,
    effectType: 'stun',
    onTurnStart: 'skipTurn'
  }
};
