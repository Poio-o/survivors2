import { Unit, Team, Position } from '../core/Types.ts';
import { getUnitData } from '../database/UnitDatabase.ts';

// ─── Unit Factory ────────────────────────────────────────────────────────────
let nextUnitId = 1;

export function createUnit(templateId: string, team: Team, position: Position): Unit {
  const data = getUnitData(templateId);
  if (!data) {
    throw new Error(`Unknown unit template: ${templateId}`);
  }

  const unit: Unit = {
    id: nextUnitId++,
    templateId: data.id,
    name: data.name,
    className: data.className,
    team,
    position: { ...position },
    maxHP: data.maxHP,
    currentHP: data.maxHP,
    maxMP: data.maxMP || 0,
    currentMP: data.maxMP || 0,
    attack: data.attack || 0,
    damageDice: data.damageDice,
    defense: data.defense,
    movementRange: data.movementRange,
    attackRange: data.attackRange,
    level: 1,
    experience: 0,
    abilities: [...data.abilities],
    passives: [...(data.passives || [])],
    statusEffects: [],
    hasActed: false,
    hasMoved: false,
    color: team === Team.PLAYER ? data.color : '#FF4444',
    // Animation
    animX: position.x,
    animY: position.y,
    isMoving: false,
    isDying: false,
    deathAlpha: 1,
    flashTimer: 0,
    offsetX: 0,
    offsetY: 0,
  };

  return unit;
}

export function resetUnitIdCounter(): void {
  nextUnitId = 1;
}
