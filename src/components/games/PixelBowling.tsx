import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Target, Trophy, Play, RotateCcw, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

const PIN_COLS: number[] = [4, 3, 2, 1]; // triangle from the back

interface Pin {
  x: number;
  y: number;
  alive: boolean;
}

export const PixelBowling: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [frame, setFrame] = useState(1);
  const [throwNum, setThrowNum] = useState(1);
  const [score, setScore] = useState(0);
  const [pinsDown, setPinsDown] = useState(0);
  const [power, setPower] = useState(50);
  const [aim, setAim] = useState(0);

  const pinsRef = useRef<Pin[]>([]);
  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, launched: false });
  const frameRef = useRef(1);
  const throwNumRef = useRef(1);
  const scoreRef = useRef(0);
  const pinsDownRef = useRef(0);
  const aimRef = useRef(0);
  const powerRef = useRef(50);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const bestScore = getHighScoreForGame('pixel-bowling');

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const setupPins = useCallback(() => {
    const pins: Pin[] = [];
    const laneW = 300;
    let index = 0;
    for (let row = 0; row < PIN_COLS.length; row++) {
      const count = PIN_COLS[row];
      for (let c = 0; c < count; c++) {
        const x = laneW / 2 + (c - (count - 1) / 2) * 22;
        const y = 90 + row * 22;
        pins.push({ x, y, alive: true });
        index++;
      }
    }
    pinsRef.current = pins;
  }, []);

  const startGame = () => {
    sound.playClick();
    frameRef.current = 1;
    throwNumRef.current = 1;
    scoreRef.current = 0;
    pinsDownRef.current = 0;
    setFrame(1);
    setThrowNum(1);
    setScore(0);
    setPinsDown(0);
    setupPins();
    resetBall();
    setGameState('PLAYING');
  };

  const resetBall = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ballRef.current = { x: canvas.width / 2, y: canvas.height - 40, vx: 0, vy: 0, launched: false };
  }, []);

  const launchBall = () => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current || ballRef.current.launched) return;

    const powerPct = powerRef.current / 100;
    const angle = (aimRef.current * Math.PI) / 180;
    const speed = 280 + powerPct * 480;

    ballRef.current.launched = true;
    ballRef.current.vx = Math.sin(angle) * speed;
    ballRef.current.vy = -Math.cos(angle) * speed;
    sound.playScore();
  };

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        aimRef.current = Math.max(-22, aimRef.current - 3);
        setAim(aimRef.current);
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        aimRef.current = Math.min(22, aimRef.current + 3);
        setAim(aimRef.current);
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        powerRef.current = Math.min(100, powerRef.current + 4);
        setPower(powerRef.current);
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        powerRef.current = Math.max(10, powerRef.current - 4);
        setPower(powerRef.current);
      }
      if (e.key === ' ') {
        e.preventDefault();
        launchBall();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Physics + render
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
        if (ball.launched) {
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;
          ball.vx *= 0.995;
          ball.vy *= 0.995;

          // Wall bounce
          if (ball.x - 10 < 8) {
            ball.x = 18;
            ball.vx *= -0.7;
          }
          if (ball.x + 10 > w - 8) {
            ball.x = w - 18;
            ball.vx *= -0.7;
          }

          // Pin collisions
          for (const pin of pinsRef.current) {
            if (!pin.alive) continue;
            const dx = ball.x - pin.x;
            const dy = ball.y - pin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 20) {
              pin.alive = false;
              pinsDownRef.current += 1;
              setPinsDown(pinsDownRef.current);
              sound.playPop();
              // Push ball slightly away
              ball.vx += (dx / dist) * 60;
              ball.vy += (dy / dist) * 60;
            }
          }

          // Throw ended: ball exits top or comes to rest at bottom
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          if (ball.y < 10 || (ball.y > h - 30 && speed < 30)) {
            endThrow();
            return;
          }
        }
      }

      // ---- DRAW ----
      // Lane
      ctx.fillStyle = '#713f12';
      ctx.fillRect(0, 0, w, h);
      // Lane boards
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      for (let i = 0; i < w; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      // Gutters
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, 8, h);
      ctx.fillRect(w - 8, 0, 8, h);
      // Foul line
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, h - 70);
      ctx.lineTo(w - 8, h - 70);
      ctx.stroke();

      // Pins
      for (const pin of pinsRef.current) {
        if (!pin.alive) continue;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Ball
      const ball = ballRef.current;
      if (ball.launched) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 3;
      ctx.stroke();

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop]);

  const endThrow = () => {
    const pinsThisThrow = pinsDownRef.current;
    const throwScore = pinsThisThrow * 10;
    scoreRef.current += throwScore;
    setScore(scoreRef.current);

    if (pinsThisThrow === 10) {
      scoreRef.current += 30;
      setScore(scoreRef.current);
      sound.playCombo();
    }

    const isLastThrowOfFrame = throwNumRef.current === 2 || pinsThisThrow === 10;
    setTimeout(() => {
      if (isLastThrowOfFrame) {
        if (frameRef.current >= 10) {
          sound.playWin();
          setGameState('FINISHED');
          onGameOver(scoreRef.current);
          return;
        }
        frameRef.current += 1;
        throwNumRef.current = 1;
        setFrame(frameRef.current);
        setThrowNum(1);
        setupPins();
        pinsDownRef.current = 0;
        setPinsDown(0);
      } else {
        throwNumRef.current = 2;
        setThrowNum(2);
      }
      resetBall();
    }, 600);
  };

  const handleRestart = () => {
    sound.playClick();
    startGame();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-amber-300 flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          FRAME: <span className="text-white">{frame}/10</span> · THROW: <span className="text-white">{throwNum}</span>
        </div>
        <div className="text-pink-400">
          PINS: <span className="text-white">{pinsDown}</span>/10
        </div>
      </div>

      <div className="relative flex-1 bg-slate-900 overflow-hidden border-b-4 border-black">
        <canvas ref={canvasRef} width={300} height={480} className="block w-full h-full" />

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-amber-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL BOWLING</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Aim with ◀ ▶, set power with ▲ ▼, press SPACE to throw. 10 frames, 2 throws each!
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
            <h2 className="font-pixel text-2xl text-amber-300 mb-2">ALL 10 FRAMES DONE!</h2>
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
      <div className="p-3 bg-[#151525] flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              aimRef.current = Math.max(-22, aimRef.current - 3);
              setAim(aimRef.current);
            }}
            disabled={gameState !== 'PLAYING'}
            className="bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer active:scale-95 text-xs disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 inline" /> AIM
          </button>
          <div className="flex-1 text-center font-pixel text-[10px] text-amber-300">
            ANGLE: {aim}° <span className="text-white/40 ml-2">[◀ ▶]</span>
          </div>
          <button
            onClick={() => {
              aimRef.current = Math.min(22, aimRef.current + 3);
              setAim(aimRef.current);
            }}
            disabled={gameState !== 'PLAYING'}
            className="bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer active:scale-95 text-xs disabled:opacity-50"
          >
            AIM <ArrowRight className="w-4 h-4 inline" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              powerRef.current = Math.max(10, powerRef.current - 4);
              setPower(powerRef.current);
            }}
            disabled={gameState !== 'PLAYING'}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer active:scale-95 text-xs disabled:opacity-50"
          >
            ▼ POWER
          </button>
          <div className="flex-1">
            <div className="h-4 bg-black border-2 border-white/30 relative">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-red-500 transition-all" style={{ width: `${power}%` }} />
            </div>
            <div className="text-center font-pixel text-[10px] text-cyan-300 mt-1">POWER: {power}%</div>
          </div>
          <button
            onClick={() => {
              powerRef.current = Math.min(100, powerRef.current + 4);
              setPower(powerRef.current);
            }}
            disabled={gameState !== 'PLAYING'}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer active:scale-95 text-xs disabled:opacity-50"
          >
            ▲ POWER
          </button>
        </div>

        <button
          onClick={launchBall}
          disabled={gameState !== 'PLAYING' || (ballRef.current.launched ?? false)}
          className="w-full font-pixel py-3 text-xs font-bold border-2 border-black flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer shadow-[3px_3px_0_0_#000] active:scale-95 disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>THROW BALL (SPACE)</span>
        </button>
      </div>
    </div>
  );
};