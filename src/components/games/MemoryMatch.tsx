import React, { useState, useEffect } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Trophy, Timer, Sparkles } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

const ICONS = ['🎮', '🕹️', '👾', '🚀', '⭐', '🍕', '💎', '🔥'];

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMatch: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [matchesCount, setMatchesCount] = useState(0);

  const bestScore = getHighScoreForGame('memory-match');

  // Initialize cards
  useEffect(() => {
    const pairIcons = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5);
    setCards(
      pairIcons.map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }))
    );
  }, []);

  // Countdown timer
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sound.playGameOver();
          onGameOver(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, score, onGameOver]);

  // Handle card click
  const handleCardClick = (id: number) => {
    if (isPaused || flippedIds.length >= 2) return;

    const targetCard = cards.find((c) => c.id === id);
    if (!targetCard || targetCard.isFlipped || targetCard.isMatched) return;

    sound.playClick();

    const newCards = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped;
      const card1 = newCards.find((c) => c.id === firstId);
      const card2 = newCards.find((c) => c.id === secondId);

      if (card1 && card2 && card1.icon === card2.icon) {
        // Match!
        setTimeout(() => {
          sound.playScore();
          setScore((s) => s + 100);
          setMatchesCount((m) => {
            const nextM = m + 1;
            if (nextM === ICONS.length) {
              sound.playWin();
              onGameOver(score + 100 + timeLeft * 10);
            }
            return nextM;
          });

          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIds([]);
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          sound.playBomb();
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
        }, 800);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-[#0d0d1a] text-white">
      {/* Top HUD */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-yellow-400 font-pixel">
          SCORE: <span className="text-white text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1 font-pixel text-xs bg-yellow-400 text-black px-2 py-0.5 rounded border border-black">
          <Timer className="w-3.5 h-3.5" />
          <span>{timeLeft}s</span>
        </div>

        <div className="text-cyan-400 font-pixel flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>BEST: {bestScore}</span>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="flex-1 p-4 grid grid-cols-4 gap-3 bg-gradient-to-b from-[#121226] to-[#0d0d1a] items-center justify-center">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square rounded border-4 border-black flex items-center justify-center text-3xl font-pixel cursor-pointer transition-all shadow-[4px_4px_0_0_#000] active:translate-y-1 ${
              card.isMatched
                ? 'bg-emerald-900/60 border-emerald-400 opacity-80'
                : card.isFlipped
                ? 'bg-yellow-400 text-black border-white'
                : 'bg-[#1a1a3e] hover:bg-[#252555] border-cyan-400'
            }`}
          >
            {card.isFlipped || card.isMatched ? card.icon : '❓'}
          </div>
        ))}
      </div>
    </div>
  );
};
