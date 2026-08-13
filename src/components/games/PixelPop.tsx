import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { PartyPopper, Zap, RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Balloon {
  id: number;
  type: 'normal' | 'golden' | 'bomb';
  icon: string;
  points: number;
  x: number; // percentage 10-90
  y: number; // pixels from top
  speed: number; // px per sec
  color: string;
}

export const PixelPop: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'PLAYING' | 'PAUSED' | 'FINISHED'>('PLAYING');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [highestCombo, setHighestCombo] = useState(1);
  const [balloonsPopped, setBalloonsPopped] = useState(0);
  const [bombCount, setBombCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [popEffects, setPopEffects] = useState<Array<{ id: number; x: number; y: number; text: string; color: string }>>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedDurationRef = useRef<number>(0);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const comboRef = useRef(combo);
  comboRef.current = combo;

  const GAME_DURATION = 30;
  const bestScore = getHighScoreForGame('pixel-pop');

  // Pause transition handling
  useEffect(() => {
    if (isPaused) {
      if (gameState === 'PLAYING') {
        setGameState('PAUSED');
        pausedTimeRef.current = performance.now();
      }
    } else {
      if (gameState === 'PAUSED') {
        setGameState('PLAYING');
        if (pausedTimeRef.current > 0) {
          totalPausedDurationRef.current += performance.now() - pausedTimeRef.current;
          pausedTimeRef.current = 0;
        }
      }
    }
  }, [isPaused, gameState]);

  const stopAllGameLoops = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  // Spawn balloon according to recommended speed: 90-130 px/sec
  const spawnBalloon = useCallback(() => {
    const rand = Math.random();
    let type: 'normal' | 'golden' | 'bomb' = 'normal';
    let icon = '🎈';
    let points = 10;
    let color = '#06b6d4';
    let speed = 100; // 90-130 px/s range

    if (rand < 0.22) {
      type = 'golden';
      icon = '👑';
      points = 50;
      color = '#f59e0b';
      speed = 125;
    } else if (rand < 0.38) {
      type = 'bomb';
      icon = '💣';
      points = -30;
      color = '#ef4444';
      speed = 95;
    } else {
      type = 'normal';
      icon = '🎈';
      points = 10;
      color = '#ec4899';
      speed = 105;
    }

    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      const balloon: Balloon = {
        id: Date.now() + Math.random(),
        type,
        icon,
        points,
        x: Math.floor(Math.random() * 76) + 12,
        y: height + 20,
        speed,
        color,
      };

      setBalloons((prev) => [...prev, balloon]);
    }
  }, []);

  // Initialize Game Time
  useEffect(() => {
    startTimeRef.current = 0;
    totalPausedDurationRef.current = 0;
    pausedTimeRef.current = 0;
    lastTimeRef.current = 0;
    lastSpawnRef.current = 0;
  }, []);

  // Frame animation loop with real-time timestamp delta time
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      stopAllGameLoops();
      return;
    }

    const update = (now: number) => {
      if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;

      if (startTimeRef.current === 0) {
        startTimeRef.current = now;
      }
      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // Timestamp timer
      const effectiveNow = now - totalPausedDurationRef.current;
      const elapsed = Math.max(0, (effectiveNow - startTimeRef.current) / 1000);
      const remaining = Math.max(0, Math.ceil(GAME_DURATION - elapsed));
      setTimeLeft((prev) => (prev !== remaining ? remaining : prev));

      // Finish condition
      if (remaining <= 0) {
        sound.playWin();
        setGameState('FINISHED');
        stopAllGameLoops();
        onGameOver(scoreRef.current, comboRef.current);
        return;
      }

      // Spawn every 450ms
      if (now - lastSpawnRef.current > 450) {
        spawnBalloon();
        lastSpawnRef.current = now;
      }

      setBalloons((prev) => {
        const next: Balloon[] = [];
        for (const b of prev) {
          const nextY = b.y - b.speed * dt;
          if (nextY > -50) {
            next.push({ ...b, y: nextY });
          }
        }
        return next;
      });

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      stopAllGameLoops();
    };
  }, [gameState, spawnBalloon, stopAllGameLoops, onGameOver]);

  // Click balloon
  const handlePop = (balloon: Balloon, e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;

    if (balloon.type === 'bomb') {
      sound.playBomb();
      setCombo(1);
      setBombCount((b) => b + 1);
    } else {
      sound.playPop();
      if (combo >= 2) sound.playCombo();
      setBalloonsPopped((bp) => bp + 1);
    }

    const currentCombo = balloon.type === 'bomb' ? 1 : combo;
    const addedPoints = balloon.points * currentCombo;

    setScore((s) => Math.max(0, s + addedPoints));

    if (balloon.type !== 'bomb') {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > highestCombo) setHighestCombo(nextCombo);
    }

    // Effect
    const effectId = Date.now() + Math.random();
    setPopEffects((effs) => [
      ...effs,
      {
        id: effectId,
        x: balloon.x,
        y: balloon.y,
        text: addedPoints >= 0 ? `+${addedPoints} POP!` : `${addedPoints}`,
        color: balloon.color,
      },
    ]);

    setTimeout(() => {
      setPopEffects((effs) => effs.filter((ef) => ef.id !== effectId));
    }, 600);

    // Remove popped balloon
    setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));
  };

  const handleRestart = () => {
    stopAllGameLoops();
    setScore(0);
    setCombo(1);
    setHighestCombo(1);
    setBalloonsPopped(0);
    setBombCount(0);
    setTimeLeft(30);
    setBalloons([]);
    setPopEffects([]);

    startTimeRef.current = 0;
    totalPausedDurationRef.current = 0;
    pausedTimeRef.current = 0;
    lastTimeRef.current = 0;
    lastSpawnRef.current = 0;

    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono">
      {/* Top HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-pink-400 flex items-center gap-2">
          <PartyPopper className="w-4 h-4" />
          <span>POINTS: <span className="text-white">{score}</span></span>
        </div>

        <div className="flex items-center gap-3 font-pixel text-[11px]">
          <div className="flex items-center gap-1"><Zap className="w-4 h-4 fill-yellow-400" /> <span>COMBO x{combo}</span></div>
          <div className="flex items-center gap-1 text-emerald-400"><span className="text-white font-bold">✓ CORRECT:</span> <span className="text-white">{balloonsPopped}</span></div>
          <div className="flex items-center gap-1 text-rose-500"><span className="text-white font-bold">💣 BOMBS:</span> <span className="text-white">{bombCount}</span></div>
        </div>

        <div className="text-cyan-400">
          TIME: <span className={`text-white ${timeLeft <= 5 ? 'text-red-500 animate-ping' : ''}`}>{timeLeft}s</span>
        </div>
      </div>

      {/* Sky Blue Pixel Art Field */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] overflow-hidden border-b-4 border-black"
      >
        {/* Pixel Sky Atmosphere */}
        <div className="absolute inset-0 pointer-events-none opacity-40 flex flex-col justify-between p-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl">☀️</span>
            <span className="text-xs text-white/80 font-pixel">☁️ CLOUDS</span>
            <span className="text-sm">🐦</span>
          </div>
          <div className="flex justify-around text-xs text-white/60">
            <span>☁️</span>
            <span>☁️</span>
            <span>☁️</span>
          </div>
        </div>

        {/* Floating Balloons */}
        {balloons.map((b) => (
          <button
            key={b.id}
            onClick={(e) => handlePop(b, e)}
            style={{ left: `${b.x}%`, top: `${b.y}px` }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2 hover:scale-125 active:scale-90 transition-transform cursor-pointer ${
              b.type === 'bomb' ? 'animate-pulse' : ''
            }`}
          >
            <div className="relative text-4xl filter drop-shadow-[2px_2px_0_#000]">
              {b.icon}
            </div>
          </button>
        ))}

        {/* Floating POP effects */}
        {popEffects.map((eff) => (
          <div
            key={eff.id}
            style={{ left: `${eff.x}%`, top: `${eff.y}px`, color: eff.color }}
            className="absolute font-pixel text-sm font-bold -translate-x-1/2 -translate-y-full animate-bounce drop-shadow-[2px_2px_0_#000]"
          >
            {eff.text}
          </div>
        ))}
      </div>
    </div>
  );
};
