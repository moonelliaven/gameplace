import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameInfo } from '../types';
import { Pause, Play, RotateCcw, X, Trophy, ArrowLeft, Zap } from 'lucide-react';
import { saveHighScore, getHighScoreForGame } from '../utils/scores';
import { sound } from '../utils/sound';

// Games
import { PixelAim } from './games/PixelAim';
import { CleanRoom } from './games/CleanRoom';
import { CatchIt } from './games/CatchIt';
import { LightUp } from './games/LightUp';
import { PixelPop } from './games/PixelPop';
import { FastFood } from './games/FastFood';
import { PixelBreak } from './games/PixelBreak';
import { PixelSnake } from './games/PixelSnake';
import { PixelStack } from './games/PixelStack';
import { MathDash } from './games/MathDash';
import { PixelRacer } from './games/PixelRacer';
import { PixelPong } from './games/PixelPong';
import { PixelMines } from './games/PixelMines';
import { PixelBowling } from './games/PixelBowling';
import { WordScramble } from './games/WordScramble';
import { PixelDodge } from './games/PixelDodge';
import { PixelGolf } from './games/PixelGolf';
import { PixelMaze } from './games/PixelMaze';
import { FlappyPixel } from './games/FlappyPixel';
import { SpaceDefender } from './games/SpaceDefender';
import { PixelRunner } from './games/PixelRunner';
import { MemoryMatch } from './games/MemoryMatch';
import { PixelJump } from './games/PixelJump';
import { WhackAPixel } from './games/WhackAPixel';

interface GameFrameProps {
  game: GameInfo;
  onExit: () => void;
}

