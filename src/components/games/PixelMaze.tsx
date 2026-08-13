import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Compass, Trophy, Play, RotateCcw, Timer, KeyRound } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

const COLS = 11;
const ROWS = 9;
const CELL = 40;

interface MazeData {
  rightWalls: boolean[][]; // [col][row]
  downWalls: boolean[][];
}

interface PlayerState {
  c: number;
  r: number;
  x: number;
  y: number;
  moving: boolean;
  targetC?: number;
  targetR?: number;
}

const generateMaze = (): MazeData => {
  const rightWalls: boolean[][] = Array.from({ length: COLS }, () => Array(ROWS).fill(true));
  const downWalls: boolean[][] = Array.from({ length: COLS }, () => Array(ROWS).fill(true));
  const visited: boolean[][] = Array.from({ length: COLS }, () => Array(ROWS).fill(false));

  const stack: Array<[number, number]> = [[0, 0]];
  visited[0][0] = true;

  while (stack.length > 0) {
    const [c, r] = stack[stack.length - 1];
    const neighbors: Array<[number, number, string]> = [];
    if (c > 0 && !visited[c - 1][r]) neighbors.push([c - 1, r, 'L']);
    if (c < COLS - 1 && !visited[c + 1][r]) neighbors.push([c + 1, r, 'R']);
    if (r > 0 && !visited[c][r - 1]) neighbors.push([c, r - 1, 'U']);
    if (r < ROWS - 1 && !visited[c][r + 1]) neighbors.push([c, r + 1, 'D']);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const [nc, nr, dir] = neighbors[Math.floor(Math.random() * neighbors.length)];
    if (dir === 'R') rightWalls[c][r] = false;
    if (dir === 'L') rightWalls[nc][nr] = false;
    if (dir === 'D') downWalls[c][r] = false;
    if (dir === 'U') downWalls[c][nr] = false;
    visited[nc][nr] = true;
    stack.push([nc, nr]);
  }

  return { rightWalls, downWalls };
};

const LEVEL_KEYS = 3;

