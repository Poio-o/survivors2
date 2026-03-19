import { HighScore } from '../core/Types.ts';

const HIGH_SCORE_KEY = 'tactical_survivors_highscores';
const MAX_SCORES = 10;

export function getHighScores(): HighScore[] {
  const raw = localStorage.getItem(HIGH_SCORE_KEY);
  if (!raw) return [];
  try {
    const scores: HighScore[] = JSON.parse(raw);
    return scores.sort((a, b) => b.battlesCompleted - a.battlesCompleted).slice(0, MAX_SCORES);
  } catch {
    return [];
  }
}

export function addHighScore(name: string, battlesCompleted: number): void {
  const scores = getHighScores();
  scores.push({
    name: name || 'Anonymous',
    battlesCompleted,
    date: new Date().toLocaleDateString(),
  });
  scores.sort((a, b) => b.battlesCompleted - a.battlesCompleted);
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores.slice(0, MAX_SCORES)));
}
