import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { CircleDot, Trophy, Play, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

const COLS = 8;
const ROWS = 14;
const BUBBLE_COLORS = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
const TOP_FILL = 5;

type Grid = (string | null)[][]; // [row][col]

const emptyGrid = (): Grid => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));

const createGrid = (): Grid => {
  const grid = emptyGrid();
  for (let r = 0; r < TOP_FILL; r++) {
    for (let c = 0; c < COLS; c++) {
      if (Math.random() < 0.82) {
        grid[r][c] = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
      }
    }
  }
  return grid;
};

const popMatches = (grid: Grid, row: number, col: number): number => {
  const color = grid[row][col];
  if (!color) return 0;

  const visited = new Set<string>();
  const stack: Array<[number, number]> = [[row, col]];
  const group: Array<[number, number]> = [];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (grid[r][c] !== color) continue;
    group.push([r, c]);
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) stack.push([nr, nc]);
    }
  }

  if (group.length >= 3) {
    for (const [r, c] of group) grid[r][c] = null;
    return group.length;
  }
  return 0;
};

// Drop bubbles not connected to the top row
const dropFloating = (grid: Grid): number => {
  const connected = new Set<string>();
  const stack: Array<[number, number]> = [];
  for (let c = 0; c < COLS; c++) {
    if (grid[0][c]) stack.push([0, c]);
  }
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (connected.has(key)) continue;
    if (!grid[r][c]) continue;
    connected.add(key);
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) stack.push([nr, nc]);
    }
  }

  let dropped = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] && !connected.has(`${r},${c}`)) {
        grid[r][c] = null;
        dropped++;
      }
    }
  }
  return dropped;
};

