import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Trophy, ArrowUp } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Obstacle {
  id: string;
  x: number;
  type: 'cactus' | 'bird';
}

const GRAVITY = 1500; // px/s^2
const JUMP_VELOCITY = 540; // px/s -> ~97px jump height
const SPEED = 2.4; // px per frame ~ 144 px/s (slower)
const MAX_FALL = 1200;

export const PixelRunner: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [score, setScore] = useState(0);
  const [runnerY, setRunnerY] = useState(0); // 0 = ground
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const bestScore = getHighScoreForGame('pixel-runner');
  const runnerYRef = useRef(0);
  const velocityRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const stopLoop = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const startGame = () => {
    sound.playClick();
    runnerYRef.current = 0;
    velocityRef.current = 0;
    scoreRef.current = 0;
    obstaclesRef.current = [{ id: `obs-${Date.now()}`, x: 360, type: 'cactus' }];
    setRunnerY(0);
    setScore(0);
    setObstacles(obstaclesRef.current);
    setGameState('PLAYING');
  };

  const finish = useCallback(() => {
    sound.playGameOver();
    setGameState('FINISHED');
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  const handleJump = () => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;
    if (runnerYRef.current <= 0.1) {
      runnerYRef.current = 0;
      velocityRef.current = JUMP_VELOCITY;
      sound.playPop();
    }
  };

  // Main loop (ref-based, dt driven)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const loop = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
        // Runner physics
        velocityRef.current -= GRAVITY * dt;
        if (velocityRef.current < -MAX_FALL) velocityRef.current = -MAX_FALL;
        runnerYRef.current += velocityRef.current * dt;
        if (runnerYRef.current <= 0) {
          runnerYRef.current = 0;
          velocityRef.current = 0;
        }

        // Score increment
        scoreRef.current += 1;
        setScore(scoreRef.current);

        // Move obstacles
        const speed = SPEED * 60 * dt;
        const updated = obstaclesRef.current
          .map((obs) => ({ ...obs, x: obs.x - speed }))
          .filter((o) => o.x > -60);

        // Collision — real box overlap between runner and obstacle
        const playerBottom = 40 + runnerYRef.current;
        const playerTop = playerBottom + 40;
        for (const obs of updated) {
          if (obs.x > 45 && obs.x < 95) {
            const obsBottom = obs.type === 'cactus' ? 40 : 86;
            const obsTop = obs.type === 'cactus' ? 70 : 116;
            if (playerBottom < obsTop && playerTop > obsBottom) {
              sound.playBomb();
              finish();
              return;
            }
          }
        }

        // Spawn next obstacle
        const last = updated[updated.length - 1];
        if (!last || last.x < 250) {
          if (Math.random() < 0.05) {
            updated.push({
              id: `obs-${Date.now()}-${Math.random()}`,
              x: 360,
              type: Math.random() < 0.22 ? 'bird' : 'cactus',
            });
          }
        }

        obstaclesRef.current = updated;
        setObstacles(updated);
        setRunnerY(runnerYRef.current);
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop, finish]);

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
  });

  const handleRestart = () => {
    sound.playClick();
    stopLoop();
    startGame();
  };

  return (
    <div
      onPointerDown={handleJump}
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

        {/* Runner — flipped to face right (forward), bobs while running, leans on jump */}
        <div
          style={{ bottom: `${40 + runnerY}px`, left: '45px' }}
          className={`absolute text-4xl z-30 ${runnerYRef.current <= 0.1 ? 'animate-runner' : 'animate-jump'}`}
        >
          🏃
        </div>

        {/* Obstacles */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            style={{
              left: `${obs.x}px`,
              bottom: obs.type === 'bird' ? '86px' : '40px',
              transform: obs.type === 'bird' ? 'scaleX(-1)' : undefined,
            }}
            className="absolute text-3xl z-20"
          >
            {obs.type === 'cactus' ? '🌵' : '🦅'}
          </div>
        ))}

        <style>{`
          @keyframes runnerBob {
            0%, 100% { transform: scaleX(-1) rotate(0deg) translateY(0); }
            25% { transform: scaleX(-1) rotate(-6deg) translateY(-3px); }
            75% { transform: scaleX(-1) rotate(6deg) translateY(3px); }
          }
          @keyframes runnerJump {
            0%, 100% { transform: scaleX(-1) rotate(-12deg); }
            50% { transform: scaleX(-1) rotate(14deg); }
          }
          .animate-runner { animation: runnerBob 0.28s steps(2, end) infinite; }
          .animate-jump { animation: runnerJump 0.4s ease-out; }
        `}</style>

        {/* Ground */}
        <div className="w-full h-10 bg-amber-800 border-t-4 border-black flex items-center justify-center relative z-20">
          <span className="font-pixel text-[10px] text-amber-200">TAP / CLICK / SPACE TO JUMP</span>
        </div>
      </div>

      {gameState === 'READY' && (
        <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
          <h1 className="font-pixel text-3xl text-emerald-400 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL RUNNER</h1>
          <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
            Run forward and jump over the cacti and birds! Tap, click or press SPACE to jump.
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
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
          <h2 className="font-pixel text-2xl text-red-500 mb-2">CRASH!</h2>
          <p className="font-mono text-sm text-slate-300 mb-6">
            FINAL DIST: <span className="text-yellow-400 font-bold">{Math.floor(score / 5)}m</span>
          </p>
          <button
            onClick={handleRestart}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm px-8 py-3 border-4 border-black shadow-[4px_4px_0_#000] active:translate-y-1 cursor-pointer"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

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
