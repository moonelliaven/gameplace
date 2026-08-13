export type GameCategory = 'ALL' | 'ARCADE' | 'PUZZLE' | 'CASUAL' | 'REACTION';

export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  category: Exclude<GameCategory, 'ALL'>;
  difficulty: GameDifficulty;
  color: string; // Tailwind color class for card accents
  bgColor: string;
  iconName: string;
}

export interface GameScore {
  score: number;
  highestCombo?: number;
  date?: string;
}

export type HighScores = Record<string, number>;

export interface GameContainerProps {
  onGameOver: (finalScore: number, combo?: number) => void;
  onExit: () => void;
  isPaused: boolean;
}
