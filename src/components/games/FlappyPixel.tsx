import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Trophy, ArrowUp } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export const FlappyPixel: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(150);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');

  const bestScore = getHighScoreForGame('flappy-pixel');
  const birdYRef = useRef(150);
  const velocityRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const GAME_HEIGHT = 360;
  const GAP_HEIGHT = 115;

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const startGame = () => {
    sound.playClick();
    birdYRef.current = 150;
    velocityRef.current = 0;
    scoreRef.current = 0;
    pipesRef.current = [
      { x: 300, topHeight: 100, passed: false },
      { x: 500, topHeight: 140, passed: false },
    ];
    setBirdY(150);
    setScore(0);
    setGameState('PLAYING');
  };

  const finish = useCallback(() => {
    sound.playGameOver();
    setGameState('FINISHED');
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  // Flap: soft jump that floats — small impulse, and the parachute glide slows the fall
  const handleFlap = () => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;
    sound.playPop();
    velocityRef.current = Math.max(-110, velocityRef.current - 110);
  };

  // Main loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const loop = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
        // Gentle gravity + parachute cap on fall speed
        velocityRef.current += 200 * dt;
        if (velocityRef.current > 95) velocityRef.current = 95;
        birdYRef.current += velocityRef.current * dt;

        // Ceiling / floor
        if (birdYRef.current <= 0) {
          birdYRef.current = 0;
          velocityRef.current = 0;
        }
        if (birdYRef.current >= GAME_HEIGHT - 30) {
          birdYRef.current = GAME_HEIGHT - 30;
          finish();
          return;
        }

        // Pipes
        for (let i = pipesRef.current.length - 1; i >= 0; i--) {
          const pipe = pipesRef.current[i];
          pipe.x -= 85 * dt;

          if (!pipe.passed && pipe.x + 52 < 80) {
            pipe.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            sound.playScore();
          }

          if (pipe.x < -60) pipesRef.current.splice(i, 1);
        }

        // Keep at least 2 pipes, spaced ~1.9s apart
        while (pipesRef.current.length < 2) {
          const lastX = pipesRef.current[pipesRef.current.length - 1]?.x ?? 0;
          const base = Math.max(320, lastX + 165);
          pipesRef.current.push({
            x: base,
            topHeight: 60 + Math.random() * 120,
            passed: false,
          });
        }

        // Collision with pipes — solid: the bird box (left 80, width 32) can never cross a pipe
        for (const pipe of pipesRef.current) {
          if (pipe.x < 112 && pipe.x + 52 > 80) {
            if (birdYRef.current < pipe.topHeight || birdYRef.current + 32 > pipe.topHeight + GAP_HEIGHT) {
              finish();
              return;
            }
          }
        }

        setBirdY(birdYRef.current);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop, finish]);

  // Spacebar / arrow up controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleFlap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleRestart = () => {
    sound.playClick();
    stopLoop();
    startGame();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-[#0d0d1a] overflow-hidden">
      {/* HUD Bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#151525] border-b-4 border-black z-20 text-xs font-bold">
        <div className="text-yellow-400 font-pixel">
          SCORE: <span className="text-white text-base">{score}</span>
        </div>
        <div className="text-cyan-400 font-pixel text-xs flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>BEST: {bestScore}</span>
        </div>
      </div>

      {/* Main Sky Area */}
      <div
        onPointerDown={handleFlap}
        className="relative flex-1 bg-gradient-to-b from-sky-400 via-sky-300 to-amber-200 overflow-hidden border-b-8 border-emerald-600 cursor-pointer touch-none"
      >
        {/* Pixel Clouds */}
        <div className="absolute top-6 left-10 text-white/80 text-3xl font-pixel pointer-events-none">☁️</div>
        <div className="absolute top-12 right-12 text-white/80 text-4xl font-pixel pointer-events-none">☁️</div>

        {/* Pixel Bird */}
        <div
          style={{ top: `${birdY}px`, left: '80px', transform: `rotate(${Math.max(-25, Math.min(30, velocityRef.current * 0.15))}deg)` }}
          className="absolute w-9 h-9 z-30"
        >
          <div className="w-8 h-8 bg-yellow-400 border-2 border-black rounded-sm shadow-[2px_2px_0_0_#000] flex items-center justify-center text-lg">
            🐤
          </div>
        </div>

        {/* Parachute hint when falling */}
        {gameState === 'PLAYING' && velocityRef.current > 60 && (
          <div className="absolute z-20 pointer-events-none animate-pulse" style={{ top: `${Math.max(0, birdY - 34)}px`, left: '80px' }}>
            <span className="text-xl">🪂</span>
          </div>
        )}

        {/* Pipes */}
        {pipesRef.current.map((pipe, idx) => (
          <React.Fragment key={`${idx}-${pipe.x.toFixed(0)}`}>
            <div
              style={{ left: `${pipe.x}px`, height: `${pipe.topHeight}px`, width: '52px' }}
              className="absolute top-0 bg-emerald-500 border-4 border-black border-t-0 shadow-[4px_0_0_0_#000]"
            >
              <div className="absolute bottom-0 left-[-4px] w-[60px] h-6 bg-emerald-400 border-4 border-black" />
            </div>
            <div
              style={{ left: `${pipe.x}px`, top: `${pipe.topHeight + GAP_HEIGHT}px`, bottom: 0, width: '52px' }}
              className="absolute bg-emerald-500 border-4 border-black border-b-0 shadow-[4px_0_0_0_#000]"
            >
              <div className="absolute top-0 left-[-4px] w-[60px] h-6 bg-emerald-400 border-4 border-black" />
            </div>
          </React.Fragment>
        ))}

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-8 bg-amber-800 border-t-4 border-emerald-600 flex items-center justify-center">
          <span className="font-pixel text-[10px] text-amber-200">TAP / CLICK / SPACE TO FLAP</span>
        </div>

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-sky-950/70 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-yellow-400 mb-2 filter drop-shadow-[4px_4px_0_#000]">FLAPPY PIXEL</h1>
            <p className="font-mono text-xs text-white/80 max-w-xs mb-6">
              Tap to flap! Hold nothing and the bird gently glides down like a parachute. Dodge the pipes!
            </p>
            <button
              onClick={startGame}
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm px-8 py-3.5 border-4 border-black shadow-[4px_4px_0_#000] active:translate-y-1 cursor-pointer"
            >
              START GAME
            </button>
          </div>
        )}

        {gameState === 'FINISHED' && (
          <div className="absolute inset-0 bg-sky-950/80 flex flex-col items-center justify-center p-6 text-center z-30">
            <h2 className="font-pixel text-2xl text-red-500 mb-2">CRASH!</h2>
            <p className="font-mono text-sm text-white mb-6">
              FINAL SCORE: <span className="text-yellow-400 font-bold">{score}</span>
            </p>
            <button
              onClick={handleRestart}
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm px-8 py-3 border-4 border-black shadow-[4px_4px_0_#000] active:translate-y-1 cursor-pointer"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Touch jump button */}
      <div className="p-3 bg-[#151525] border-t-4 border-black flex justify-center">
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            handleFlap();
          }}
          className="flex-1 max-w-sm bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm py-3.5 border-2 border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 cursor-pointer touch-none flex items-center justify-center gap-2"
        >
          <ArrowUp className="w-5 h-5 fill-slate-950" />
          JUMP / FLAP
        </button>
      </div>
    </div>
  );
};
