import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Target, Zap, RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface TargetPos {
  x: number;
  y: number;
  size: number;
  color: string;
  id: number;
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#8b5cf6'];

export const PixelAim: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'PLAYING' | 'PAUSED' | 'FINISHED'>('PLAYING');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [highestCombo, setHighestCombo] = useState(1);
  const [targetsHit, setTargetsHit] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [target, setTarget] = useState<TargetPos | null>(null);
  const [clickEffects, setClickEffects] = useState<Array<{ id: number; x: number; y: number; text: string; color: string }>>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const targetIdCounter = useRef(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  const bestScore = getHighScoreForGame('pixel-aim');

  // Handle Pause transition
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
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }
  }, []);

  // Spawn target with max 100ms transition delay
  const spawnTarget = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const size = Math.floor(Math.random() * 16) + 48; // 48px to 64px
    const padding = 28;
    const maxX = Math.max(10, rect.width - size - padding);
    const maxY = Math.max(10, rect.height - size - padding);

    const x = Math.max(padding, Math.floor(Math.random() * maxX));
    const y = Math.max(padding, Math.floor(Math.random() * maxY));
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    targetIdCounter.current += 1;
    setTarget({ x, y, size, color, id: targetIdCounter.current });
  }, []);

  // Initialize Game Time
  useEffect(() => {
    startTimeRef.current = 0;
    totalPausedDurationRef.current = 0;
    pausedTimeRef.current = 0;
    lastTimeRef.current = 0;
  }, []);

  // Main RAF loop for real-time timestamp timer
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
      lastTimeRef.current = now;

      // Real timestamp timer
      const effectiveNow = now - totalPausedDurationRef.current;
      const elapsed = Math.max(0, (effectiveNow - startTimeRef.current) / 1000);
      const remaining = Math.max(0, Math.ceil(GAME_DURATION - elapsed));
      setTimeLeft((prev) => (prev !== remaining ? remaining : prev));

      if (remaining <= 0) {
        sound.playWin();
        setGameState('FINISHED');
        stopAllGameLoops();
        onGameOver(scoreRef.current, comboRef.current);
        return;
      }

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      stopAllGameLoops();
    };
  }, [gameState, stopAllGameLoops, onGameOver]);

  // Initial target spawn
  useEffect(() => {
    if (gameState === 'PLAYING' && !target) {
      spawnTarget();
    }
  }, [gameState, target, spawnTarget]);

  // Target click
  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current || !target) return;

    sound.playScore();
    if (combo >= 2) sound.playCombo();

    const points = 10 * combo;
    const newScore = score + points;
    const newCombo = combo + 1;

    setScore(newScore);
    setCombo(newCombo);
    if (newCombo > highestCombo) setHighestCombo(newCombo);
    setTargetsHit((th) => th + 1);
    setTotalClicks((tc) => tc + 1);

    // Floating text effect
    const effectId = Date.now();
    setClickEffects((prev) => [
      ...prev,
      {
        id: effectId,
        x: target.x + target.size / 2,
        y: target.y,
        text: `+${points} ${combo > 1 ? `x${combo}` : ''}`,
        color: target.color,
      },
    ]);

    setTimeout(() => {
      setClickEffects((prev) => prev.filter((eff) => eff.id !== effectId));
    }, 500);

    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }

    // Instantly spawn new target without ghosting or delay
    spawnTarget();
  };

  // Miss click
  const handleMiss = () => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;
    setTotalClicks((tc) => tc + 1);
    if (combo > 1) {
      sound.playBomb();
      setCombo(1);
    }
  };

  const handleRestart = () => {
    stopAllGameLoops();
    setScore(0);
    setCombo(1);
    setHighestCombo(1);
    setTargetsHit(0);
    setTotalClicks(0);
    setTimeLeft(30);
    setTarget(null);
    setClickEffects([]);

    startTimeRef.current = 0;
    totalPausedDurationRef.current = 0;
    pausedTimeRef.current = 0;
    lastTimeRef.current = 0;

    setGameState('PLAYING');
  };

  const accuracy = totalClicks > 0 ? Math.round((targetsHit / totalClicks) * 100) : 100;

  return (
    <div className="flex flex-col h-full w-full select-none font-mono">
      {/* Top HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="flex items-center gap-2 text-yellow-400">
          <Target className="w-4 h-4" />
          <span>SCORE: <span className="text-white">{score}</span></span>
        </div>
        <div className="flex items-center gap-1 text-pink-400 font-pixel text-[11px] animate-pulse">
          <Zap className="w-4 h-4 fill-pink-400" />
          <span>COMBO x{combo}</span>
        </div>
        <div className="text-cyan-400">
          TIME: <span className={`text-white ${timeLeft <= 5 ? 'text-red-500 animate-ping' : ''}`}>{timeLeft}s</span>
        </div>
      </div>

      {/* Target Field */}
      <div
        ref={containerRef}
        onClick={handleMiss}
        className="relative flex-1 bg-[#090d16] retro-grid cursor-crosshair overflow-hidden p-4 border-b-4 border-black"
      >
        {target && (
          <button
            key={target.id}
            onClick={handleTargetClick}
            style={{
              left: `${target.x}px`,
              top: `${target.y}px`,
              width: `${target.size}px`,
              height: `${target.size}px`,
              backgroundColor: target.color,
            }}
            className="absolute border-4 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center hover:scale-105 active:scale-95 animate-pulse-glow cursor-pointer z-20"
          >
            <div className="w-1/2 h-1/2 border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white" />
            </div>
          </button>
        )}

        {/* Floating text effects */}
        {clickEffects.map((eff) => (
          <div
            key={eff.id}
            style={{ left: `${eff.x}px`, top: `${eff.y}px`, color: eff.color, textShadow: '2px 2px 0px #000' }}
            className="absolute font-pixel text-sm font-bold pointer-events-none transform -translate-x-1/2 -translate-y-full animate-bounce z-30"
          >
            {eff.text}
          </div>
        ))}
      </div>
    </div>
  );
};
