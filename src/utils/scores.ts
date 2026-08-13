import { HighScores } from '../types';

const STORAGE_KEY = 'gameplace_high_scores';

export function getHighScores(): HighScores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getHighScoreForGame(gameId: string): number {
  const scores = getHighScores();
  return scores[gameId] || 0;
}

export function saveHighScore(gameId: string, score: number): boolean {
  const current = getHighScoreForGame(gameId);
  if (score > current) {
    const scores = getHighScores();
    scores[gameId] = score;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    return true; // New High Score!
  }
  return false;
}

export function resetAllScores(): void {
  localStorage.removeItem(STORAGE_KEY);
}
