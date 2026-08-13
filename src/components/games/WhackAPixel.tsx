import React, { useState, useEffect } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Trophy, Timer, Hammer } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Hole {
  id: number;
  activeType: 'monster' | 'gold' | 'bomb' | null;
}

export const WhackAPixel: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [holes, setHoles] = useState<Hole[]>(
    Array.from({ length: 9 }, (_, i) => ({ id: i, activeType: null }))
  );

  const bestScore = getHighScoreForGame('whack-a-pixel');

  // Spawn monsters periodically
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * 9);
      const rand = Math.random();
      const type: 'monster' | 'gold' | 'bomb' = rand < 0.6 ? 'monster' : rand < 0.85 ? 'gold' : 'bomb';

      setHoles((prev) =>
        prev.map((h, i) => (i === randomIndex ? { ...h, activeType: type } : h))
      );

      // Hide after 2.6s (slow enough to react comfortably)
      setTimeout(() => {
        setHoles((prev) =>
          prev.map((h, i) => (i === randomIndex ? { ...h, activeType: null } : h))
        );
      }, 2600);
    }, 1500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Timer
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

  // Whack hole
  const handleWhack = (index: number) => {
    if (isPaused) return;

    const hole = holes[index];
    if (!hole.activeType) return;

    if (hole.activeType === 'monster') {
      sound.playScore();
      setScore((s) => s + 50);
    } else if (hole.activeType === 'gold') {
      sound.playWin();
      setScore((s) => s + 150);
    } else if (hole.activeType === 'bomb') {
      sound.playBomb();
      setScore((s) => Math.max(0, s - 100));
    }

    setHoles((prev) => prev.map((h, i) => (i === index ? { ...h, activeType: null } : h)));
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-[#0d0d1a] text-white">
      {/* HUD */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-rose-400 font-pixel">
          SCORE: <span className="text-yellow-400 text-sm">{score}</span>
        </div>

        <div className="flex items-center gap-1 font-pixel text-xs bg-rose-600 text-white px-2 py-0.5 rounded border border-black">
          <Timer className="w-3.5 h-3.5" />
          <span>{timeLeft}s</span>
        </div>

        <div className="text-cyan-400 font-pixel flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>BEST: {bestScore}</span>
        </div>
      </div>

      {/* 3x3 Grid */}
      <div className="flex-1 p-6 grid grid-cols-3 gap-4 bg-gradient-to-b from-[#1a1226] to-[#0d0d1a] items-center justify-center">
        {holes.map((hole) => (
          <div
            key={hole.id}
            onClick={() => handleWhack(hole.id)}
            className="aspect-square bg-amber-950 border-4 border-black rounded-full shadow-[inset_0_8px_12px_rgba(0,0,0,0.8)] flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
          >
            {hole.activeType === 'monster' && (
              <span className="text-4xl sm:text-5xl transition-transform duration-200 scale-100">👾</span>
            )}
            {hole.activeType === 'gold' && (
              <span className="text-4xl sm:text-5xl transition-transform duration-200 scale-100">👑</span>
            )}
            {hole.activeType === 'bomb' && (
              <span className="text-4xl sm:text-5xl transition-transform duration-200 scale-100">💣</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
