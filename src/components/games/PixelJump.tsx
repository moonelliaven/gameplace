import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Trophy, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  hasStar?: boolean;
}

const PLAY_W = 300;
const GRAVITY = 1440; // px/s^2
const BOUNCE_VELOCITY = 560; // auto bounce when landing
const HOP_VELOCITY = 390; // space jump from a platform
const MOVE_SPEED = 270; // px/s
const MAX_FALL = 1100;

export const PixelJump: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(150);
  const [playerY, setPlayerY] = useState(110);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [bounceFx, setBounceFx] = useState<{ id: number; x: number; y: number } | null>(null);

  const bestScore = getHighScoreForGame('pixel-jump');
  const playerXRef = useRef(150);
  const playerYRef = useRef(110);
  const velocityRef = useRef(0);
  const groundedRef = useRef(false);
  const platformsRef = useRef<Platform[]>([]);
  const scoreRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const initPlatforms = useCallback(() => {
    const list: Platform[] = [{ id: 'p-base', x: 90, y: 60, width: 120 }];
    for (let i = 1; i < 8; i++) {
      list.push({
        id: `p-${i}`,
        x: Math.random() * (PLAY_W - 100) + 10,
        y: 60 + i * 52,
        width: 72,
        hasStar: Math.random() < 0.4,
      });
    }
    platformsRef.current = list;
    setPlatforms(list);
  }, []);

  const startGame = () => {
    sound.playClick();
    scoreRef.current = 0;
    playerXRef.current = 150;
    playerYRef.current = 110;
    velocityRef.current = 0;
    groundedRef.current = false;
    keysRef.current = { left: false, right: false };
    setScore(0);
    setPlayerX(150);
    setPlayerY(110);
    initPlatforms();
    setGameState('PLAYING');
  };

  const finish = useCallback(() => {
    sound.playGameOver();
    setGameState('FINISHED');
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  const handleJump = () => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;
    if (groundedRef.current) {
      groundedRef.current = false;
      velocityRef.current = HOP_VELOCITY;
      sound.playPop();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleJump();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  });

  // Main loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const loop = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
        // Horizontal movement
        if (keysRef.current.left) playerXRef.current -= MOVE_SPEED * dt;
        if (keysRef.current.right) playerXRef.current += MOVE_SPEED * dt;
        playerXRef.current = Math.max(4, Math.min(PLAY_W - 26, playerXRef.current));

        // Vertical physics
        velocityRef.current -= GRAVITY * dt;
        if (velocityRef.current < -MAX_FALL) velocityRef.current = -MAX_FALL;
        const prevY = playerYRef.current;
        playerYRef.current += velocityRef.current * dt;
        groundedRef.current = false;

        // Landing check while falling
        if (velocityRef.current < 0) {
          for (const p of platformsRef.current) {
            const top = p.y + 16;
            if (prevY >= top && playerYRef.current <= top + 8 && playerYRef.current > top - 30) {
              if (playerXRef.current + 14 >= p.x && playerXRef.current - 14 <= p.x + p.width) {
                playerYRef.current = top;
                velocityRef.current = BOUNCE_VELOCITY;
                groundedRef.current = true;
                sound.playPop();
                const fxId = Date.now();
                setBounceFx({ id: fxId, x: playerXRef.current, y: top + 8 });
                setTimeout(() => setBounceFx((f) => (f?.id === fxId ? null : f)), 350);
                if (p.hasStar) {
                  scoreRef.current += 50;
                  setScore(scoreRef.current);
                  sound.playScore();
                  p.hasStar = false;
                }
                break;
              }
            }
          }
        }

        // Camera scroll up
        if (playerYRef.current > 190) {
          const dy = playerYRef.current - 190;
          playerYRef.current = 190;
          scoreRef.current += Math.floor(dy / 4);
          setScore(scoreRef.current);

          let moved = platformsRef.current.map((p) => ({ ...p, y: p.y - dy }));
          moved = moved.filter((p) => p.y > -30);
          while (moved.length < 8) {
            const topY = moved[moved.length - 1]?.y ?? 200;
            moved.push({
              id: `p-${Date.now()}-${moved.length}`,
              x: Math.random() * (PLAY_W - 100) + 10,
              y: topY + 52,
              width: 72,
              hasStar: Math.random() < 0.4,
            });
          }
          platformsRef.current = moved;
          setPlatforms(moved);
        }

        // Fall off screen
        if (playerYRef.current < -40) {
          finish();
          return;
        }

        setPlayerX(playerXRef.current);
        setPlayerY(playerYRef.current);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop, finish]);

  const handleRestart = () => {
    sound.playClick();
    stopLoop();
    startGame();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-[#0d0d1a] text-white overflow-hidden">
      {/* Top HUD */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-cyan-400 font-pixel">
          HEIGHT: <span className="text-yellow-400 text-sm">{score}m</span>
        </div>
        <div className="text-indigo-400 font-pixel flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>BEST: {bestScore}</span>
        </div>
      </div>

      {/* Vertical Jumping Area */}
      <div className="relative flex-1 bg-gradient-to-b from-[#1e1b4b] via-[#121226] to-[#090914] overflow-hidden p-2">
        {bounceFx && (
          <div
            className="absolute z-20 text-xs pointer-events-none animate-ping"
            style={{ left: `${bounceFx.x}px`, bottom: `${bounceFx.y}px` }}
          >
            ✦
          </div>
        )}

        {/* Player */}
        <div
          style={{
            left: `${playerX}px`,
            bottom: `${playerY}px`,
            transform: `translateX(-50%) rotate(${velocityRef.current > 100 ? 15 : velocityRef.current < -50 ? -20 : 0}deg)`,
          }}
          className="absolute text-3xl z-30 transition-all duration-75"
        >
          🐸
        </div>

        {/* Platforms */}
        {platforms.map((p) => (
          <div
            key={p.id}
            style={{ left: `${p.x}px`, bottom: `${p.y}px`, width: `${p.width}px` }}
            className="absolute h-4 bg-emerald-500 border-2 border-black rounded shadow-[2px_2px_0_0_#000] flex items-center justify-center"
          >
            {p.hasStar && <span className="text-xs">⭐</span>}
          </div>
        ))}

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-cyan-400 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL JUMP</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Bounce from platform to platform! Move with A/D (or ◀ ▶), press SPACE to hop higher.
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
            <h2 className="font-pixel text-2xl text-red-500 mb-2">FELL DOWN!</h2>
            <p className="font-mono text-sm text-slate-300 mb-6">
              FINAL HEIGHT: <span className="text-yellow-400 font-bold">{score}m</span>
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

      {/* Touch Buttons */}
      <div className="p-3 bg-[#121224] border-t-4 border-black flex justify-center items-center gap-3">
        <button
          onPointerDown={() => (keysRef.current.left = true)}
          onPointerUp={() => (keysRef.current.left = false)}
          onPointerLeave={() => (keysRef.current.left = false)}
          className="pixel-btn p-3 bg-cyan-600 text-white font-pixel text-xs active:translate-y-1 flex flex-col items-center"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>A</span>
        </button>
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            handleJump();
          }}
          className="pixel-btn px-8 py-3 bg-yellow-400 text-slate-950 font-pixel text-xs active:translate-y-1 flex flex-col items-center"
        >
          <ArrowUp className="w-6 h-6 fill-slate-950" />
          <span>SPACE</span>
        </button>
        <button
          onPointerDown={() => (keysRef.current.right = true)}
          onPointerUp={() => (keysRef.current.right = false)}
          onPointerLeave={() => (keysRef.current.right = false)}
          className="pixel-btn p-3 bg-cyan-600 text-white font-pixel text-xs active:translate-y-1 flex flex-col items-center"
        >
          <ArrowRight className="w-6 h-6" />
          <span>D</span>
        </button>
      </div>
    </div>
  );
};