import React, { useState, useEffect, useRef } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Trophy, ArrowUp } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Obstacle {
  id: string;
  x: number;
  type: 'cactus' | 'bird';
}

export const PixelRunner: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [score, setScore] = useState(0);
  const [runnerY, setRunnerY] = useState(0); // 0 = ground
  const [velocity, setVelocity] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const bestScore = getHighScoreForGame('pixel-runner');
  const gameLoopRef = useRef<number | null>(null);

  const GRAVITY = 0.7;
  const JUMP_POWER = 12.5;
  const SPEED = 3.2;

  const handleJump = () => {
    if (isPaused || gameOver) return;
    if (runnerY === 0) {
      sound.playPop();
      setVelocity(JUMP_POWER);
    }
  };

  useEffect(() => {
    setObstacles([{ id: 'obs-1', x: 350, type: 'cactus' }]);
  }, []);

  // Main Loop
  useEffect(() => {
    if (isPaused || gameOver) return;

    const loop = () => {
      // Runner physics
      setRunnerY((prevY) => {
        let nextY = prevY + velocity;
        if (nextY <= 0) {
          nextY = 0;
          setVelocity(0);
        } else {
          setVelocity((v) => v - GRAVITY);
        }
        return nextY;
      });

      // Score increment
      setScore((s) => s + 1);

      // Move obstacles & detect hit
      setObstacles((prevObs) => {
        const updated = prevObs.map((obs) => {
          const nextX = obs.x - SPEED;

          // Collision check
          if (nextX > 30 && nextX < 75) {
            const runnerHeight = obs.type === 'cactus' ? 35 : 55;
            if (runnerY < runnerHeight) {
              sound.playBomb();
              setGameOver(true);
              onGameOver(score);
            }
          }

          return { ...obs, x: nextX };
        });

        const filtered = updated.filter((o) => o.x > -50);

        if (filtered.length === 0 || (filtered[filtered.length - 1]?.x < 230 && Math.random() < 0.02)) {
          filtered.push({
            id: `obs-${Date.now()}`,
            x: 350,
            type: Math.random() < 0.25 ? 'bird' : 'cactus',
          });
        }

        return filtered;
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [runnerY, velocity, obstacles, isPaused, gameOver, score, onGameOver]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runnerY, isPaused, gameOver]);

  return (
    <div
      onClick={handleJump}
      className="flex flex-col h-full w-full select-none font-mono bg-[#0d0d1a] relative cursor-pointer touch-none overflow-hidden"
    >
      {/* Top HUD */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#151525] border-b-4 border-black text-xs font-bold z-20">
        <div className="text-emerald-400 font-pixel">
          DIST: <span className="text-yellow-400 text-sm">{Math.floor(score / 5)}m</span>
        </div>
        <div className="text-cyan-400 font-pixel flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>BEST: {bestScore}</span>
        </div>
      </div>

      {/* Desert Runner Canvas Area */}
      <div className="relative flex-1 bg-gradient-to-b from-amber-900/40 via-amber-950/80 to-[#121226] overflow-hidden flex flex-col justify-end">
        {/* Sun */}
        <div className="absolute top-6 right-10 w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-400/40 flex items-center justify-center text-2xl">
          ☀️
        </div>

        {/* Runner */}
        <div
          style={{ bottom: `${40 + runnerY}px`, left: '45px' }}
          className="absolute text-4xl z-30 transition-all duration-75"
        >
          🏃
        </div>

        {/* Obstacles */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            style={{
              left: `${obs.x}px`,
              bottom: obs.type === 'bird' ? '90px' : '40px',
            }}
            className="absolute text-3xl z-20"
          >
            {obs.type === 'cactus' ? '🌵' : '🦅'}
          </div>
        ))}

        {/* Ground */}
        <div className="w-full h-10 bg-amber-800 border-t-4 border-black flex items-center justify-center relative z-20">
          <span className="font-pixel text-[10px] text-amber-200">TAP / CLICK / SPACE TO JUMP</span>
        </div>
      </div>

      {/* Touch jump button */}
      <div className="p-3 bg-[#151525] border-t-4 border-black flex justify-center">
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            handleJump();
          }}
          className="flex-1 max-w-sm bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm py-3.5 border-2 border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 cursor-pointer touch-none flex items-center justify-center gap-2"
        >
          <ArrowUp className="w-5 h-5 fill-slate-950" />
          JUMP (SPACE)
        </button>
      </div>
    </div>
  );
};
