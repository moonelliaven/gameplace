import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { ShieldAlert, Trophy, Play, RotateCcw, Heart } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
}

export const PixelDodge: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeSurvived, setTimeSurvived] = useState(0);

  const shipRef = useRef({ x: 0, y: 0 });
  const meteorsRef = useRef<Meteor[]>([]);
  const keysRef = useRef({ up: false, down: false, left: false, right: false });
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const startTimeRef = useRef(0);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const bestScore = getHighScoreForGame('pixel-dodge');

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const startGame = () => {
    sound.playClick();
    const canvas = canvasRef.current;
    if (canvas) {
      shipRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
    }
    meteorsRef.current = [];
    livesRef.current = 3;
    scoreRef.current = 0;
    setLives(3);
    setScore(0);
    setTimeSurvived(0);
    startTimeRef.current = 0;
    setGameState('PLAYING');
  };

  const spawnMeteor = useCallback((w: number, h: number) => {
    const edge = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = Math.random() * w;
      y = -20;
    } else if (edge === 1) {
      x = Math.random() * w;
      y = h + 20;
    } else if (edge === 2) {
      x = -20;
      y = Math.random() * h;
    } else {
      x = w + 20;
      y = Math.random() * h;
    }

    const centerX = w / 2;
    const centerY = h / 2;
    const dx = centerX - x;
    const dy = centerY - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 80 + Math.random() * 120;
    const colors = ['#f87171', '#fb923c', '#a78bfa', '#f472b6'];

    meteorsRef.current.push({
      x,
      y,
      vx: (dx / dist) * speed + (Math.random() - 0.5) * 40,
      vy: (dy / dist) * speed + (Math.random() - 0.5) * 40,
      r: 8 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const handleFinish = useCallback(() => {
    sound.playGameOver();
    setGameState('FINISHED');
    onGameOver(scoreRef.current);
  }, [onGameOver]);

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
        if (startTimeRef.current === 0) startTimeRef.current = now;

        // Ship movement
        const ship = shipRef.current;
        const shipSpeed = 320;
        if (keysRef.current.up) ship.y -= shipSpeed * dt;
        if (keysRef.current.down) ship.y += shipSpeed * dt;
        if (keysRef.current.left) ship.x -= shipSpeed * dt;
        if (keysRef.current.right) ship.x += shipSpeed * dt;
        ship.x = Math.max(12, Math.min(w - 12, ship.x));
        ship.y = Math.max(12, Math.min(h - 12, ship.y));

        // Score = survival time
        const survived = Math.floor((now - startTimeRef.current) / 1000);
        scoreRef.current = survived * 10;
        setScore(scoreRef.current);
        setTimeSurvived(survived);

        // Spawn meteors (density increases over time)
        const elapsed = (now - startTimeRef.current) / 1000;
        const spawnRate = Math.max(350, 800 - elapsed * 12);
        if (now - lastSpawnRef.current > spawnRate) {
          lastSpawnRef.current = now;
          spawnMeteor(w, h);
        }

        // Move meteors & collision
        for (let i = meteorsRef.current.length - 1; i >= 0; i--) {
          const m = meteorsRef.current[i];
          m.x += m.vx * dt;
          m.y += m.vy * dt;

          const dx = ship.x - m.x;
          const dy = ship.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < m.r + 9) {
            sound.playBomb();
            meteorsRef.current.splice(i, 1);
            livesRef.current -= 1;
            setLives(livesRef.current);
            if (livesRef.current <= 0) {
              stopLoop();
              handleFinish();
              return;
            }
            continue;
          }

          if (m.x < -40 || m.x > w + 40 || m.y < -40 || m.y > h + 40) {
            meteorsRef.current.splice(i, 1);
          }
        }
      }

      // ---- DRAW ----
      ctx.fillStyle = '#0b0b1a';
      ctx.fillRect(0, 0, w, h);
      // Starfield
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137.5) % w;
        const sy = (i * 61.7) % h;
        const twinkle = 0.2 + 0.3 * Math.abs(Math.sin(now / 500 + i));
        ctx.globalAlpha = twinkle;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1;

      // Meteors
      for (const m of meteorsRef.current) {
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Ship
      const ship = shipRef.current;
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 10);
      ctx.lineTo(0, 5);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop, spawnMeteor, handleFinish]);

  const handleRestart = () => {
    sound.playClick();
    startGame();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-purple-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          SURVIVED: <span className="text-white">{timeSurvived}s</span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}`} />
          ))}
        </div>
      </div>

      <div className="relative flex-1 bg-slate-900 overflow-hidden border-b-4 border-black">
        <canvas ref={canvasRef} width={480} height={420} className="block w-full h-full" />

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-purple-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL DODGE</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Pilot your ship in open space and dodge incoming meteor swarms. You have 3 lives!
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
            <h2 className="font-pixel text-2xl text-purple-300 mb-2">SHIP DESTROYED!</h2>
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

      {/* Touch controls */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-[#151525] text-xs font-pixel">
        <button
          onPointerDown={() => (keysRef.current.left = true)}
          onPointerUp={() => (keysRef.current.left = false)}
          onPointerLeave={() => (keysRef.current.left = false)}
          className="bg-slate-800 hover:bg-slate-700 text-white py-3 border-2 border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer"
        >
          ◀ LEFT
        </button>
        <div className="flex flex-col gap-2">
          <button
            onPointerDown={() => (keysRef.current.up = true)}
            onPointerUp={() => (keysRef.current.up = false)}
            onPointerLeave={() => (keysRef.current.up = false)}
            className="bg-slate-800 hover:bg-slate-700 text-white py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer"
          >
            ▲ UP
          </button>
          <button
            onPointerDown={() => (keysRef.current.down = true)}
            onPointerUp={() => (keysRef.current.down = false)}
            onPointerLeave={() => (keysRef.current.down = false)}
            className="bg-slate-800 hover:bg-slate-700 text-white py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer"
          >
            ▼ DOWN
          </button>
        </div>
        <button
          onPointerDown={() => (keysRef.current.right = true)}
          onPointerUp={() => (keysRef.current.right = false)}
          onPointerLeave={() => (keysRef.current.right = false)}
          className="bg-slate-800 hover:bg-slate-700 text-white py-3 border-2 border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer"
        >
          RIGHT ▶
        </button>
      </div>
    </div>
  );
};