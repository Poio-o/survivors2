import { Unit, Team, Position } from '../core/Types.ts';

// ─── Unit Manager ────────────────────────────────────────────────────────────
export class UnitManager {
  units: Unit[] = [];

  addUnit(unit: Unit): void {
    this.units.push(unit);
  }

  removeUnit(id: number): void {
    this.units = this.units.filter((u) => u.id !== id);
  }

  getUnitAt(pos: Position): Unit | undefined {
    return this.units.find((u) => u.position.x === pos.x && u.position.y === pos.y && !u.isDying);
  }

  getTeamUnits(team: Team): Unit[] {
    return this.units.filter((u) => u.team === team && !u.isDying);
  }

  getAllLiving(): Unit[] {
    return this.units.filter((u) => !u.isDying);
  }

  resetActed(team: Team): void {
    for (const u of this.getTeamUnits(team)) {
      u.hasActed = false;
      u.hasMoved = false;
    }
  }

  allActed(team: Team): boolean {
    return this.getTeamUnits(team).every((u) => u.hasActed);
  }

  isOccupied(x: number, y: number, excludeId?: number): boolean {
    return this.units.some(
      (u) => u.position.x === x && u.position.y === y && !u.isDying && u.id !== excludeId
    );
  }
}
