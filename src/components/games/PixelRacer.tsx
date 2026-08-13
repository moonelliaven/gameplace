import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Car, Trophy, Play, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Traffic {
  x: number; // lane 0..2
  y: number;
  speed: number;
  color: string;
}

const CAR_COLORS = ['#ef4444', '#f59e0b', '#22d3ee', '#a855f7', '#4ade80'];

export const PixelRacer: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [bestDistance, setBestDistance] = useState(0);

  const playerLaneRef = useRef(1);
  const trafficRef = useRef<Traffic[]>([]);
  const speedRef = useRef(220); // px/s
  const distanceRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const scoreRef = useRef(0);

  const bestScore = getHighScoreForGame('pixel-racer');

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  // Keyboard lane switching
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        playerLaneRef.current = Math.max(0, playerLaneRef.current - 1);
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        playerLaneRef.current = Math.min(2, playerLaneRef.current + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startGame = () => {
    sound.playClick();
    playerLaneRef.current = 1;
    trafficRef.current = [];
    speedRef.current = 220;
    distanceRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setDistance(0);
    setGameState('PLAYING');
  };

  const handleFinish = useCallback(() => {
    sound.playGameOver();
    setGameState('FINISHED');
    setBestDistance((d) => Math.max(d, Math.floor(distanceRef.current / 10)));
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  // Main loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const loop = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
        speedRef.current = Math.min(520, speedRef.current + 12 * dt);
        distanceRef.current += speedRef.current * dt;
        setScore(Math.floor(distanceRef.current / 10));

        // Spawn traffic: slower rate + never in the same lane as the previous car
        if (now - lastSpawnRef.current > Math.max(750, 1600 - speedRef.current * 0.7)) {
          lastSpawnRef.current = now;
          const lastLane = trafficRef.current[trafficRef.current.length - 1]?.x ?? -1;
          let lane = Math.floor(Math.random() * 3);
          if (lane === lastLane) lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
          const tooClose = trafficRef.current.some(
            (t) => t.x === lane && t.y < 160
          );
          if (!tooClose) {
            trafficRef.current.push({
              x: lane,
              y: -60,
              speed: 100 + Math.random() * 70,
              color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
            });
          }
        }

        // Move traffic
        const cvs = canvasRef.current;
        if (cvs) {
          const h = cvs.height;
          for (let i = trafficRef.current.length - 1; i >= 0; i--) {
            const t = trafficRef.current[i];
            t.y += t.speed * dt;
            if (t.y > h + 60) trafficRef.current.splice(i, 1);
          }

          // Collision with player
          const playerY = h - 90;
          for (const t of trafficRef.current) {
            if (t.x === playerLaneRef.current && Math.abs(t.y - playerY) < 48) {
              stopLoop();
              handleFinish();
              return;
            }
          }
        }
      }

      // ---- DRAW ----
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

      // Road
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, w, h);
      // Road edges
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, 0, 6, h);
      ctx.fillRect(w - 6, 0, 6, h);

      // Lane lines (animated)
      const offset = (now / 1000) * 160 % 40;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 3;
      ctx.setLineDash([18, 22]);
      ctx.lineDashOffset = -offset;
      for (let lane = 1; lane < 3; lane++) {
        const x = (w / 3) * lane;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      const laneW = w / 3;

      const drawCar = (x: number, y: number, color: string, isPlayer: boolean) => {
        const cw = laneW * 0.55;
        const ch = cw * 1.6;
        ctx.fillStyle = color;
        ctx.fillRect(x - cw / 2, y - ch / 2, cw, ch);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x - cw / 2 + 3, y - ch / 2 + 3, cw - 6, ch * 0.28);
        ctx.fillStyle = isPlayer ? '#0ea5e9' : '#0f172a';
        ctx.fillRect(x - cw / 2 + 4, y - ch * 0.12, cw - 8, ch * 0.24);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x - cw / 2 + 2, y - ch / 2 - 3, 6, 8);
        ctx.fillRect(x + cw / 2 - 8, y - ch / 2 - 3, 6, 8);
      };

      // Traffic
      for (const t of trafficRef.current) {
        drawCar((t.x + 0.5) * laneW, t.y, t.color, false);
      }

      // Player
      const playerY = h - 90;
      drawCar((playerLaneRef.current + 0.5) * laneW, playerY, '#facc15', true);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop, handleFinish]);

  const handleRestart = () => {
    sound.playClick();
    startGame();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-red-400 flex items-center gap-2">
          <Car className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          BEST: <span className="text-white">{bestScore}</span>
        </div>
        <div className="text-orange-300">
          DIST: <span className="text-white">{Math.floor(distance / 10)}m</span>
        </div>
      </div>

      <div className="relative flex-1 bg-slate-900 overflow-hidden border-b-4 border-black">
        <canvas ref={canvasRef} width={360} height={600} className="block w-full h-full" />

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-yellow-400 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL RACER</h1>
            <p className="font-mono text-xs text-red-300 max-w-xs mb-6">
              Steer across 3 lanes to dodge oncoming traffic. Speed increases over time!
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
            <h2 className="font-pixel text-2xl text-red-400 mb-2">CRASHED!</h2>
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

      {/* Controls */}
      <div className="flex justify-between items-center p-3 bg-[#151525] gap-4">
        <button
          onClick={() => (playerLaneRef.current = Math.max(0, playerLaneRef.current - 1))}
          className="flex-1 bg-red-500 hover:bg-red-400 text-black font-mono font-bold py-3 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>LEFT (A / ◀)</span>
        </button>
        <button
          onClick={() => (playerLaneRef.current = Math.min(2, playerLaneRef.current + 1))}
          className="flex-1 bg-red-500 hover:bg-red-400 text-black font-mono font-bold py-3 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs"
        >
          <span>RIGHT (D / ▶)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};