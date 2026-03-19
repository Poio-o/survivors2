export interface Challenge {
  id: string;
  name: string;
  description: string;
  fileName: string;
}

export const CHALLENGES: Challenge[] = [
  { id: 'chal1', name: 'The Bridge', description: 'Push across a narrow chokepoint against archers.', fileName: 'challenge1.json' },
  { id: 'chal2', name: 'Forest Ambush', description: 'Survive a dense forest crawling with thieves.', fileName: 'challenge2.json' },
  { id: 'chal3', name: 'Island Hopping', description: 'A watery arena demanding flying or aquatic units.', fileName: 'challenge3.json' },
  { id: 'chal4', name: 'Mountain Pass', description: 'Break through a fortified mountain valley.', fileName: 'challenge4.json' },
  { id: 'chal5', name: 'The Arena', description: 'Survive a massive swarm on an open battlefield.', fileName: 'challenge5.json' }
];

export class ChallengeSystem {
  static getCompletedChallenges(): string[] {
    const data = localStorage.getItem('survivors2_challenges');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  static isCompleted(id: string): boolean {
    const completed = this.getCompletedChallenges();
    return completed.includes(id);
  }

  static markCompleted(id: string): void {
    const completed = this.getCompletedChallenges();
    if (!completed.includes(id)) {
      completed.push(id);
      localStorage.setItem('survivors2_challenges', JSON.stringify(completed));
    }
  }
}
