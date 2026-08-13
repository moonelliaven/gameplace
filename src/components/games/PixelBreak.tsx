import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Zap, Heart, Trophy, RefreshCw, ArrowLeft, Play, Pause } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Brick {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'purple' | 'pink' | 'golden' | 'blue' | 'green';
  color: string;
  borderColor: string;
  points: number;
  isGolden?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

interface PopText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  vy: number;
  type: 'wide' | 'gold' | 'slow';
  icon: string;
}

export const PixelBreak: React.FC<GameContainerProps> = ({ onGameOver, onExit, isPaused }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED'>('READY');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [level, setLevel] = useState(1);
  const [launched, setLaunched] = useState(false);

  // Canvas size state
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  // Game physics state refs to avoid state re-render lags
  const ballRef = useRef({
    x: 300,
    y: 400,
    vx: 4,
    vy: -5,
    radius: 7,
    speedMultiplier: 1.0,
  });

  const paddleRef = useRef({
    x: 250,
    y: 420,
    width: 90,
    height: 14,
    targetX: 250,
    isWide: false,
    wideTimer: 0,
  });

  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const popTextsRef = useRef<PopText[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);

  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const comboRef = useRef(combo);
  comboRef.current = combo;
  const maxComboRef = useRef(maxCombo);
  maxComboRef.current = maxCombo;
  const livesRef = useRef(lives);
  livesRef.current = lives;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const levelRef = useRef(level);
  levelRef.current = level;

  const bestScore = getHighScoreForGame('pixel-break');

  // Initialize Bricks Grid for current level
  const generateBricks = useCallback((lvl: number, width: number, height: number) => {
    const cols = 7;
    const rows = Math.min(6, 3 + lvl);
    const padding = 8;
    const topOffset = 50;
    const sideMargin = 20;

    const brickWidth = Math.floor((width - sideMargin * 2 - (cols - 1) * padding) / cols);
    const brickHeight = 18;

    const brickTypes: Array<{
      type: 'purple' | 'pink' | 'golden' | 'blue' | 'green';
      color: string;
      borderColor: string;
      points: number;
      isGolden?: boolean;
    }> = [
      { type: 'purple', color: '#a855f7', borderColor: '#d8b4fe', points: 10 },
      { type: 'pink', color: '#ec4899', borderColor: '#fbcfe8', points: 15 },
      { type: 'golden', color: '#eab308', borderColor: '#fef08a', points: 50, isGolden: true },
      { type: 'blue', color: '#3b82f6', borderColor: '#bfdbfe', points: 20 },
      { type: 'green', color: '#10b981', borderColor: '#a7f3d0', points: 25 },
    ];

    const newBricks: Brick[] = [];
    let idCounter = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Create an arcade pattern layout matching thumbnail
        if (lvl === 1 && r === 1 && (c === 2 || c === 4)) {
          // Leave gaps for stylized pattern
          if (c === 2) continue;
        }

        // Pick type based on row or level
        let chosenType = brickTypes[(r + c) % brickTypes.length];
        if (r === 0 && c === 3) {
          chosenType = brickTypes[2]; // Golden brick center top
        }

        const x = sideMargin + c * (brickWidth + padding);
        const y = topOffset + r * (brickHeight + padding);

        newBricks.push({
          id: idCounter++,
          x,
          y,
          width: brickWidth,
          height: brickHeight,
          type: chosenType.type,
          color: chosenType.color,
          borderColor: chosenType.borderColor,
          points: chosenType.points,
          isGolden: chosenType.isGolden,
        });
      }
    }

    bricksRef.current = newBricks;
  }, []);

  // Reset ball & paddle positioning
  const resetBallAndPaddle = useCallback((canvasWidth: number, canvasHeight: number) => {
    const pWidth = paddleRef.current.isWide ? 120 : 90;
    paddleRef.current = {
      x: (canvasWidth - pWidth) / 2,
      y: canvasHeight - 30,
      width: pWidth,
      height: 14,
      targetX: (canvasWidth - pWidth) / 2,
      isWide: paddleRef.current.isWide,
      wideTimer: paddleRef.current.wideTimer,
    };

    const speed = 4.5 + levelRef.current * 0.4;
    ballRef.current = {
      x: canvasWidth / 2,
      y: paddleRef.current.y - 12,
      vx: (Math.random() > 0.5 ? 1 : -1) * (speed * 0.7),
      vy: -speed,
      radius: 7,
      speedMultiplier: 1.0,
    };

    setLaunched(false);
  }, []);

  // Set up container dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(300, Math.floor(rect.width));
      const h = Math.max(350, Math.floor(rect.height));

      setDimensions({ width: w, height: h });

      if (gameStateRef.current === 'READY' || bricksRef.current.length === 0) {
        generateBricks(levelRef.current, w, h);
        resetBallAndPaddle(w, h);
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [generateBricks, resetBallAndPaddle]);

  // Handle Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        if (!launched && gameStateRef.current === 'PLAYING') {
          setLaunched(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [launched]);

  // Pointer / Touch / Mouse controls for paddle
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPausedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pWidth = paddleRef.current.width;
    const clampX = Math.max(0, Math.min(dimensions.width - pWidth, pointerX - pWidth / 2));
    paddleRef.current.targetX = clampX;
  };

  const handlePointerDown = () => {
    if (!launched && gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
      setLaunched(true);
    }
  };

  // Launch ball manually
  const launchBall = () => {
    if (!launched && gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
      setLaunched(true);
    }
  };

  // Spawn brick destruction particles
  const spawnParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      newParticles.push({
        id: Math.random() + Date.now(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 3,
        color,
        alpha: 1.0,
        life: 1.0,
      });
    }
    particlesRef.current.push(...newParticles);
  };

  // Spawn pop score floating text
  const spawnPopText = (x: number, y: number, text: string, color: string) => {
    popTextsRef.current.push({
      id: Math.random() + Date.now(),
      x,
      y,
      text,
      color,
      alpha: 1.0,
    });
  };

  // Main Render & Physics Loop
  const updateAndRender = useCallback((now: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;

    // Time delta
    if (!lastTimeRef.current) lastTimeRef.current = now;
    const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
    lastTimeRef.current = now;

    if (gameStateRef.current === 'PLAYING' && !isPausedRef.current) {
      // 1. Move Paddle
      const paddleSpeed = 500 * dt;
      if (keysRef.current.left) {
        paddleRef.current.targetX = Math.max(0, paddleRef.current.x - paddleSpeed);
      }
      if (keysRef.current.right) {
        paddleRef.current.targetX = Math.min(width - paddleRef.current.width, paddleRef.current.x + paddleSpeed);
      }

      // Smooth interpolation to targetX
      paddleRef.current.x += (paddleRef.current.targetX - paddleRef.current.x) * 0.35;
      paddleRef.current.x = Math.max(0, Math.min(width - paddleRef.current.width, paddleRef.current.x));

      // Handle wide paddle timer
      if (paddleRef.current.isWide) {
        paddleRef.current.wideTimer -= dt;
        if (paddleRef.current.wideTimer <= 0) {
          paddleRef.current.isWide = false;
          paddleRef.current.width = 90;
        }
      }

      // 2. Ball Logic
      const ball = ballRef.current;
      const paddle = paddleRef.current;

      if (!launched) {
        // Ball rests on top of paddle
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 2;
      } else {
        // Move Ball
        ball.x += ball.vx * ball.speedMultiplier;
        ball.y += ball.vy * ball.speedMultiplier;

        // Bounce off left/right walls
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx *= -1;
          sound.playClick();
        } else if (ball.x + ball.radius >= width) {
          ball.x = width - ball.radius;
          ball.vx *= -1;
          sound.playClick();
        }

        // Bounce off top wall
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy *= -1;
          sound.playClick();
        }

        // Check Paddle Collision
        if (
          ball.vy > 0 &&
          ball.y + ball.radius >= paddle.y &&
          ball.y - ball.radius <= paddle.y + paddle.height &&
          ball.x + ball.radius >= paddle.x &&
          ball.x - ball.radius <= paddle.x + paddle.width
        ) {
          ball.y = paddle.y - ball.radius;

          // Calculate bounce angle based on where ball hits paddle
          const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2); // -1 to 1
          const maxAngle = (Math.PI / 180) * 60; // 60 deg
          const bounceAngle = hitPos * maxAngle;
          const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

          ball.vx = currentSpeed * Math.sin(bounceAngle);
          ball.vy = -currentSpeed * Math.cos(bounceAngle);

          // Reset combo when ball hits paddle
          setCombo(1);
          sound.playClick();
        }

        // Ball falls off bottom (lose life)
        if (ball.y - ball.radius > height) {
          sound.playBomb();
          const nextLives = livesRef.current - 1;
          setLives(nextLives);
          livesRef.current = nextLives;
          setCombo(1);

          if (nextLives <= 0) {
            setGameState('FINISHED');
            sound.playGameOver();
            onGameOver(scoreRef.current, maxComboRef.current);
          } else {
            resetBallAndPaddle(width, height);
          }
        }

        // 3. Brick Collisions
        for (let i = bricksRef.current.length - 1; i >= 0; i--) {
          const b = bricksRef.current[i];

          // Simple AABB vs Circle collision check
          const closestX = Math.max(b.x, Math.min(ball.x, b.x + b.width));
          const closestY = Math.max(b.y, Math.min(ball.y, b.y + b.height));
          const distanceX = ball.x - closestX;
          const distanceY = ball.y - closestY;
          const distanceSq = distanceX * distanceX + distanceY * distanceY;

          if (distanceSq < ball.radius * ball.radius) {
            // Determine hit side
            const prevX = ball.x - ball.vx;
            const prevY = ball.y - ball.vy;

            if (prevX + ball.radius <= b.x || prevX - ball.radius >= b.x + b.width) {
              ball.vx *= -1;
            } else {
              ball.vy *= -1;
            }

            // Points with Combo Multiplier
            const currentCombo = comboRef.current;
            const ptsGained = b.points * currentCombo;
            const newScore = scoreRef.current + ptsGained;
            setScore(newScore);
            scoreRef.current = newScore;

            // Update Combo
            const nextCombo = currentCombo + 1;
            setCombo(nextCombo);
            comboRef.current = nextCombo;

            if (nextCombo > maxComboRef.current) {
              setMaxCombo(nextCombo);
              maxComboRef.current = nextCombo;
            }

            // Sounds & Visual Pop Effects
            if (b.isGolden) {
              sound.playCombo();
              spawnPopText(b.x + b.width / 2, b.y, `+${ptsGained} GOLD!`, '#facc15');

              // Drop powerup from golden brick
              if (Math.random() < 0.6) {
                powerUpsRef.current.push({
                  id: Math.random() + Date.now(),
                  x: b.x + b.width / 2,
                  y: b.y + b.height,
                  vy: 2.5,
                  type: Math.random() > 0.5 ? 'wide' : 'gold',
                  icon: '✨',
                });
              }
            } else {
              sound.playPop();
              spawnPopText(b.x + b.width / 2, b.y, `+${ptsGained}`, b.color);
            }

            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, b.color);

            // Remove destroyed brick
            bricksRef.current.splice(i, 1);

            // Check Level Completion
            if (bricksRef.current.length === 0) {
              sound.playLevelUp();
              const nextLevel = levelRef.current + 1;
              setLevel(nextLevel);
              levelRef.current = nextLevel;

              // Generate new brick grid and reset ball position
              generateBricks(nextLevel, width, height);
              resetBallAndPaddle(width, height);
            }
            break;
          }
        }

        // 4. PowerUps physics & collection
        for (let pIdx = powerUpsRef.current.length - 1; pIdx >= 0; pIdx--) {
          const pw = powerUpsRef.current[pIdx];
          pw.y += pw.vy;

          // Catch powerup with paddle
          if (
            pw.y >= paddle.y &&
            pw.y <= paddle.y + paddle.height + 10 &&
            pw.x >= paddle.x &&
            pw.x <= paddle.x + paddle.width
          ) {
            sound.playScore();
            if (pw.type === 'wide') {
              paddleRef.current.isWide = true;
              paddleRef.current.width = 130;
              paddleRef.current.wideTimer = 8; // 8 seconds
              spawnPopText(pw.x, pw.y, 'WIDE PADDLE!', '#38bdf8');
            } else if (pw.type === 'gold') {
              const bonusScore = scoreRef.current + 200;
              setScore(bonusScore);
              scoreRef.current = bonusScore;
              spawnPopText(pw.x, pw.y, '+200 BONUS!', '#facc15');
            }
            powerUpsRef.current.splice(pIdx, 1);
          } else if (pw.y > height) {
            powerUpsRef.current.splice(pIdx, 1);
          }
        }
      }
    }

    // --- DRAWING CANVAS ---
    ctx.clearRect(0, 0, width, height);

    // Background Gradient Atmosphere (Match arcade thumbnail)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0f0728');
    bgGrad.addColorStop(0.5, '#180a3a');
    bgGrad.addColorStop(1, '#090417');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid Lines
    ctx.strokeStyle = '#2d1254';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Bricks
    bricksRef.current.forEach((b) => {
      // Brick Body
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Brick Pixel Border / Highlight
      ctx.strokeStyle = b.borderColor;
      ctx.lineWidth = b.isGolden ? 3 : 2;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // Inner Top/Left Highlight line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(b.x + 2, b.y + 2, b.width - 4, 3);

      // Golden Brick Glow Effect
      if (b.isGolden) {
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x + 1, b.y + 1, b.width - 2, b.height - 2);
        ctx.shadowBlur = 0;
      }
    });

    // Draw PowerUps
    powerUpsRef.current.forEach((pw) => {
      ctx.fillStyle = pw.type === 'wide' ? '#38bdf8' : '#facc15';
      ctx.beginPath();
      ctx.arc(pw.x, pw.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw Paddle
    const pad = paddleRef.current;
    const padGrad = ctx.createLinearGradient(pad.x, pad.y, pad.x, pad.y + pad.height);
    padGrad.addColorStop(0, '#d8b4fe');
    padGrad.addColorStop(0.4, '#c084fc');
    padGrad.addColorStop(1, '#9333ea');

    ctx.fillStyle = padGrad;
    ctx.fillRect(pad.x, pad.y, pad.width, pad.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad.x, pad.y, pad.width, pad.height);

    // Inner paddle detail
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pad.x + 6, pad.y + 3, pad.width - 12, 2);

    // Draw Ball
    const b = ballRef.current;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Particles
    for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
      const p = particlesRef.current[pIdx];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;

      if (p.alpha <= 0) {
        particlesRef.current.splice(pIdx, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }

    // Draw Floating Score Pop Texts
    for (let tIdx = popTextsRef.current.length - 1; tIdx >= 0; tIdx--) {
      const pt = popTextsRef.current[tIdx];
      pt.y -= 1.2;
      pt.alpha -= 0.025;

      if (pt.alpha <= 0) {
        popTextsRef.current.splice(tIdx, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(pt.text, pt.x, pt.y);
      ctx.restore();
    }

    // Request Next Frame
    requestRef.current = requestAnimationFrame(updateAndRender);
  }, [dimensions, launched, onGameOver, resetBallAndPaddle, generateBricks]);

  // Main animation frame handler
  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateAndRender);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [updateAndRender]);

  // Start game from ready state
  const handleStartGame = () => {
    sound.playClick();
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    livesRef.current = 3;
    setCombo(1);
    comboRef.current = 1;
    setMaxCombo(1);
    maxComboRef.current = 1;
    setLevel(1);
    levelRef.current = 1;

    generateBricks(1, dimensions.width, dimensions.height);
    resetBallAndPaddle(dimensions.width, dimensions.height);
    setGameState('PLAYING');
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD Header Bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#120826] border-b-4 border-black text-xs font-bold z-20">
        {/* Score */}
        <div className="flex items-center gap-2 text-purple-300">
          <Zap className="w-4 h-4 fill-purple-400 text-purple-400" />
          <span>SCORE: <span className="text-yellow-400 text-sm font-pixel">{score}</span></span>
        </div>

        {/* Level */}
        <div className="text-cyan-400 font-pixel text-[11px]">
          LVL {level}
        </div>

        {/* Lives / Hearts */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Heart
              key={idx}
              className={`w-4 h-4 transition-all ${
                idx < lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-700 fill-slate-800 scale-90'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Arcade Stage Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="relative flex-1 w-full h-full overflow-hidden cursor-crosshair touch-none flex items-center justify-center"
      >
        {/* Canvas Game Layer */}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="block w-full h-full"
        />

        {/* Thumbnail-Matching Overlay Tag: COMBO xN pill (Top Left) */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 bg-black/80 border-2 border-purple-500 px-3 py-1 rounded shadow-[2px_2px_0_#000] z-20 flex items-center gap-1.5 animate-pulse">
            <span className="text-purple-300 font-pixel text-[11px] font-bold tracking-wider">
              COMBO x{combo}
            </span>
          </div>
        )}

        {/* Tap to Launch Prompt overlay */}
        {gameState === 'PLAYING' && !launched && !isPaused && (
          <div
            onClick={launchBall}
            className="absolute bottom-16 inset-x-0 flex flex-col items-center justify-center z-20 cursor-pointer pointer-events-auto"
          >
            <div className="bg-yellow-400 text-black border-2 border-black font-pixel text-xs px-4 py-2 animate-bounce shadow-[3px_3px_0_#000]">
              PRESS SPACE OR TAP TO LAUNCH! 🚀
            </div>
          </div>
        )}

        {/* Ready / Start Game Screen */}
        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl md:text-4xl text-yellow-400 mb-2 filter drop-shadow-[4px_4px_0_#000] tracking-wide">
              PIXEL BREAK
            </h1>
            <p className="font-mono text-xs text-purple-300 max-w-xs mb-6">
              Smash pixel blocks with your bouncing ball! Target golden blocks for bonus points and power-ups.
            </p>

            <button
              onClick={handleStartGame}
              className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-sm px-8 py-3.5 flex items-center gap-2 cursor-pointer shadow-[4px_4px_0_#000] active:translate-y-1"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>START GAME</span>
            </button>
          </div>
        )}
      </div>

      {/* Touch Control Bar for Mobile devices */}
      <div className="sm:hidden flex justify-between p-2 bg-slate-950 border-t-2 border-slate-800 text-xs font-pixel">
        <button
          onPointerDown={() => (keysRef.current.left = true)}
          onPointerUp={() => (keysRef.current.left = false)}
          onPointerLeave={() => (keysRef.current.left = false)}
          className="pixel-btn bg-slate-800 text-white px-6 py-3 active:bg-purple-600"
        >
          ◀ LEFT
        </button>

        <button
          onClick={launchBall}
          className="pixel-btn bg-yellow-400 text-slate-950 px-4 py-3 font-bold"
        >
          🚀 LAUNCH
        </button>

        <button
          onPointerDown={() => (keysRef.current.right = true)}
          onPointerUp={() => (keysRef.current.right = false)}
          onPointerLeave={() => (keysRef.current.right = false)}
          className="pixel-btn bg-slate-800 text-white px-6 py-3 active:bg-purple-600"
        >
          RIGHT ▶
        </button>
      </div>
    </div>
  );
};
