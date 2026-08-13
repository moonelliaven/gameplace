import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Layers, Play, Trophy, RotateCcw } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface StackBlock {
  id: number;
  x: number; // 0..1 center of block
  width: number; // 0..1
  color: string;
}

interface Scrap {
  id: number;
  leftPct: number;
  widthPct: number;
  color: string;
  dropBottom: number;
}

const COLORS = ['#a78bfa', '#f472b6', '#22d3ee', '#4ade80', '#fbbf24', '#fb7185'];

export const PixelStack: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [blocks, setBlocks] = useState<StackBlock[]>([]);
  const [score, setScore] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [missed, setMissed] = useState(false);
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [playH, setPlayH] = useState(420);

  const playRef = useRef<HTMLDivElement>(null);

  const movingBlockRef = useRef<{ x: number; width: number; dir: number; speed: number }>({
    x: 0,
    width: 1,
    dir: 1,
    speed: 1.0,
  });
  const movingIdRef = useRef<number>(Date.now());
  const blocksRef = useRef<StackBlock[]>([]);
  const scoreRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const bestScore = getHighScoreForGame('pixel-stack');

  // Track the play area height so the stack can scroll up and always stay visible
  useEffect(() => {
    const el = playRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPlayH(el.clientHeight));
    ro.observe(el);
    setPlayH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const spawnMovingBlock = useCallback((width: number) => {
    // Slide in from the left edge, then travel back and forth across the whole area
    movingBlockRef.current = {
      x: width / 2 - 0.55,
      width,
      dir: 1,
      speed: Math.min(2.6, 1.2 + scoreRef.current * 0.03),
    };
    movingIdRef.current = Date.now();
  }, []);

  const startGame = () => {
    sound.playClick();
    const first: StackBlock = { id: Date.now(), x: 0.5, width: 1, color: COLORS[0] };
    blocksRef.current = [first];
    setBlocks([first]);
    setScore(0);
    scoreRef.current = 0;
    setPerfectCount(0);
    setMissed(false);
    spawnMovingBlock(1);
    setGameState('PLAYING');
  };

  const dropScrap = (leftPct: number, widthPct: number, color: string, dropBottom: number) => {
    if (widthPct <= 0.005) return;
    const id = Date.now() + Math.random();
    setScraps((s) => [...s, { id, leftPct, widthPct, color, dropBottom }]);
    setTimeout(() => setScraps((s) => s.filter((x) => x.id !== id)), 750);
  };

  // Animation loop for the sliding block
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const loop = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
        const mb = movingBlockRef.current;
        mb.x += mb.dir * mb.speed * dt;
        const minX = mb.width / 2 - 0.55;
        const maxX = 1.55 - mb.width / 2;
        if (mb.x <= minX) {
          mb.x = minX;
          mb.dir = 1;
        }
        if (mb.x >= maxX) {
          mb.x = maxX;
          mb.dir = -1;
        }
        setBlocks((prev) => {
          const copy = prev.slice(0, prev.length - 1);
          copy.push({
            id: movingIdRef.current,
            x: mb.x,
            width: mb.width,
            color: COLORS[blocksRef.current.length % COLORS.length],
          });
          return copy;
        });
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop]);

  // Drop the moving block
  const handleDrop = () => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;

    const mb = movingBlockRef.current;
    const top = blocksRef.current[blocksRef.current.length - 1];

    const overlapStart = Math.max(mb.x - mb.width / 2, top.x - top.width / 2);
    const overlapEnd = Math.min(mb.x + mb.width / 2, top.x + top.width / 2);
    const overlap = Math.max(0, overlapEnd - overlapStart);

    if (overlap <= 0.02) {
      // Missed completely - game over
      sound.playGameOver();
      setGameState('FINISHED');
      onGameOver(scoreRef.current);
      return;
    }

    const isPerfect = Math.abs(overlap - mb.width) < 0.01;
    const newWidth = isPerfect ? mb.width : overlap;
    const newX = (overlapStart + overlapEnd) / 2;

    if (isPerfect) {
      sound.playCombo();
      setPerfectCount((p) => p + 1);
    } else {
      sound.playScore();
      // Cut-off pieces fly off (fall down from the cut line)
      const mbLeft = mb.x - mb.width / 2;
      const mbRight = mb.x + mb.width / 2;
      const topLeft = top.x - top.width / 2;
      const topRight = top.x + top.width / 2;
      const scrapColor = COLORS[blocksRef.current.length % COLORS.length];
      const dropBottom = blocksRef.current.length * 40;
      if (mbLeft < topLeft) dropScrap(mbLeft, topLeft - mbLeft, scrapColor, dropBottom);
      if (mbRight > topRight) dropScrap(topRight, mbRight - topRight, scrapColor, dropBottom);
    }

    const newBlock: StackBlock = {
      id: Date.now() + Math.random(),
      x: newX,
      width: newWidth,
      color: COLORS[blocksRef.current.length % COLORS.length],
    };

    blocksRef.current = [...blocksRef.current, newBlock];
    setBlocks(blocksRef.current);

    const gained = 10 + (isPerfect ? 10 : 0);
    const newScore = scoreRef.current + gained;
    scoreRef.current = newScore;
    setScore(newScore);

    spawnMovingBlock(newWidth);

    if (newWidth < 0.12) {
      sound.playGameOver();
      setGameState('FINISHED');
      onGameOver(newScore);
    }
  };

  const handleRestart = () => {
    sound.playClick();
    stopLoop();
    startGame();
  };

  // Keyboard: space to drop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleDrop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stackOffset = Math.max(0, blocks.length * 40 - (playH - 24));

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-violet-300 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          PERFECT: <span className="text-white">{perfectCount}</span>
        </div>
        <div className="text-pink-400">
          BEST: <span className="text-white">{bestScore}</span>
        </div>
      </div>

      {/* Play area */}
      <div
        ref={playRef}
        onClick={handleDrop}
        className="relative flex-1 bg-gradient-to-b from-[#1e1b4b] to-[#0b0b1a] overflow-hidden border-b-4 border-black cursor-pointer touch-none flex flex-col items-center justify-end"
      >
        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-yellow-400 mb-2 filter drop-shadow-[4px_4px_0_#000]">PIXEL STACK</h1>
            <p className="font-mono text-xs text-violet-300 max-w-xs mb-6">
              Tap / press SPACE to drop the sliding block. Stack perfectly for PERFECT bonuses!
            </p>
            <button
              onClick={startGame}
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm px-8 py-3.5 border-4 border-black shadow-[4px_4px_0_#000] active:translate-y-1 cursor-pointer"
            >
              <Play className="w-5 h-5 inline fill-slate-950 mr-2" />START GAME
            </button>
          </div>
        )}

        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-white/40 font-pixel">
          TAP TO DROP!
        </div>

        {/* Stack — builds UPWARD from the bottom, camera follows the top */}
        <div
          className="relative w-[85%] max-w-sm mb-4"
          style={{ height: blocks.length * 40, transform: `translateY(${stackOffset}px)` }}
        >
          {blocks.map((b, idx) => (
            <div
              key={b.id}
              style={{
                left: `${(b.x - b.width / 2) * 100}%`,
                width: `${b.width * 100}%`,
                bottom: idx * 40,
                backgroundColor: b.color,
              }}
              className="absolute h-10 border-2 border-black/70 shadow-[2px_2px_0_#000]"
            />
          ))}

          {/* Falling scraps */}
          <style>{`
            @keyframes scrapFall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(-170px) rotate(-20deg); opacity: 0; }
            }
          `}</style>
          {scraps.map((s) => (
            <div
              key={s.id}
              style={{
                left: `${s.leftPct * 100}%`,
                width: `${s.widthPct * 100}%`,
                bottom: s.dropBottom,
                backgroundColor: s.color,
                animation: 'scrapFall 0.7s ease-in forwards',
              }}
              className="absolute h-10 border-2 border-black/70 pointer-events-none"
            />
          ))}
        </div>

        {gameState === 'FINISHED' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="font-pixel text-2xl text-yellow-400 mb-2">STACK CRASHED!</h2>
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
      <div className="p-3 bg-[#151525] flex justify-center">
        <button
          onClick={handleDrop}
          disabled={gameState !== 'PLAYING'}
          className="flex-1 max-w-sm bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm py-3.5 border-2 border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 cursor-pointer disabled:opacity-50"
        >
          STOP BLOCK (SPACE)
        </button>
      </div>
    </div>
  );
};