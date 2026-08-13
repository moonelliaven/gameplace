import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Disc, Trophy, Play, RotateCcw } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

const WIN_SCORE = 7;

export const PixelPong: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  const playerYRef = useRef(0);
  const aiYRef = useRef(0);
  const ballRef = useRef({ x: 0, y: 0, vx: 240, vy: 160 });
  const playerScoreRef = useRef(0);
  const aiScoreRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const keysRef = useRef({ up: false, down: false });
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const bestScore = getHighScoreForGame('pixel-pong');

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const resetBall = useCallback((w: number, h: number, dir: number) => {
    ballRef.current = {
      x: w / 2,
      y: h / 2,
      vx: 240 * dir,
      vy: (Math.random() * 2 - 1) * 160,
    };
  }, []);

  const startGame = () => {
    sound.playClick();
    playerScoreRef.current = 0;
    aiScoreRef.current = 0;
    setPlayerScore(0);
    setAiScore(0);
    const canvas = canvasRef.current;
    if (canvas) {
      playerYRef.current = canvas.height / 2 - 40;
      aiYRef.current = canvas.height / 2 - 40;
      resetBall(canvas.width, canvas.height, Math.random() > 0.5 ? 1 : -1);
    }
    setGameState('PLAYING');
  };

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Pointer control (touch/mouse)
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.height / rect.height;
    playerYRef.current = (e.clientY - rect.top) * scale - 40;
  };

  const handleFinish = useCallback(
    (winner: 'player' | 'ai') => {
      sound.playWin();
      setGameState('FINISHED');
      onGameOver(winner === 'player' ? WIN_SCORE * 10 + playerScoreRef.current * 5 : playerScoreRef.current);
    },
    [onGameOver]
  );

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
      const paddleW = 12;
      const paddleH = 80;
      const speed = 420;

      if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
        // Player paddle
        if (keysRef.current.up) playerYRef.current -= speed * dt;
        if (keysRef.current.down) playerYRef.current += speed * dt;
        playerYRef.current = Math.max(0, Math.min(h - paddleH, playerYRef.current));

        // AI paddle follows ball
        const aiTarget = ballRef.current.y - paddleH / 2;
        const aiSpeed = 300;
        if (aiYRef.current < aiTarget - 4) aiYRef.current = Math.min(aiYRef.current + aiSpeed * dt, h - paddleH);
        else if (aiYRef.current > aiTarget + 4) aiYRef.current = Math.max(aiYRef.current - aiSpeed * dt, 0);

        // Ball
        const ball = ballRef.current;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // Top/bottom walls
        if (ball.y - 6 <= 0) {
          ball.y = 6;
          ball.vy *= -1;
          sound.playClick();
        }
        if (ball.y + 6 >= h) {
          ball.y = h - 6;
          ball.vy *= -1;
          sound.playClick();
        }

        // Player paddle collision
        if (ball.vx < 0 && ball.x - 6 <= paddleW && ball.x + 6 >= 0) {
          if (ball.y >= playerYRef.current - 4 && ball.y <= playerYRef.current + paddleH + 4) {
            const hitPos = (ball.y - (playerYRef.current + paddleH / 2)) / (paddleH / 2);
            ball.vx = Math.abs(ball.vx) * 1.05;
            ball.vy = hitPos * 320;
            sound.playScore();
          }
        }

        // AI paddle collision
        if (ball.vx > 0 && ball.x + 6 >= w - paddleW && ball.x - 6 <= w) {
          if (ball.y >= aiYRef.current - 4 && ball.y <= aiYRef.current + paddleH + 4) {
            const hitPos = (ball.y - (aiYRef.current + paddleH / 2)) / (paddleH / 2);
            ball.vx = -Math.abs(ball.vx) * 1.05;
            ball.vy = hitPos * 320;
            sound.playClick();
          }
        }

        // Scoring
        if (ball.x < -20) {
          aiScoreRef.current += 1;
          setAiScore(aiScoreRef.current);
          sound.playBomb();
          if (aiScoreRef.current >= WIN_SCORE) {
            handleFinish('ai');
            return;
          }
          resetBall(w, h, 1);
        }
        if (ball.x > w + 20) {
          playerScoreRef.current += 1;
          setPlayerScore(playerScoreRef.current);
          sound.playLevelUp();
          if (playerScoreRef.current >= WIN_SCORE) {
            handleFinish('player');
            return;
          }
          resetBall(w, h, -1);
        }
      }

      // ---- DRAW ----
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);
      ctx.setLineDash([8, 10]);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Paddles
      const drawPaddle = (x: number, y: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, paddleW, paddleH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, paddleW, paddleH);
      };
      drawPaddle(0, playerYRef.current, '#22d3ee');
      drawPaddle(w - paddleW, aiYRef.current, '#f472b6');

      // Ball
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(ballRef.current.x, ballRef.current.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Scores
      ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText(String(playerScoreRef.current), w * 0.25, 60);
      ctx.fillText(String(aiScoreRef.current), w * 0.75, 60);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop, resetBall, handleFinish]);

  const handleRestart = () => {
    sound.playClick();
    startGame();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-teal-300 flex items-center gap-2">
          <Disc className="w-4 h-4" />
          <span>YOU: <span className="text-yellow-400 font-pixel">{playerScore}</span></span>
        </div>
        <div className="text-pink-400 font-pixel text-[11px]">
          FIRST TO {WIN_SCORE} WINS
        </div>
        <div className="text-cyan-400">
          AI: <span className="text-white">{aiScore}</span>
        </div>
      </div>

      <div className="relative flex-1 bg-slate-900 overflow-hidden border-b-4 border-black">
        <canvas
          ref={canvasRef}
          width={640}
          height={420}
          className="block w-full h-full touch-none cursor-grab active:cursor-grabbing"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
        />

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-teal-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL PONG</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Move your paddle with W/S, arrows, or drag. First to {WIN_SCORE} points wins!
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
            <h2 className="font-pixel text-2xl text-yellow-400 mb-2">
              {playerScore > aiScore ? 'YOU WIN!' : 'AI WINS!'}
            </h2>
            <p className="font-mono text-sm text-slate-300 mb-6">
              FINAL SCORE: <span className="text-teal-300 font-bold">{playerScore}</span> -{' '}
              <span className="text-pink-300 font-bold">{aiScore}</span>
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

      {/* Turn up / down buttons (hold) */}
      <div className="flex gap-3 p-3 bg-[#151525] justify-center">
        <button
          onPointerDown={() => (keysRef.current.up = true)}
          onPointerUp={() => (keysRef.current.up = false)}
          onPointerLeave={() => (keysRef.current.up = false)}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 max-w-[160px] bg-teal-500 hover:bg-teal-400 text-black font-pixel text-xs py-3 border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-y-1 cursor-pointer disabled:opacity-50 flex flex-col items-center"
        >
          <span className="text-base">▲</span>
          <span>TURN UP (W)</span>
        </button>
        <button
          onPointerDown={() => (keysRef.current.down = true)}
          onPointerUp={() => (keysRef.current.down = false)}
          onPointerLeave={() => (keysRef.current.down = false)}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 max-w-[160px] bg-teal-500 hover:bg-teal-400 text-black font-pixel text-xs py-3 border-2 border-black shadow-[3px_3px_0_0_#000] active:translate-y-1 cursor-pointer disabled:opacity-50 flex flex-col items-center"
        >
          <span className="text-base">▼</span>
          <span>TURN DOWN (S)</span>
        </button>
      </div>
    </div>
  );
};