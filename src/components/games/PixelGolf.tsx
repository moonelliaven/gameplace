import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Flag, Trophy, Play, RotateCcw } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface HoleDef {
  x: number;
  y: number;
}

export const PixelGolf: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [hole, setHole] = useState(1);
  const [strokes, setStrokes] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [score, setScore] = useState(0);
  const [aiming, setAiming] = useState(false);
  const [holeMsg, setHoleMsg] = useState<{ id: number; text: string } | null>(null);

  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const holeRef = useRef<HoleDef>({ x: 0, y: 0 });
  const strokesRef = useRef(0);
  const totalStrokesRef = useRef(0);
  const holeRefNum = useRef(1);
  const aimRef = useRef({ angle: -Math.PI / 2, power: 50 });
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const ballMovingRef = useRef(false);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const bestScore = getHighScoreForGame('pixel-golf');

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const setupHole = useCallback((holeNum: number, w: number, h: number) => {
    holeRef.current = {
      x: 60 + Math.random() * (w - 120),
      y: 60 + Math.random() * (h - 160),
    };
    ballRef.current = { x: w / 2, y: h - 60, vx: 0, vy: 0 };
    ballMovingRef.current = false;
    aimRef.current = { angle: -Math.PI / 2, power: 50 };
  }, []);

  const startGame = () => {
    sound.playClick();
    const canvas = canvasRef.current;
    holeRefNum.current = 1;
    strokesRef.current = 0;
    totalStrokesRef.current = 0;
    setHole(1);
    setStrokes(0);
    setTotalStrokes(0);
    if (canvas) setupHole(1, canvas.width, canvas.height);
    setGameState('PLAYING');
  };

  const hitBall = () => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current || ballMovingRef.current) return;
    const power = aimRef.current.power;
    const angle = aimRef.current.angle;
    ballRef.current.vx = Math.cos(angle) * (220 + power * 5);
    ballRef.current.vy = Math.sin(angle) * (220 + power * 5);
    ballMovingRef.current = true;
    strokesRef.current += 1;
    setStrokes(strokesRef.current);
    sound.playScore();
  };

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        aimRef.current.angle -= 0.05;
        setAiming(true);
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        aimRef.current.angle += 0.05;
        setAiming(true);
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        aimRef.current.power = Math.min(100, aimRef.current.power + 3);
        setAiming(true);
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        aimRef.current.power = Math.max(10, aimRef.current.power - 3);
        setAiming(true);
      }
      if (e.key === ' ') {
        e.preventDefault();
        hitBall();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Pointer aiming: drag from ball
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || ballMovingRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ball = ballRef.current;
    if (Math.hypot(x - ball.x, y - ball.y) < 30) {
      setAiming(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!aiming) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ball = ballRef.current;
    const dx = x - ball.x;
    const dy = y - ball.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 5) {
      aimRef.current.angle = Math.atan2(dy, dx);
      aimRef.current.power = Math.min(100, Math.max(10, dist / 4));
    }
  };

  const handlePointerUp = () => {
    if (aiming) {
      setAiming(false);
      hitBall();
    }
  };

  // Physics loop
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
        const ball = ballRef.current;
        if (ballMovingRef.current) {
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;
          ball.vx *= 0.988;
          ball.vy *= 0.988;

          // Walls
          if (ball.x - 9 < 10) {
            ball.x = 19;
            ball.vx *= -0.6;
          }
          if (ball.x + 9 > w - 10) {
            ball.x = w - 19;
            ball.vx *= -0.6;
          }
          if (ball.y - 9 < 10) {
            ball.y = 19;
            ball.vy *= -0.6;
          }
          if (ball.y + 9 > h - 10) {
            ball.y = h - 19;
            ball.vy *= -0.6;
          }

          // Hole check
          const hole = holeRef.current;
          const dist = Math.hypot(ball.x - hole.x, ball.y - hole.y);
          if (dist < 12) {
            sound.playLevelUp();
            ballMovingRef.current = false;
            totalStrokesRef.current += strokesRef.current;
            setTotalStrokes(totalStrokesRef.current);

            if (holeRefNum.current >= 9) {
              const finalScore = Math.max(0, 1000 - totalStrokesRef.current * 10);
              setScore(finalScore);
              sound.playWin();
              setGameState('FINISHED');
              onGameOver(finalScore);
              return;
            }

            const nextHole = holeRefNum.current + 1;
            const msgId = Date.now();
            setHoleMsg({ id: msgId, text: `🏌 HOLE IN! (${strokesRef.current} STROKE${strokesRef.current > 1 ? 'S' : ''})` });
            setTimeout(() => setHoleMsg((m) => (m?.id === msgId ? null : m)), 1400);

            holeRefNum.current = nextHole;
            setHole(nextHole);
            strokesRef.current = 0;
            setStrokes(0);
            setTimeout(() => setupHole(nextHole, w, h), 1300);
            return;
          }

          // Ball stopped
          const speed = Math.hypot(ball.vx, ball.vy);
          if (speed < 10) {
            ball.vx = 0;
            ball.vy = 0;
            ballMovingRef.current = false;
          }
        }
      }

      // ---- DRAW ----
      // Green
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#166534');
      grad.addColorStop(1, '#14532d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Mowed stripes
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < w; i += 40) {
        if (i % 80 === 0) ctx.fillRect(i, 0, 40, h);
      }

      // Border
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);

      // Hole
      const hole = holeRef.current;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Flag
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hole.x, hole.y);
      ctx.lineTo(hole.x, hole.y - 22);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(hole.x - 1, hole.y - 34, 16, 12);

      // Ball
      const ball = ballRef.current;
      ctx.shadowColor = '#f8fafc';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Aim arrow: solid line + arrowhead, shown whenever the ball is ready
      if (!ballMovingRef.current) {
        const a = aimRef.current;
        const len = 45 + a.power * 0.7;
        const tipX = ball.x + Math.cos(a.angle) * len;
        const tipY = ball.y + Math.sin(a.angle) * len;
        ctx.strokeStyle = aiming ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        // Arrowhead
        const arrowSize = 9;
        const backAngle = a.angle + Math.PI;
        ctx.fillStyle = aiming ? '#fef08a' : 'rgba(254,240,138,0.5)';
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX + Math.cos(backAngle - 0.45) * arrowSize, tipY + Math.sin(backAngle - 0.45) * arrowSize);
        ctx.lineTo(tipX + Math.cos(backAngle + 0.45) * arrowSize, tipY + Math.sin(backAngle + 0.45) * arrowSize);
        ctx.closePath();
        ctx.fill();
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop, aiming, setupHole]);

  const handleRestart = () => {
    sound.playClick();
    startGame();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-lime-300 flex items-center gap-2">
          <Flag className="w-4 h-4" />
          <span>HOLE: <span className="text-white">{hole}/9</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          STROKES: <span className="text-white">{strokes}</span> · TOTAL: <span className="text-white">{totalStrokes}</span>
        </div>
        <div className="text-yellow-400">
          SCORE: <span className="text-white">{score}</span>
        </div>
      </div>

      <div className="relative flex-1 bg-slate-900 overflow-hidden border-b-4 border-black">
        {holeMsg && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2 border-2 border-black font-pixel text-sm font-bold shadow-[3px_3px_0_0_#000] animate-bounce bg-emerald-500 text-black whitespace-nowrap">
            {holeMsg.text}
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={480}
          height={420}
          className="block w-full h-full touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-lime-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL GOLF</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Drag from the ball to aim & set power, then release to swing. Sink the ball in minimal shots!
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
            <h2 className="font-pixel text-2xl text-lime-300 mb-2">ROUND COMPLETE!</h2>
            <p className="font-mono text-sm text-slate-300 mb-6">
              TOTAL STROKES: <span className="text-white font-bold">{totalStrokes}</span> · SCORE:{' '}
              <span className="text-yellow-400 font-bold">{score}</span>
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