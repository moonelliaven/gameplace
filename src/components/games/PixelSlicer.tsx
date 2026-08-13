import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Scissors, Trophy, Play, RotateCcw, Heart, Timer } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface FlyingFruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  type: 'fruit' | 'golden' | 'bomb';
  icon: string;
  points: number;
  sliced: boolean;
  rotation: number;
  rotSpeed: number;
}

const FRUIT_ICONS = ['🍎', '🍌', '🍉', '🍇', '🍓', '🍑', '🥝'];

const spawnFruit = (w: number): FlyingFruit => {
  const rand = Math.random();
  let type: 'fruit' | 'golden' | 'bomb' = 'fruit';
  let icon = FRUIT_ICONS[Math.floor(Math.random() * FRUIT_ICONS.length)];
  let points = 10;

  if (rand < 0.12) {
    type = 'golden';
    icon = '⭐';
    points = 30;
  } else if (rand < 0.22) {
    type = 'bomb';
    icon = '💣';
    points = -1;
  }

  const x = Math.random() * (w - 80) + 40;
  return {
    id: Date.now() + Math.random(),
    x,
    y: 0,
    vx: (Math.random() - 0.5) * 260,
    vy: -(520 + Math.random() * 260),
    r: 24,
    type,
    icon,
    points,
    sliced: false,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 8,
  };
};

const distToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

export const PixelSlicer: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [slicedCount, setSlicedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const fruitsRef = useRef<FlyingFruit[]>([]);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerTrailRef = useRef<Array<{ x: number; y: number; life: number }>>([]);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const slicedCountRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const bestScore = getHighScoreForGame('pixel-slicer');

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const startGame = () => {
    sound.playClick();
    fruitsRef.current = [];
    livesRef.current = 3;
    scoreRef.current = 0;
    slicedCountRef.current = 0;
    setLives(3);
    setScore(0);
    setSlicedCount(0);
    setTimeLeft(60);
    setGameState('PLAYING');
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          sound.playWin();
          setGameState('FINISHED');
          onGameOver(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, onGameOver]);

  // Pointer slice handling
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (lastPointerRef.current) {
      const ax = lastPointerRef.current.x;
      const ay = lastPointerRef.current.y;

      for (const fruit of fruitsRef.current) {
        if (fruit.sliced) continue;
        const d = distToSegment(fruit.x, fruit.y, ax, ay, x, y);
        if (d < fruit.r + 6) {
          fruit.sliced = true;
          if (fruit.type === 'bomb') {
            sound.playBomb();
            livesRef.current -= 1;
            setLives(livesRef.current);
            if (livesRef.current <= 0) {
              sound.playGameOver();
              setGameState('FINISHED');
              onGameOver(scoreRef.current);
              return;
            }
          } else {
            sound.playPop();
            scoreRef.current += fruit.points;
            setScore(scoreRef.current);
            slicedCountRef.current += 1;
            setSlicedCount(slicedCountRef.current);
            if (fruit.type === 'golden') sound.playCombo();
          }
        }
      }
    }

    pointerTrailRef.current.push({ x, y, life: 1 });
    lastPointerRef.current = { x, y };
  };

  const handlePointerLeave = () => {
    lastPointerRef.current = null;
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const loop = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        requestRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        requestRef.current = requestAnimationFrame(loop);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
        // Spawn fruits
        if (now - lastSpawnRef.current > 550) {
          lastSpawnRef.current = now;
          fruitsRef.current.push(spawnFruit(w));
          if (Math.random() < 0.3) fruitsRef.current.push(spawnFruit(w));
        }

        // Physics
        for (let i = fruitsRef.current.length - 1; i >= 0; i--) {
          const f = fruitsRef.current[i];
          f.vy += 900 * dt;
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.rotation += f.rotSpeed * dt;
          if (f.y > h + 50) fruitsRef.current.splice(i, 1);
        }

        // Trail decay
        for (const t of pointerTrailRef.current) t.life -= dt * 3;
        pointerTrailRef.current = pointerTrailRef.current.filter((t) => t.life > 0);
      }

      // ---- DRAW ----
      ctx.fillStyle = '#1a0f2e';
      ctx.fillRect(0, 0, w, h);
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#3b0764');
      grad.addColorStop(1, '#1a0f2e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Fruits
      for (const f of fruitsRef.current) {
        if (f.sliced) continue;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        ctx.font = `${f.r * 2}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.icon, 0, 0);
        ctx.restore();
      }

      // Slice trail
      for (const t of pointerTrailRef.current) {
        ctx.globalAlpha = Math.max(0, t.life) * 0.7;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4 * t.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop]);

  const handleRestart = () => {
    sound.playClick();
    startGame();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-orange-300 flex items-center gap-2">
          <Scissors className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="text-emerald-400 font-pixel text-[11px]">
          SLICED: <span className="text-white">{slicedCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <Timer className="w-4 h-4 text-cyan-400" />
          <span className={`${timeLeft <= 10 ? 'text-red-500 animate-ping' : 'text-white'}`}>{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}`} />
          ))}
        </div>
      </div>

      <div className="relative flex-1 bg-slate-900 overflow-hidden border-b-4 border-black">
        <canvas
          ref={canvasRef}
          width={480}
          height={420}
          className="block w-full h-full touch-none cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerMove}
        />

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-orange-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL SLICER</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Swipe across flying fruits to slice them. DON'T slice the bombs! 3 lives.
            </p>
            <button
              onClick={startGame}
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm px-8 py-3.5 border-4 border-black shadow-[4px_4px_0_#000] active:translate-y-1 cursor-pointer"
            >
              <Play className="w-5 h-5 inline fill-slate-950 mr-2" />START GAME
            </button>
          </div>
        )}

        {gameState === 'FINISHED' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="font-pixel text-2xl text-orange-300 mb-2">GAME OVER!</h2>
            <p className="font-mono text-sm text-slate-300 mb-6">
              FINAL SCORE: <span className="text-yellow-400 font-bold">{score}</span>
            </p>
            <button
              onClick={handleRestart}
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm px-8 py-3 border-4 border-black shadow-[4px_4px_0_#000] active:translate-y-1 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};