export const PixelMaze: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED' | 'WON'>('READY');
  const [level, setLevel] = useState(1);
  const [keysFound, setKeysFound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const mazeRef = useRef<MazeData>(generateMaze());
  const playerRef = useRef<PlayerState>({ c: 0, r: 0, x: 0, y: 0, moving: false });
  const stepQueueRef = useRef<Array<{ dc: number; dr: number }>>([]);
  const keyCellsRef = useRef<Array<{ c: number; r: number }>>([]);
  const exitRef = useRef({ c: COLS - 1, r: ROWS - 1 });
  const keysFoundRef = useRef(0);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const bestScore = getHighScoreForGame('pixel-maze');

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const setupLevel = useCallback((lvl: number) => {
    const maze = generateMaze();
    mazeRef.current = maze;

    playerRef.current = { c: 0, r: 0, x: CELL / 2, y: CELL / 2, moving: false };
    stepQueueRef.current = [];

    // Place keys
    const keys: Array<{ c: number; r: number }> = [];
    let placed = 0;
    while (placed < LEVEL_KEYS) {
      const c = 1 + Math.floor(Math.random() * (COLS - 2));
      const r = 1 + Math.floor(Math.random() * (ROWS - 2));
      const isStart = c === 0 && r === 0;
      const isExit = c === COLS - 1 && r === ROWS - 1;
      if (!isStart && !isExit && !keys.some((k) => k.c === c && k.r === r)) {
        keys.push({ c, r });
        placed++;
      }
    }
    keyCellsRef.current = keys;

    // Exit: bottom-right corner, carve the two walls around it
    maze.rightWalls[COLS - 2][ROWS - 1] = false;
    maze.downWalls[COLS - 1][ROWS - 2] = false;
    exitRef.current = { c: COLS - 1, r: ROWS - 1 };

    keysFoundRef.current = 0;
    setKeysFound(0);
  }, []);

  const startGame = () => {
    sound.playClick();
    levelRef.current = 1;
    scoreRef.current = 0;
    setLevel(1);
    setScore(0);
    setTimeLeft(60);
    setupLevel(1);
    setGameState('PLAYING');
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          sound.playGameOver();
          setGameState('FINISHED');
          onGameOver(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, onGameOver]);

  // Keyboard: one block per key press (queue steps for fast multi-press)
  useEffect(() => {
    const queueStep = (dc: number, dr: number) => {
      if (gameStateRef.current !== 'PLAYING') return;
      if (stepQueueRef.current.length >= 6) return;
      stepQueueRef.current.push({ dc, dr });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') queueStep(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') queueStep(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') queueStep(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') queueStep(1, 0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const levelComplete = () => {
    const bonus = 200 + timeLeft * 5;
    scoreRef.current += bonus;
    setScore(scoreRef.current);
    sound.playLevelUp();

    if (levelRef.current >= 3) {
      sound.playWin();
      setGameState('WON');
      onGameOver(scoreRef.current);
      return;
    }

    levelRef.current += 1;
    setLevel(levelRef.current);
    setTimeLeft(60);
    setTimeout(() => setupLevel(levelRef.current), 700);
  };

  // Movement + render loop
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
        const player = playerRef.current;
        const maze = mazeRef.current;
        const speed = 220 * dt;

        // Start next queued step (one block per press)
        if (!player.moving && stepQueueRef.current.length > 0) {
          const step = stepQueueRef.current.shift()!;
          const c = player.c;
          const r = player.r;
          let targetC = c + step.dc;
          let targetR = r + step.dr;
          // Wall check
          if (step.dc === -1 && (c <= 0 || maze.rightWalls[c - 1][r])) targetC = c;
          if (step.dc === 1 && (c >= COLS - 1 || maze.rightWalls[c][r])) targetC = c;
          if (step.dr === -1 && (r <= 0 || maze.downWalls[c][r - 1])) targetR = r;
          if (step.dr === 1 && (r >= ROWS - 1 || maze.downWalls[c][r])) targetR = r;

          if (targetC !== c || targetR !== r) {
            player.moving = true;
            player.targetC = targetC;
            player.targetR = targetR;
          }
        }

        if (player.moving) {
          const targetX = (player.targetC + 0.5) * CELL;
          const targetY = (player.targetR + 0.5) * CELL;
          const dx = targetX - player.x;
          const dy = targetY - player.y;
          const dist = Math.hypot(dx, dy);

          if (dist < speed) {
            player.x = targetX;
            player.y = targetY;
            player.c = player.targetC;
            player.r = player.targetR;
            player.moving = false;

            // Key pickup
            const keyIdx = keyCellsRef.current.findIndex((k) => k.c === player.c && k.r === player.r);
            if (keyIdx >= 0) {
              keyCellsRef.current.splice(keyIdx, 1);
              keysFoundRef.current += 1;
              setKeysFound(keysFoundRef.current);
              scoreRef.current += 100;
              setScore(scoreRef.current);
              sound.playCombo();
            }

            // Exit reached
            const exit = exitRef.current;
            if (player.c === exit.c && player.r === exit.r && keysFoundRef.current >= LEVEL_KEYS) {
              levelComplete();
            }
          } else {
            player.x += (dx / dist) * speed;
            player.y += (dy / dist) * speed;
          }
        }
      }

      // ---- DRAW ----
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, w, h);

      // Floor checkerboard
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          if ((c + r) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          }
        }
      }

      // Exit portal
      const exit = exitRef.current;
      ctx.fillStyle = keysFoundRef.current >= LEVEL_KEYS ? '#22d3ee' : 'rgba(34,211,238,0.25)';
      ctx.fillRect(exit.c * CELL + 6, exit.r * CELL + 6, CELL - 12, CELL - 12);
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(keysFoundRef.current >= LEVEL_KEYS ? '🚪' : '🔒', exit.c * CELL + CELL / 2, exit.r * CELL + CELL / 2);

      // Keys
      for (const k of keyCellsRef.current) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(k.c * CELL + 8, k.r * CELL + 8, CELL - 16, CELL - 16);
        ctx.font = '16px monospace';
        ctx.fillText('🔑', k.c * CELL + CELL / 2, k.r * CELL + CELL / 2);
      }

      // Walls
      const maze = mazeRef.current;
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 3;
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          const x = c * CELL;
          const y = r * CELL;
          if (maze.rightWalls[c][r]) {
            ctx.beginPath();
            ctx.moveTo(x + CELL, y);
            ctx.lineTo(x + CELL, y + CELL);
            ctx.stroke();
          }
          if (maze.downWalls[c][r]) {
            ctx.beginPath();
            ctx.moveTo(x, y + CELL);
            ctx.lineTo(x + CELL, y + CELL);
            ctx.stroke();
          }
        }
      }
      // Outer border
      ctx.strokeRect(0, 0, w, h);

      // Player
      const player = playerRef.current;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(player.x - 9, player.y - 9, 18, 18);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x - 9, player.y - 9, 18, 18);
      ctx.fillStyle = '#000';
      ctx.fillRect(player.x - 4, player.y - 3, 2, 2);
      ctx.fillRect(player.x + 2, player.y - 3, 2, 2);

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
        <div className="text-indigo-300 flex items-center gap-2">
          <Compass className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="flex items-center gap-2 text-amber-400 font-pixel text-[11px]">
          <KeyRound className="w-4 h-4" />
          <span>KEYS: <span className="text-white">{keysFound}/{LEVEL_KEYS}</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          LVL: <span className="text-white">{level}/3</span>
        </div>
        <div className="flex items-center gap-1 text-orange-400">
          <Timer className="w-4 h-4" />
          <span className={`${timeLeft <= 10 ? 'text-red-500 animate-ping' : 'text-white'}`}>{timeLeft}s</span>
        </div>
      </div>

      <div className="relative flex-1 bg-slate-900 overflow-hidden border-b-4 border-black">
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="block w-full h-full" />

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-indigo-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL MAZE</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-3">
              Collect all {LEVEL_KEYS} golden keys, then reach the exit portal. Each press moves you exactly
              ONE block — tap fast to sprint!
            </p>
            <p className="font-mono text-[10px] text-slate-400 max-w-xs mb-6">
              Controls: A/D/◀ ▶/W/S/▲ ▼ — one block per press. 3 dungeons, 60s each.
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
            <Trophy className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="font-pixel text-2xl text-red-500 mb-2">TIME EXPIRED!</h2>
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

        {gameState === 'WON' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="font-pixel text-2xl text-emerald-400 mb-2">DUNGEONS CLEARED!</h2>
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

      {/* Touch controls — one step per tap */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-[#151525] text-xs font-pixel">
        <button
          onClick={() => {
            if (stepQueueRef.current.length < 6) stepQueueRef.current.push({ dc: -1, dr: 0 });
          }}
          disabled={gameState !== 'PLAYING'}
          className="bg-indigo-700 hover:bg-indigo-600 text-white py-3 border-2 border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer disabled:opacity-50"
        >
          ◀ LEFT (A)
        </button>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (stepQueueRef.current.length < 6) stepQueueRef.current.push({ dc: 0, dr: -1 });
            }}
            disabled={gameState !== 'PLAYING'}
            className="bg-indigo-700 hover:bg-indigo-600 text-white py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            ▲ UP (W)
          </button>
          <button
            onClick={() => {
              if (stepQueueRef.current.length < 6) stepQueueRef.current.push({ dc: 0, dr: 1 });
            }}
            disabled={gameState !== 'PLAYING'}
            className="bg-indigo-700 hover:bg-indigo-600 text-white py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            ▼ DOWN (S)
          </button>
        </div>
        <button
          onClick={() => {
            if (stepQueueRef.current.length < 6) stepQueueRef.current.push({ dc: 1, dr: 0 });
          }}
          disabled={gameState !== 'PLAYING'}
          className="bg-indigo-700 hover:bg-indigo-600 text-white py-3 border-2 border-black shadow-[2px_2px_0_0_#000] active:scale-95 cursor-pointer disabled:opacity-50"
        >
          RIGHT ▶ (D)
        </button>
      </div>
    </div>
  );
};