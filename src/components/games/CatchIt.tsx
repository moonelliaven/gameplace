import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { ShoppingBag, ArrowLeft, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface FallingItem {
  id: number;
  type: 'apple' | 'banana' | 'star' | 'bomb';
  icon: string;
  points: number;
  x: number; // percentage 10-90
  y: number; // pixels from top
  speed: number; // px per sec
}

const ITEM_TYPES: Array<{
  type: 'apple' | 'banana' | 'star' | 'bomb';
  icon: string;
  points: number;
  minSpeed: number;
  maxSpeed: number;
  weight: number;
}> = [
  { type: 'apple', icon: '🍎', points: 10, minSpeed: 180, maxSpeed: 210, weight: 45 },
  { type: 'banana', icon: '🍌', points: 15, minSpeed: 190, maxSpeed: 220, weight: 30 },
  { type: 'star', icon: '⭐', points: 30, minSpeed: 200, maxSpeed: 240, weight: 15 },
  { type: 'bomb', icon: '💣', points: -20, minSpeed: 210, maxSpeed: 250, weight: 10 },
];

export const CatchIt: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'PLAYING' | 'PAUSED' | 'FINISHED'>('PLAYING');
  const [basketX, setBasketX] = useState(50); // percentage 10 - 90
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [highestCombo, setHighestCombo] = useState(1);
  const [itemsCaught, setItemsCaught] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [effects, setEffects] = useState<Array<{ id: number; x: number; text: string; color: string }>>([]);

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
  const basketXRef = useRef(basketX);
  basketXRef.current = basketX;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const comboRef = useRef(combo);
  comboRef.current = combo;
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const GAME_DURATION = 30; // 30 seconds
  const bestScore = getHighScoreForGame('catch-it');

  // Handle Pause transition timestamp adjustment
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

  // Clean Stop Function
  const stopAllGameLoops = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  // Spawn item
  const spawnItem = useCallback(() => {
    const rand = Math.random() * 100;
    let cum = 0;
    let chosen = ITEM_TYPES[0];
    for (const t of ITEM_TYPES) {
      cum += t.weight;
      if (rand <= cum) {
        chosen = t;
        break;
      }
    }

    const calculatedSpeed = chosen.minSpeed + Math.random() * (chosen.maxSpeed - chosen.minSpeed);

    // Ensure newly spawned item has horizontal spacing from existing falling items
    setItems((prev) => {
      const MIN_GAP = 16; // percent gap minimum between falling items
      let xCandidate = Math.floor(Math.random() * 70) + 15;
      let attempts = 0;
      while (prev.some((it) => Math.abs(it.x - xCandidate) < MIN_GAP) && attempts < 10) {
        xCandidate = Math.floor(Math.random() * 70) + 15;
        attempts += 1;
      }

      const newItem: FallingItem = {
        id: Date.now() + Math.random(),
        type: chosen.type,
        icon: chosen.icon,
        points: chosen.points,
        x: xCandidate,
        y: -20,
        speed: calculatedSpeed,
      };

      return [...prev, newItem];
    });
  }, []);

  // Keyboard controls (no repeat delay: held keys move basket continuously in the loop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize Game Time
  useEffect(() => {
    startTimeRef.current = 0;
    totalPausedDurationRef.current = 0;
    pausedTimeRef.current = 0;
    lastTimeRef.current = 0;
    lastSpawnRef.current = 0;
  }, []);

  // Main RAF Real-time Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      stopAllGameLoops();
      return;
    }

    const updateGame = (now: number) => {
      if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;

      if (startTimeRef.current === 0) {
        startTimeRef.current = now;
      }
      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // Real timestamp timer calculation
      const effectiveNow = now - totalPausedDurationRef.current;
      const elapsed = Math.max(0, (effectiveNow - startTimeRef.current) / 1000);
      const remaining = Math.max(0, Math.ceil(GAME_DURATION - elapsed));
      setTimeLeft((prev) => (prev !== remaining ? remaining : prev));

      // Check Game Finish Condition
      if (remaining <= 0) {
        sound.playWin();
        setGameState('FINISHED');
        stopAllGameLoops();
        onGameOver(scoreRef.current, comboRef.current);
        return;
      }

      // Spawn every 500ms
      if (now - lastSpawnRef.current > 500) {
        spawnItem();
        lastSpawnRef.current = now;
      }

      // Continuous basket movement while holding keys (no key-repeat delay)
      const basketSpeed = 48; // % per second
      if (keysRef.current.left) {
        setBasketX((prev) => Math.max(12, prev - basketSpeed * dt));
      } else if (keysRef.current.right) {
        setBasketX((prev) => Math.min(88, prev + basketSpeed * dt));
      }

      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        const basketY = height - 50;
        const basketWidthPct = 25; // Large forgiving basket

        setItems((prevItems) => {
          const nextItems: FallingItem[] = [];

          for (const item of prevItems) {
            const nextY = item.y + item.speed * dt;

            // Catch check when item reaches basket height
            if (nextY >= basketY - 22 && nextY <= basketY + 22) {
              const bx = basketXRef.current;
              if (Math.abs(item.x - bx) < basketWidthPct / 2 + 3) {
                // Caught!
                if (item.points > 0) {
                  sound.playScore();
                  setCombo((c) => {
                    const nextC = c + 1;
                    setHighestCombo((hc) => Math.max(hc, nextC));
                    return nextC;
                  });
                  setItemsCaught((ic) => ic + 1);
                } else {
                  sound.playBomb();
                  setCombo(1);
                }

                const currentCombo = item.points > 0 ? comboRef.current : 1;
                const pointsGained = item.points * currentCombo;
                setScore((s) => Math.max(0, s + pointsGained));

                const effectId = Date.now() + Math.random();
                setEffects((effs) => [
                  ...effs,
                  {
                    id: effectId,
                    x: bx,
                    text: pointsGained > 0 ? `+${pointsGained}` : `${pointsGained}`,
                    color: pointsGained > 0 ? '#f59e0b' : '#ef4444',
                  },
                ]);

                setTimeout(() => {
                  setEffects((effs) => effs.filter((e) => e.id !== effectId));
                }, 600);

                continue; // Item caught and removed
              }
            }

            if (nextY < height + 30) {
              nextItems.push({ ...item, y: nextY });
            }
          }

          return nextItems;
        });
      }

      requestRef.current = requestAnimationFrame(updateGame);
    };

    requestRef.current = requestAnimationFrame(updateGame);

    return () => {
      stopAllGameLoops();
    };
  }, [gameState, spawnItem, stopAllGameLoops, onGameOver]);

  // Clean Reset & Restart
  const handleRestart = () => {
    stopAllGameLoops();
    setScore(0);
    setCombo(1);
    setHighestCombo(1);
    setItemsCaught(0);
    setTimeLeft(30);
    setItems([]);
    setEffects([]);
    setBasketX(50);

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
        <div className="text-amber-400 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          <span>SCORE: <span className="text-white">{score}</span></span>
        </div>
        <div className="text-pink-400 font-pixel text-[11px]">
          COMBO x{combo}
        </div>
        <div className="text-cyan-400">
          TIME: <span className={`text-white ${timeLeft <= 5 ? 'text-red-500 animate-ping' : ''}`}>{timeLeft}s</span>
        </div>
      </div>

      {/* Playfield Area with Pixel Sky / Hills */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] overflow-hidden border-b-4 border-black"
      >
        {/* Background Landscape */}
        <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between">
          <div className="flex justify-around pt-4 text-xs">
            <span>☁️</span>
            <span>☁️</span>
            <span>☁️</span>
          </div>
          <div className="bg-emerald-900/30 h-12 border-t-2 border-emerald-500/30 flex items-center justify-around text-xs">
            <span>🌲</span>
            <span>🌳</span>
            <span>🌲</span>
          </div>
        </div>

        {/* Falling Items */}
        {items.map((item) => (
          <div
            key={item.id}
            style={{ left: `${item.x}%`, top: `${item.y}px` }}
            className="absolute text-3xl sm:text-4xl transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            {item.icon}
          </div>
        ))}

        {/* Floating Catch Score Text */}
        {effects.map((eff) => (
          <div
            key={eff.id}
            style={{ left: `${eff.x}%`, bottom: '65px', color: eff.color }}
            className="absolute font-pixel text-sm font-bold -translate-x-1/2 animate-bounce drop-shadow-[2px_2px_0_#000]"
          >
            {eff.text}
          </div>
        ))}

        {/* Basket */}
        <div
          style={{ left: `${basketX}%` }}
          className="absolute bottom-3 h-12 w-28 bg-amber-700 border-4 border-black shadow-[4px_4px_0_0_#000] -translate-x-1/2 flex items-center justify-center text-2xl"
        >
          🧺
        </div>
      </div>

      {/* Mobile Touch / Keyboard Controls */}
      <div className="flex justify-between items-center p-3 bg-[#151525] gap-4">
        <button
          onPointerDown={() => {
            if (gameState === 'PLAYING') keysRef.current.left = true;
          }}
          onPointerUp={() => {
            keysRef.current.left = false;
          }}
          onPointerLeave={() => {
            keysRef.current.left = false;
          }}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold py-3 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>LEFT (A / ◀)</span>
        </button>
        <button
          onPointerDown={() => {
            if (gameState === 'PLAYING') keysRef.current.right = true;
          }}
          onPointerUp={() => {
            keysRef.current.right = false;
          }}
          onPointerLeave={() => {
            keysRef.current.right = false;
          }}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold py-3 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs"
        >
          <span>RIGHT (D / ▶)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
