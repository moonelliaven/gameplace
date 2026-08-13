import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { SquareDot, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

interface Food {
  x: number;
  y: number;
  type: 'apple' | 'golden' | 'star';
  points: number;
  expiresAt?: number;
}

interface PopEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const GRID_SIZE = 18;
const INITIAL_SPEED = 140; // ms per tick
const MIN_SPEED = 60; // ms per tick floor

export const PixelSnake: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'PLAYING' | 'FINISHED'>('PLAYING');
  const [snake, setSnake] = useState<Position[]>([
    { x: 5, y: 9 },
    { x: 4, y: 9 },
    { x: 3, y: 9 }
  ]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [food, setFood] = useState<Food>({ x: 12, y: 9, type: 'apple', points: 10 });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [highestCombo, setHighestCombo] = useState(1);
  const [applesEaten, setApplesEaten] = useState(0);
  const [popEffects, setPopEffects] = useState<PopEffect[]>([]);

  // Sound mute toggle helper
  const [isMuted, setIsMuted] = useState(() => sound.isMuted());

  // Refs for animation loop & state synchronization
  const requestRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  const lastComboTimeRef = useRef<number>(0);

  // Square board sizing (1:1 pixel ratio)
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(200, Math.floor(Math.min(rect.width, rect.height)));
      setBoardSize((prev) => (prev !== size ? size : prev));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const snakeRef = useRef<Position[]>(snake);
  snakeRef.current = snake;

  const currentDirRef = useRef<Direction>('RIGHT');
  const dirQueueRef = useRef<Direction[]>([]);

  const foodRef = useRef<Food>(food);
  foodRef.current = food;

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const comboRef = useRef(combo);
  comboRef.current = combo;

  const highestComboRef = useRef(highestCombo);
  highestComboRef.current = highestCombo;

  const applesEatenRef = useRef(applesEaten);
  applesEatenRef.current = applesEaten;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const bestScore = getHighScoreForGame('pixel-snake');

  // Helper: check if two directions are opposites
  const isOpposite = (d1: Direction, d2: Direction): boolean => {
    return (
      (d1 === 'UP' && d2 === 'DOWN') ||
      (d1 === 'DOWN' && d2 === 'UP') ||
      (d1 === 'LEFT' && d2 === 'RIGHT') ||
      (d1 === 'RIGHT' && d2 === 'LEFT')
    );
  };

  // Safe direction Queueing method
  const queueDirection = useCallback((newDir: Direction) => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;

    const queue = dirQueueRef.current;
    const lastDir = queue.length > 0 ? queue[queue.length - 1] : currentDirRef.current;

    if (newDir !== lastDir && !isOpposite(newDir, lastDir)) {
      if (queue.length < 2) {
        queue.push(newDir);
      }
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        queueDirection('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        queueDirection('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        queueDirection('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        queueDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queueDirection]);

  // Spawn food on empty cell
  const spawnFood = useCallback((currentSnake: Position[]): Food => {
    const occupied = new Set(currentSnake.map((p) => `${p.x},${p.y}`));
    const emptyCells: Position[] = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) {
      return { x: -1, y: -1, type: 'apple', points: 100 };
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const pos = emptyCells[randomIndex];

    const rand = Math.random();
    let type: 'apple' | 'golden' | 'star' = 'apple';
    let points = 10;
    let expiresAt: number | undefined = undefined;

    if (rand < 0.15) {
      type = 'golden';
      points = 30;
    } else if (rand < 0.25) {
      type = 'star';
      points = 50;
      expiresAt = Date.now() + 6000;
    }

    return { x: pos.x, y: pos.y, type, points, expiresAt };
  }, []);

  // Trigger floating FX
  const addPopEffect = useCallback((x: number, y: number, text: string, color: string) => {
    const id = Date.now() + Math.random();
    setPopEffects((prev) => [...prev.slice(-5), { id, x, y, text, color }]);
    setTimeout(() => {
      setPopEffects((prev) => prev.filter((p) => p.id !== id));
    }, 800);
  }, []);

  // Main game tick step
  const gameTick = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;

    if (dirQueueRef.current.length > 0) {
      const nextDir = dirQueueRef.current.shift()!;
      currentDirRef.current = nextDir;
      setDirection(nextDir);
    }

    const dir = currentDirRef.current;
    const currentSnake = [...snakeRef.current];
    const head = currentSnake[0];

    const newHead: Position = { x: head.x, y: head.y };
    if (dir === 'UP') newHead.y -= 1;
    if (dir === 'DOWN') newHead.y += 1;
    if (dir === 'LEFT') newHead.x -= 1;
    if (dir === 'RIGHT') newHead.x += 1;

    // 1. Check Wall Collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      sound.playGameOver();
      setGameState('FINISHED');
      onGameOver(scoreRef.current, highestComboRef.current);
      return;
    }

    // 2. Check Self Collision
    const currentFood = foodRef.current;
    const isEatingFood = newHead.x === currentFood.x && newHead.y === currentFood.y;

    const bodyToCheck = isEatingFood ? currentSnake : currentSnake.slice(0, currentSnake.length - 1);
    const selfCollided = bodyToCheck.some((segment) => segment.x === newHead.x && segment.y === newHead.y);

    if (selfCollided) {
      sound.playGameOver();
      setGameState('FINISHED');
      onGameOver(scoreRef.current, highestComboRef.current);
      return;
    }

    // Move snake
    const newSnake = [newHead, ...currentSnake];

    if (isEatingFood) {
      const now = Date.now();
      const timeSinceLastFood = now - lastComboTimeRef.current;
      lastComboTimeRef.current = now;

      let newCombo = comboRef.current;
      if (timeSinceLastFood < 3500) {
        newCombo = Math.min(newCombo + 1, 5);
      } else {
        newCombo = 1;
      }
      setCombo(newCombo);
      setHighestCombo((prev) => Math.max(prev, newCombo));

      const earnedScore = currentFood.points * newCombo;
      const updatedScore = scoreRef.current + earnedScore;
      setScore(updatedScore);

      const updatedApples = applesEatenRef.current + 1;
      setApplesEaten(updatedApples);

      if (currentFood.type === 'golden' || currentFood.type === 'star') {
        sound.playCombo();
        addPopEffect(newHead.x, newHead.y, `+${earnedScore} ⭐`, 'text-yellow-300');
      } else {
        sound.playScore();
        addPopEffect(
          newHead.x,
          newHead.y,
          newCombo > 1 ? `+${earnedScore} (${newCombo}x)` : `+${earnedScore}`,
          'text-lime-400'
        );
      }

      const nextFood = spawnFood(newSnake);
      setFood(nextFood);
    } else {
      newSnake.pop();

      if (currentFood.expiresAt && Date.now() > currentFood.expiresAt) {
        setFood(spawnFood(newSnake));
      }
    }

    setSnake(newSnake);
  }, [addPopEffect, onGameOver, spawnFood]);

  // Game Loop Animation Frame
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!lastTickTimeRef.current) lastTickTimeRef.current = timestamp;

      const currentSpeed = Math.max(MIN_SPEED, INITIAL_SPEED - applesEatenRef.current * 3);
      const elapsed = timestamp - lastTickTimeRef.current;

      if (elapsed >= currentSpeed) {
        lastTickTimeRef.current = timestamp;
        if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
          gameTick();
        }
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameTick]);

  // Restart Game
  const handleRestart = () => {
    sound.playClick();
    const initialSnake = [
      { x: 5, y: 9 },
      { x: 4, y: 9 },
      { x: 3, y: 9 }
    ];
    setSnake(initialSnake);
    setDirection('RIGHT');
    currentDirRef.current = 'RIGHT';
    dirQueueRef.current = [];
    setScore(0);
    setCombo(1);
    setHighestCombo(1);
    setApplesEaten(0);
    setGameState('PLAYING');
    lastComboTimeRef.current = Date.now();
    setFood(spawnFood(initialSnake));
  };

  // Touch controls on screen / swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) queueDirection('RIGHT');
      else queueDirection('LEFT');
    } else {
      if (dy > 0) queueDirection('DOWN');
      else queueDirection('UP');
    }
  };

  const toggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full bg-slate-950 p-2 sm:p-4 text-white select-none overflow-hidden rounded-xl border-2 border-lime-500/40 shadow-2xl shadow-lime-950/50">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full max-w-lg mb-2 px-2 bg-slate-900/90 rounded-lg p-2 border border-slate-800">
        <div className="flex items-center gap-2">
          <SquareDot className="w-6 h-6 text-lime-400 animate-pulse" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-lime-400 tracking-wider font-mono">PIXEL SNAKE</h2>
            <div className="text-[10px] text-slate-400 flex items-center gap-2">
              <span>Apples: {applesEaten}</span>
              {combo > 1 && <span className="text-amber-400 font-bold animate-bounce">Combo {combo}x!</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="text-right">
            <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
              <Trophy className="w-3 h-3 text-amber-400" /> BEST: {bestScore}
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-lime-400 tracking-wider">{score}</div>
          </div>

          <button
            onClick={toggleMute}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Mute"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Pixel Board Container (strictly square: 1:1 pixels) */}
      <div
        ref={boardWrapRef}
        className="relative flex-1 min-h-0 w-full max-w-md flex items-center justify-center overflow-hidden"
      >
        <div
          style={{ width: boardSize, height: boardSize }}
          className="relative bg-slate-900/90 border-2 border-slate-800 rounded-lg overflow-hidden shadow-inner"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
        {/* Retro Grid Lines Background */}
        <div
          className="grid w-full h-full relative"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const x = idx % GRID_SIZE;
            const y = Math.floor(idx / GRID_SIZE);
            const isDark = (x + y) % 2 === 0;

            return (
              <div
                key={idx}
                className={`${isDark ? 'bg-slate-950/40' : 'bg-slate-900/30'} border-[0.5px] border-slate-800/30`}
              />
            );
          })}

          {/* Food Item */}
          {food.x >= 0 && (
            <div
              className="absolute transition-all duration-75 flex items-center justify-center"
              style={{
                left: `${(food.x / GRID_SIZE) * 100}%`,
                top: `${(food.y / GRID_SIZE) * 100}%`,
                width: `${(1 / GRID_SIZE) * 100}%`,
                height: `${(1 / GRID_SIZE) * 100}%`
              }}
            >
              <div
                className={`w-[85%] h-[85%] rounded-md flex items-center justify-center text-xs sm:text-sm animate-pulse shadow-lg ${
                  food.type === 'golden'
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-yellow-200 shadow-yellow-500/50 scale-110'
                    : food.type === 'star'
                    ? 'bg-purple-500 text-white ring-2 ring-purple-300 shadow-purple-500/50 scale-110'
                    : 'bg-rose-500 text-white ring-2 ring-rose-300 shadow-rose-500/50'
                }`}
              >
                {food.type === 'golden' ? '🌟' : food.type === 'star' ? '⭐' : '🍎'}
              </div>
            </div>
          )}

          {/* Snake Segments */}
          {snake.map((segment, index) => {
            const isHead = index === 0;
            const isTail = index === snake.length - 1;

            return (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                className="absolute transition-all duration-100"
                style={{
                  left: `${(segment.x / GRID_SIZE) * 100}%`,
                  top: `${(segment.y / GRID_SIZE) * 100}%`,
                  width: `${(1 / GRID_SIZE) * 100}%`,
                  height: `${(1 / GRID_SIZE) * 100}%`
                }}
              >
                <div
                  className={`w-full h-full rounded-sm flex items-center justify-center transition-colors ${
                    isHead
                      ? 'bg-lime-400 ring-2 ring-lime-200 shadow-lg shadow-lime-500/50 z-20'
                      : isTail
                      ? 'bg-emerald-600/80 z-10'
                      : 'bg-emerald-500 z-10'
                  }`}
                >
                  {/* Eyes on Head */}
                  {isHead && (
                    <div className="flex gap-1 justify-center items-center w-full h-full">
                      <div className="w-1 h-1 bg-slate-950 rounded-full" />
                      <div className="w-1 h-1 bg-slate-950 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pop Effects Layer */}
          {popEffects.map((effect) => (
            <div
              key={effect.id}
              className={`absolute pointer-events-none font-bold font-mono text-xs sm:text-sm animate-bounce ${effect.color} drop-shadow-md z-30`}
              style={{
                left: `${(effect.x / GRID_SIZE) * 100}%`,
                top: `${(effect.y / GRID_SIZE) * 100}%`
              }}
            >
              {effect.text}
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* On-Screen Touch D-Pad for Mobile & Desktop Easy Controls */}
      <div className="flex flex-col items-center justify-center mt-2 w-full max-w-xs">
        <div className="grid grid-cols-3 gap-1.5 w-36 sm:w-44 h-28 sm:h-32">
          <div />
          <button
            onClick={() => queueDirection('UP')}
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-lime-500 active:text-slate-950 text-slate-200 rounded-lg border border-slate-700 transition-colors shadow-md"
            aria-label="Up"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <div />

          <button
            onClick={() => queueDirection('LEFT')}
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-lime-500 active:text-slate-950 text-slate-200 rounded-lg border border-slate-700 transition-colors shadow-md"
            aria-label="Left"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-800 text-[10px] font-mono font-bold"
            title="Reset Game"
          >
            RESET
          </button>
          <button
            onClick={() => queueDirection('RIGHT')}
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-lime-500 active:text-slate-950 text-slate-200 rounded-lg border border-slate-700 transition-colors shadow-md"
            aria-label="Right"
          >
            <ArrowRight className="w-6 h-6" />
          </button>

          <div />
          <button
            onClick={() => queueDirection('DOWN')}
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-lime-500 active:text-slate-950 text-slate-200 rounded-lg border border-slate-700 transition-colors shadow-md"
            aria-label="Down"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};