export const GameFrame: React.FC<GameFrameProps> = ({ game, onExit }) => {
  const [countdown, setCountdown] = useState<number | null>(3);
  const [isPaused, setIsPaused] = useState(false);
  const [gameSessionId, setGameSessionId] = useState(0);
  const [gameOverData, setGameOverData] = useState<{
    finalScore: number;
    highestCombo?: number;
    isNewHighScore: boolean;
  } | null>(null);

  // Single-execution guard ref
  const hasFinishedRef = useRef(false);

  // Prevent page scrolling while a game is open and gaming keys are pressed
  useEffect(() => {
    const blocked = new Set([
      ' ', 'Spacebar', 'Enter',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'w', 'a', 's', 'd', 'W', 'A', 'S', 'D',
    ]);
    const onKeyDown = (e: KeyboardEvent) => {
      if (blocked.has(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Restart / Reset game instance
  const handleRestart = useCallback(() => {
    sound.playClick();
    hasFinishedRef.current = false;
    setGameOverData(null);
    setIsPaused(false);
    setCountdown(3);
    setGameSessionId((prev) => prev + 1);
  }, []);

  // Countdown timer on start
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      sound.playCountdown();
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 800);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      sound.playGo();
      const timer = setTimeout(() => {
        setCountdown(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle Game Finish (Strictly executed ONCE per session)
  const handleGameOver = useCallback(
    (finalScore: number, highestCombo?: number) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;

      // Local storage high score update
      const isNewBest = saveHighScore(game.id, finalScore);

      setGameOverData({
        finalScore,
        highestCombo,
        isNewHighScore: isNewBest && finalScore > 0,
      });
    },
    [game.id]
  );

  // Render specific game component
  const renderGameComponent = () => {
    const props = {
      key: gameSessionId,
      onGameOver: handleGameOver,
      onExit,
      isPaused: isPaused || countdown !== null,
    };

    switch (game.id) {
      case 'pixel-aim':
        return <PixelAim {...props} />;
      case 'clean-room':
        return <CleanRoom {...props} />;
      case 'catch-it':
        return <CatchIt {...props} />;
      case 'light-up':
        return <LightUp {...props} />;
      case 'pixel-pop':
        return <PixelPop {...props} />;
      case 'fast-food':
        return <FastFood {...props} />;
      case 'pixel-break':
        return <PixelBreak {...props} />;
      case 'pixel-snake':
        return <PixelSnake {...props} />;
      case 'pixel-stack':
        return <PixelStack {...props} />;
      case 'math-dash':
        return <MathDash {...props} />;
      case 'pixel-racer':
        return <PixelRacer {...props} />;
      case 'pixel-pong':
        return <PixelPong {...props} />;
      case 'pixel-mines':
        return <PixelMines {...props} />;
      case 'pixel-bowling':
        return <PixelBowling {...props} />;
      case 'word-scramble':
        return <WordScramble {...props} />;
      case 'pixel-dodge':
        return <PixelDodge {...props} />;
      case 'pixel-golf':
        return <PixelGolf {...props} />;
      case 'pixel-maze':
        return <PixelMaze {...props} />;
      case 'flappy-pixel':
        return <FlappyPixel {...props} />;
      case 'space-defender':
        return <SpaceDefender {...props} />;
      case 'pixel-runner':
        return <PixelRunner {...props} />;
      case 'memory-match':
        return <MemoryMatch {...props} />;
      case 'pixel-jump':
        return <PixelJump {...props} />;
      case 'whack-a-pixel':
        return <WhackAPixel {...props} />;
      default:
        return <div>Game Not Found</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-2 sm:p-4">
      {/* Arcade Screen Frame */}
      <div className="relative w-full max-w-2xl h-[92vh] max-h-[750px] bg-slate-900 border-8 border-black shadow-[10px_10px_0px_#000] flex flex-col overflow-hidden">
        {/* Game Title Bar Header */}
        <div className="flex items-center justify-between p-3 bg-slate-950 border-b-4 border-black font-pixel text-xs">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold tracking-wider">GAMEPLACE</span>
            <span className="text-slate-500">|</span>
            <span className="text-pink-400">{game.name}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsPaused((p) => !p);
              }}
              className="pixel-btn p-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 cursor-pointer"
              title="Pause Game"
            >
              {isPaused ? <Play className="w-4 h-4 fill-slate-950" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Exit button */}
            <button
              onClick={() => {
                sound.playClick();
                onExit();
              }}
              className="pixel-btn p-1.5 bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              title="Exit to Game Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Stage Area */}
        <div className="relative flex-1 bg-slate-950 flex flex-col overflow-hidden">
          {renderGameComponent()}

          {/* Start Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center z-30">
              <span className="font-pixel text-6xl md:text-8xl text-yellow-400 animate-ping">
                {countdown === 0 ? 'GO!' : countdown}
              </span>
              <span className="font-retro text-sm text-slate-300 mt-6">GET READY!</span>
            </div>
          )}

          {/* Pause Menu Overlay */}
          {isPaused && !gameOverData && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 z-30 animate-fade-in">
              <h2 className="font-pixel text-3xl text-yellow-400 mb-8 filter drop-shadow-[4px_4px_0_#000]">
                PAUSED
              </h2>

              <div className="flex flex-col gap-4 w-64 font-pixel text-xs">
                <button
                  onClick={() => setIsPaused(false)}
                  className="pixel-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>RESUME</span>
                </button>

                <button
                  onClick={handleRestart}
                  className="pixel-btn bg-yellow-400 hover:bg-yellow-300 text-slate-950 py-3 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>RESTART</span>
                </button>

                <button
                  onClick={onExit}
                  className="pixel-btn bg-rose-600 hover:bg-rose-500 text-white py-3 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>EXIT TO MENU</span>
                </button>
              </div>
            </div>
          )}

          {/* Single Game Finish Modal */}
          {gameOverData && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30 animate-fade-in">
              {gameOverData.isNewHighScore && (
                <div className="mb-4 bg-yellow-400 text-slate-950 border-2 border-black font-pixel text-xs px-4 py-1.5 animate-bounce shadow-[3px_3px_0px_#000] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>NEW HIGH SCORE!</span>
                </div>
              )}

              <h2 className="font-pixel text-3xl md:text-4xl text-yellow-400 mb-4 filter drop-shadow-[4px_4px_0_#000]">
                GAME FINISH
              </h2>

              {/* Score breakdown card */}
              <div className="bg-slate-900 border-4 border-black p-6 w-full max-w-xs shadow-[6px_6px_0px_#000] mb-6 space-y-3 font-pixel">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">SCORE:</span>
                  <span className="text-2xl text-yellow-400">{gameOverData.finalScore}</span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-2 text-cyan-400">
                  <span>BEST SCORE:</span>
                  <span className="text-lg text-cyan-300">{getHighScoreForGame(game.id)}</span>
                </div>

                {gameOverData.highestCombo && gameOverData.highestCombo > 1 && (
                  <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-2">
                    <span className="text-pink-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-pink-400" /> MAX COMBO:
                    </span>
                    <span className="text-pink-400">x{gameOverData.highestCombo}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs font-pixel text-xs">
                <button
                  onClick={handleRestart}
                  className="pixel-btn flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 py-3 text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>PLAY AGAIN</span>
                </button>

                <button
                  onClick={onExit}
                  className="pixel-btn flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>EXIT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