export const BubbleShooter: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED' | 'WON'>('READY');
  const [grid, setGrid] = useState<Grid>(createGrid);
  const [shooterCol, setShooterCol] = useState(3.5);
  const [currentBubble, setCurrentBubble] = useState(BUBBLE_COLORS[0]);
  const [score, setScore] = useState(0);
  const [poppedCount, setPoppedCount] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [travelY, setTravelY] = useState<number | null>(null);

  const gridRef = useRef<Grid>(createGrid());
  const scoreRef = useRef(0);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const bestScore = getHighScoreForGame('bubble-shooter');

  const startGame = () => {
    sound.playClick();
    gridRef.current = createGrid();
    setGrid(gridRef.current.map((row) => [...row]));
    setScore(0);
    scoreRef.current = 0;
    setPoppedCount(0);
    setShooterCol(3.5);
    setCurrentBubble(BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]);
    setShooting(false);
    setTravelY(null);
    setGameState('PLAYING');
  };

  const updateGrid = (newGrid: Grid) => {
    gridRef.current = newGrid;
    setGrid(newGrid.map((row) => [...row]));
  };

  const fireBubble = useCallback(
    (col: number) => {
      if (gameStateRef.current !== 'PLAYING' || isPausedRef.current || shooting) return;

      const gridCopy = gridRef.current.map((row) => [...row]);

      // Find target row
      let targetRow = ROWS - 1;
      for (let r = 0; r < ROWS; r++) {
        if (gridCopy[r][Math.round(col)]) {
          targetRow = r - 1;
          break;
        }
      }
      if (targetRow < 0) {
        sound.playBomb();
        setGameState('FINISHED');
        onGameOver(scoreRef.current);
        return;
      }

      sound.playPop();
      setShooting(true);

      // Animate travel
      const steps = 40;
      let step = 0;
      const interval = setInterval(() => {
        if (isPausedRef.current) return;
        step++;
        setTravelY((steps - step) / steps);
        if (step >= steps) {
          clearInterval(interval);
          setTravelY(null);
          gridCopy[targetRow][Math.round(col)] = currentBubble;
          updateGrid(gridCopy);

          const popped = popMatches(gridCopy, targetRow, Math.round(col));
          let gained = 0;
          if (popped >= 3) {
            sound.playLevelUp();
            gained = popped * 10;
            setPoppedCount((p) => p + popped);
          }

          const dropped = dropFloating(gridCopy);
          if (dropped > 0) {
            sound.playScore();
            gained += dropped * 5;
          }

          if (gained > 0) {
            scoreRef.current += gained;
            setScore(scoreRef.current);
          }

          // Win check
          const remaining = gridCopy.flat().filter((c) => c !== null).length;
          if (remaining === 0) {
            sound.playWin();
            scoreRef.current += 100;
            setScore(scoreRef.current);
            setGameState('WON');
            onGameOver(scoreRef.current);
            setShooting(false);
            return;
          }

          // New bubble
          setCurrentBubble(BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]);
          setShooting(false);
        }
      }, 35);
    },
    [currentBubble, onGameOver, shooting]
  );

  const handleRestart = () => {
    sound.playClick();
    startGame();
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setShooterCol((c) => Math.max(0, c - 1));
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setShooterCol((c) => Math.min(COLS - 1, c + 1));
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        fireBubble(shooterCol);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fireBubble, shooterCol]);

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-pink-300 flex items-center gap-2">
          <CircleDot className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          POPPED: <span className="text-white">{poppedCount}</span>
        </div>
        <div className="text-pink-400">
          NEXT: <span className="inline-block w-4 h-4 rounded-full border border-black align-middle" style={{ backgroundColor: currentBubble }} />
        </div>
      </div>

      <div className="relative flex-1 bg-gradient-to-b from-[#4a044e] to-[#0b0b1a] flex flex-col items-center pt-3 pb-3 px-3 border-b-4 border-black overflow-hidden">
        <div className="w-full max-w-sm flex-1 min-h-0 flex flex-col">
          {/* Bubble grid — fills available height */}
          <div className="relative grid grid-cols-8 gap-1 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(14, minmax(0, 1fr))' }}>
            {grid.map((row, r) =>
              row.map((color, c) => (
                <div key={`${r}-${c}`} className="flex items-center justify-center min-h-0">
                  {color && (
                    <div
                      className="w-[85%] h-[85%] rounded-full border-2 border-black/50"
                      style={{ backgroundColor: color, boxShadow: `inset -3px -3px 0 rgba(0,0,0,0.3), inset 3px 3px 0 rgba(255,255,255,0.3)` }}
                    />
                  )}
                </div>
              ))
            )}

            {/* Traveling bubble */}
            {travelY !== null && (
              <div
                className="absolute left-1/2"
                style={{
                  bottom: `${travelY * 100}%`,
                  transform: `translateX(calc(-50% + ${(shooterCol - 3.5) * 12.5}%))`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-black/60"
                  style={{ backgroundColor: currentBubble }}
                />
              </div>
            )}
          </div>

          {/* Shooter (drag left/right) */}
          <div
            className="relative mt-2 bg-slate-800 border-2 border-black rounded p-2 touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = e.currentTarget.getBoundingClientRect();
              const frac = (e.clientX - rect.left) / rect.width;
              setShooterCol(Math.max(0, Math.min(COLS - 1, Math.round(frac * (COLS - 1)))));
            }}
            onPointerMove={(e) => {
              if (e.buttons !== 1) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const frac = (e.clientX - rect.left) / rect.width;
              setShooterCol(Math.max(0, Math.min(COLS - 1, Math.round(frac * (COLS - 1)))));
            }}
          >
            <div
              className="mx-auto w-8 h-8 rounded-full border-2 border-white/40 transition-transform duration-100 cursor-pointer"
              style={{
                backgroundColor: currentBubble,
                transform: `translateX(${(shooterCol - 3.5) * 12.5}%)`,
              }}
              onClick={() => fireBubble(shooterCol)}
            />
            <div className="absolute -top-2 left-0 right-0 text-center text-[9px] font-pixel text-white/40 pointer-events-none">
              DRAG ◀ ▶ OR USE BUTTONS TO AIM
            </div>
          </div>
        </div>

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-pink-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">BUBBLE SHOOTER</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Match 3 or more bubbles of the same color to pop them! Clear the whole board to win.
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
            <h2 className="font-pixel text-2xl text-red-500 mb-2">BOARD FULL!</h2>
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
            <h2 className="font-pixel text-2xl text-emerald-400 mb-2">ALL CLEARED!</h2>
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
      <div className="flex justify-between items-center p-3 bg-[#151525] gap-2">
        <button
          onClick={() => setShooterCol((c) => Math.max(0, c - 1))}
          disabled={gameState !== 'PLAYING' || shooting}
          className="flex-1 bg-pink-500 hover:bg-pink-400 text-black font-mono font-bold py-3 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-1 cursor-pointer active:scale-95 text-xs disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> LEFT <span className="opacity-60">(A)</span>
        </button>
        <button
          onClick={() => fireBubble(shooterCol)}
          disabled={gameState !== 'PLAYING' || shooting}
          className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-bold py-3 border-2 border-black shadow-[3px_3px_0_0_#000] cursor-pointer active:scale-95 text-xs disabled:opacity-50"
        >
          SHOOT <span className="opacity-60">(SPACE)</span>
        </button>
        <button
          onClick={() => setShooterCol((c) => Math.min(COLS - 1, c + 1))}
          disabled={gameState !== 'PLAYING' || shooting}
          className="flex-1 bg-pink-500 hover:bg-pink-400 text-black font-mono font-bold py-3 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-1 cursor-pointer active:scale-95 text-xs disabled:opacity-50"
        >
          RIGHT <span className="opacity-60">(D)</span> <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};