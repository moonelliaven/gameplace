import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Trophy, ArrowLeft, ArrowRight, Zap, Heart, Play, RotateCcw } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Alien {
  id: string;
  x: number;
  y: number;
  type: number;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  isEnemy?: boolean;
}

const LANE_W = 320;

export const SpaceDefender: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [playerX, setPlayerX] = useState(140);
  const [aliens, setAliens] = useState<Alien[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);

  const bestScore = getHighScoreForGame('space-defender');
  const playerXRef = useRef(140);
  const aliensRef = useRef<Alien[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const directionRef = useRef<1 | -1>(1);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const waveRef = useRef(1);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lastEnemyShotRef = useRef(0);
  const lastShootRef = useRef(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const stopLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const initWave = useCallback((w: number) => {
    const list: Alien[] = [];
    const rows = w === 1 ? 3 : 4;
    const cols = w === 1 ? 6 : 7;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        list.push({
          id: `alien-${Date.now()}-${row}-${col}`,
          x: 30 + col * 45 + (LANE_W - 30 - (cols - 1) * 45) / 2,
          y: 40 + row * 36,
          type: row % 3,
        });
      }
    }
    aliensRef.current = list;
    setAliens(list);
  }, []);

  const startGame = () => {
    sound.playClick();
    scoreRef.current = 0;
    livesRef.current = 3;
    waveRef.current = 1;
    playerXRef.current = 140;
    directionRef.current = 1;
    bulletsRef.current = [];
    setScore(0);
    setLives(3);
    setWave(1);
    setPlayerX(140);
    setBullets([]);
    initWave(1);
    setGameState('PLAYING');
  };

  const finish = useCallback(() => {
    sound.playGameOver();
    setGameState('FINISHED');
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  const handleShoot = () => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;
    sound.playPop();
    bulletsRef.current.push({
      id: `b-${Date.now()}-${Math.random()}`,
      x: playerXRef.current + 13,
      y: 300,
    });
    setBullets([...bulletsRef.current]);
  };

  // Main loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const loop = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
        // Player bullets
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          if (b.isEnemy) {
            b.y += 95 * dt;
            // Hit player?
            if (b.y > 290 && Math.abs(b.x - (playerXRef.current + 13)) < 14) {
              bulletsRef.current.splice(i, 1);
              livesRef.current -= 1;
              setLives(livesRef.current);
              sound.playBomb();
              if (livesRef.current <= 0) {
                finish();
                return;
              }
              continue;
            }
          } else {
            b.y -= 220 * dt;
            // Hit alien?
            let hitIdx = -1;
            for (let a = 0; a < aliensRef.current.length; a++) {
              const alien = aliensRef.current[a];
              if (Math.abs(b.x - (alien.x + 13)) < 15 && Math.abs(b.y - (alien.y + 13)) < 15) {
                hitIdx = a;
                break;
              }
            }
            if (hitIdx >= 0) {
              aliensRef.current.splice(hitIdx, 1);
              setAliens([...aliensRef.current]);
              scoreRef.current += 50;
              setScore(scoreRef.current);
              sound.playScore();
              bulletsRef.current.splice(i, 1);
              continue;
            }
          }
          if (b.y < -20 || b.y > 340) bulletsRef.current.splice(i, 1);
        }
        setBullets([...bulletsRef.current]);

        // Move aliens horizontally; drop & reverse at edges
        if (aliensRef.current.length > 0) {
          let edge = false;
          for (const a of aliensRef.current) {
            a.x += directionRef.current * 26 * dt;
            if (a.x < 4 || a.x > LANE_W - 28) edge = true;
          }
          if (edge) {
            directionRef.current = (directionRef.current * -1) as 1 | -1;
            for (const a of aliensRef.current) {
              a.x += directionRef.current * 6;
              a.y += 14;
            }
            // Aliens reached bottom -> lose a life, aliens move back up
            let lowest = 0;
            for (const a of aliensRef.current) lowest = Math.max(lowest, a.y);
            if (lowest > 250) {
              livesRef.current -= 1;
              setLives(livesRef.current);
              sound.playBomb();
              if (livesRef.current <= 0) {
                finish();
                return;
              }
              for (const a of aliensRef.current) a.y -= 130;
            }
          }
          setAliens([...aliensRef.current]);

          // Enemy fire: rare, at most every 1.4s
          if (now - lastEnemyShotRef.current > 1400 && Math.random() < 0.3) {
            lastEnemyShotRef.current = now;
            const shooter = aliensRef.current[Math.floor(Math.random() * aliensRef.current.length)];
            if (shooter) {
              bulletsRef.current.push({
                id: `eb-${Date.now()}-${Math.random()}`,
                x: shooter.x + 13,
                y: shooter.y + 18,
                isEnemy: true,
              });
              setBullets([...bulletsRef.current]);
            }
          }
        } else {
          // Wave cleared
          sound.playLevelUp();
          scoreRef.current += 200;
          setScore(scoreRef.current);
          waveRef.current += 1;
          setWave(waveRef.current);
          initWave(waveRef.current);
        }
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => stopLoop();
  }, [gameState, stopLoop, finish, initWave]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        playerXRef.current = Math.max(4, playerXRef.current - 26);
        setPlayerX(playerXRef.current);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        playerXRef.current = Math.min(LANE_W - 28, playerXRef.current + 26);
        setPlayerX(playerXRef.current);
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (performance.now() - lastShootRef.current > 250) {
          lastShootRef.current = performance.now();
          handleShoot();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleRestart = () => {
    sound.playClick();
    stopLoop();
    startGame();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-[#090914] text-white overflow-hidden">
      {/* Top HUD */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#121224] border-b-4 border-black text-xs font-bold z-20">
        <div className="text-cyan-400 font-pixel">
          SCORE: <span className="text-yellow-400 text-sm">{score}</span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}`} />
          ))}
        </div>
        <div className="text-indigo-400 font-pixel flex items-center gap-2">
          <span>WAVE: {wave}</span>
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>BEST: {bestScore}</span>
        </div>
      </div>

      {/* Starfield Battleground */}
      <div className="relative flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950 via-[#0d0d1a] to-black overflow-hidden p-2">
        {/* Aliens */}
        {aliens.map((alien) => (
          <div
            key={alien.id}
            style={{ left: `${alien.x}px`, top: `${alien.y}px` }}
            className="absolute text-xl"
          >
            {alien.type === 0 ? '👾' : alien.type === 1 ? '👽' : '🛸'}
          </div>
        ))}

        {/* Bullets */}
        {bullets.map((bullet) => (
          <div
            key={bullet.id}
            style={{ left: `${bullet.x}px`, top: `${bullet.y}px` }}
            className={`absolute w-2 h-4 rounded-full ${
              bullet.isEnemy ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-yellow-400 shadow-[0_0_8px_#facc15]'
            }`}
          />
        ))}

        {/* Player Spaceship */}
        <div
          style={{ left: `${playerX}px`, top: '300px' }}
          className="absolute w-8 h-8 bg-indigo-600 border-2 border-cyan-300 rounded shadow-[0_0_12px_#38bdf8] flex items-center justify-center text-lg z-20"
        >
          🚀
        </div>

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-indigo-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">SPACE DEFENDER</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Move with ◀ ▶ (or A/D) and shoot with SPACE. Clear each wave of aliens. You have 3 lives —
              don't let enemy lasers or aliens touch the ground!
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
            <h2 className="font-pixel text-2xl text-red-500 mb-2">SHIP DESTROYED!</h2>
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

      {/* Mobile Touch Controls */}
      <div className="p-3 bg-[#121224] border-t-4 border-black flex justify-between items-center gap-2">
        <div className="flex gap-2">
          <button
            onPointerDown={() => {
              playerXRef.current = Math.max(4, playerXRef.current - 26);
              setPlayerX(playerXRef.current);
            }}
            className="pixel-btn p-3 bg-indigo-600 text-white font-pixel text-xs active:translate-y-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onPointerDown={() => {
              playerXRef.current = Math.min(LANE_W - 28, playerXRef.current + 26);
              setPlayerX(playerXRef.current);
            }}
            className="pixel-btn p-3 bg-indigo-600 text-white font-pixel text-xs active:translate-y-1"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onPointerDown={handleShoot}
          className="pixel-btn flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-xs flex items-center justify-center gap-1.5 active:translate-y-1"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>FIRE LASER</span>
        </button>
      </div>
    </div>
  );
};