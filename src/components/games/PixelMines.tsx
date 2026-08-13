import React, { useState, useCallback, useEffect } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Bomb, Flag, Trophy, Play, RotateCcw } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

const GRID = 10;
const MINE_COUNT = 12;

type CellState = {
  mine: boolean;
  adjacent: number;
  revealed: boolean;
  flagged: boolean;
};

const createBoard = (): CellState[][] => {
  const board: CellState[][] = Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false }))
  );

  let placed = 0;
  while (placed < MINE_COUNT) {
    const x = Math.floor(Math.random() * GRID);
    const y = Math.floor(Math.random() * GRID);
    if (!board[y][x].mine) {
      board[y][x].mine = true;
      placed++;
    }
  }

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (board[y][x].mine) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < GRID && nx >= 0 && nx < GRID && board[ny][nx].mine) count++;
        }
      }
      board[y][x].adjacent = count;
    }
  }

  return board;
};

const floodReveal = (board: CellState[][], startX: number, startY: number): number => {
  const stack: Array<[number, number]> = [[startX, startY]];
  let revealed = 0;
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const cell = board[y][x];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    revealed++;
    if (cell.adjacent === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < GRID && nx >= 0 && nx < GRID && !board[ny][nx].mine) {
            stack.push([nx, ny]);
          }
        }
      }
    }
  }
  return revealed;
};

export const PixelMines: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED' | 'WON'>('READY');
  const [board, setBoard] = useState<CellState[][]>(createBoard);
  const [score, setScore] = useState(0);
  const [flagsUsed, setFlagsUsed] = useState(0);
  const [safeCells, setSafeCells] = useState(GRID * GRID - MINE_COUNT);
  const [revealedCount, setRevealedCount] = useState(0);
  const [explodedCell, setExplodedCell] = useState<{ x: number; y: number } | null>(null);

  const bestScore = getHighScoreForGame('pixel-mines');

  const startGame = () => {
    sound.playClick();
    const newBoard = createBoard();
    setBoard(newBoard);
    setScore(0);
    setFlagsUsed(0);
    setSafeCells(GRID * GRID - MINE_COUNT);
    setRevealedCount(0);
    setExplodedCell(null);
    setGameState('PLAYING');
  };

  const checkWin = useCallback(
    (boardState: CellState[][], revealed: number) => {
      if (revealed === GRID * GRID - MINE_COUNT) {
        sound.playWin();
        setGameState('WON');
        const bonus = flagsUsed === 0 ? 200 : 100;
        setScore((s) => s + bonus);
        onGameOver(revealed * 10 + (flagsUsed === 0 ? 200 : 100));
      }
    },
    [flagsUsed, onGameOver]
  );

  const revealCell = (x: number, y: number) => {
    if (gameState !== 'PLAYING' || isPaused) return;
    const cell = board[y][x];
    if (cell.revealed || cell.flagged) return;

    if (cell.mine) {
      sound.playBomb();
      const boardCopy = board.map((row) => row.map((c) => ({ ...c })));
      for (const r of boardCopy) for (const c of r) if (c.mine) c.revealed = true;
      setBoard(boardCopy);
      setExplodedCell({ x, y });
      setGameState('FINISHED');
      onGameOver(score);
      return;
    }

    sound.playClick();
    const boardCopy = board.map((row) => row.map((c) => ({ ...c })));
    const revealed = floodReveal(boardCopy, x, y);
    setBoard(boardCopy);
    const totalRevealed = boardCopy.flat().filter((c) => c.revealed).length;
    setRevealedCount(totalRevealed);
    setScore((s) => s + revealed * 10);
    checkWin(boardCopy, totalRevealed);
  };

  const toggleFlag = (x: number, y: number) => {
    if (gameState !== 'PLAYING' || isPaused) return;
    const cell = board[y][x];
    if (cell.revealed) return;

    sound.playClick();
    const boardCopy = board.map((row) => row.map((c) => ({ ...c })));
    boardCopy[y][x].flagged = !boardCopy[y][x].flagged;
    setBoard(boardCopy);
    setFlagsUsed((f) => f + (boardCopy[y][x].flagged ? 1 : -1));
  };

  const handleRestart = () => {
    sound.playClick();
    startGame();
  };

  const numberColors = ['', 'text-sky-400', 'text-emerald-400', 'text-red-400', 'text-purple-400', 'text-amber-400', 'text-cyan-400', 'text-pink-400', 'text-slate-300'];

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-zinc-300 flex items-center gap-2">
          <Bomb className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          CLEARED: <span className="text-white">{revealedCount}/{safeCells}</span>
        </div>
        <div className="flex items-center gap-1">
          <Flag className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-white">{flagsUsed}/{MINE_COUNT}</span>
        </div>
      </div>

      <div className="relative flex-1 bg-gradient-to-b from-[#1c1917] to-[#0b0b1a] flex flex-col items-center justify-center p-4 border-b-4 border-black">
        {gameState === 'PLAYING' && (
          <div className="grid grid-cols-10 gap-1 w-full max-w-md">
            {board.map((row, y) =>
              row.map((cell, x) => {
                const isExploded = explodedCell?.x === x && explodedCell?.y === y;
                return (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => revealCell(x, y)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleFlag(x, y);
                    }}
                    className={`aspect-square flex items-center justify-center text-[10px] sm:text-xs font-bold border border-black/60 transition-all cursor-pointer active:scale-90 ${
                      cell.revealed
                        ? isExploded
                          ? 'bg-red-600 text-white animate-ping'
                          : 'bg-slate-800 text-white'
                        : 'bg-zinc-600 hover:bg-zinc-500'
                    }`}
                  >
                    {cell.flagged && !cell.revealed ? (
                      <Flag className="w-3 h-3 sm:w-4 sm:h-4 text-rose-400" />
                    ) : cell.revealed && cell.mine ? (
                      <Bomb className="w-3 h-3 sm:w-4 sm:h-4 text-red-300" />
                    ) : cell.revealed && cell.adjacent > 0 ? (
                      <span className={numberColors[cell.adjacent]}>{cell.adjacent}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        )}

        <p className="text-[10px] text-white/40 font-pixel mt-3">
          LEFT CLICK: REVEAL · RIGHT CLICK: FLAG 🚩
        </p>

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-zinc-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL MINES</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Uncover safe cells without hitting the {MINE_COUNT} hidden mines. Right-click to flag!
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
            <Bomb className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="font-pixel text-2xl text-red-500 mb-2">BOOM! GAME OVER</h2>
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
            <h2 className="font-pixel text-2xl text-emerald-400 mb-2">FIELD CLEARED!</h2>
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