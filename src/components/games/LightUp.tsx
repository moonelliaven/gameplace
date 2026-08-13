import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Lightbulb, Trophy, RotateCcw, ArrowLeft } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Bulb {
  id: number;
  label: string;
  color: string;
  activeColor: string;
}

const HORIZONTAL_BULBS: Bulb[] = [
  { id: 1, label: '1', color: 'bg-red-950 border-red-500 text-red-400', activeColor: 'bg-red-500 text-black shadow-[0_0_20px_#ef4444]' },
  { id: 2, label: '2', color: 'bg-yellow-950 border-yellow-500 text-yellow-400', activeColor: 'bg-yellow-400 text-black shadow-[0_0_20px_#f59e0b]' },
  { id: 3, label: '3', color: 'bg-emerald-950 border-emerald-500 text-emerald-400', activeColor: 'bg-emerald-400 text-black shadow-[0_0_20px_#10b981]' },
  { id: 4, label: '4', color: 'bg-blue-950 border-blue-500 text-blue-400', activeColor: 'bg-blue-500 text-white shadow-[0_0_20px_#3b82f6]' },
  { id: 5, label: '5', color: 'bg-purple-950 border-purple-500 text-purple-400', activeColor: 'bg-purple-500 text-white shadow-[0_0_20px_#a855f7]' },
];

export const LightUp: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [totalSessions, setTotalSessions] = useState<number>(5);
  const [customInput, setCustomInput] = useState<string>('5');
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const [currentSession, setCurrentSession] = useState<number>(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeBulbId, setActiveBulbId] = useState<number | null>(null);

  const [step, setStep] = useState<'PREPARE' | 'MEMORIZE' | 'PLAYER_TURN' | 'SESSION_RESULT' | 'FINAL_RESULT'>('PREPARE');
  const [correctSessions, setCorrectSessions] = useState<number>(0);
  const [wrongSessions, setWrongSessions] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  const isCancelledRef = useRef<boolean>(false);
  const bestScore = getHighScoreForGame('light-up');

  // Cancel any running preview loops
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
    };
  }, []);

  // Start game
  const handleStartGame = (sessionsCount: number) => {
    const validCount = Math.min(20, Math.max(1, sessionsCount));
    setTotalSessions(validCount);
    setGameStarted(true);
    setCurrentSession(1);
    setCorrectSessions(0);
    setWrongSessions(0);
    setScore(0);
    setStep('PREPARE');
    runSession(1, validCount);
  };

  // Run session: Light ON 300ms, Gap 150ms
  const runSession = useCallback(async (sessionNum: number, maxSessions: number) => {
    isCancelledRef.current = false;
    setActiveBulbId(null);
    setPlayerInput([]);

    const seqLen = Math.min(10, 2 + sessionNum);
    const newSeq: number[] = [];
    for (let i = 0; i < seqLen; i++) {
      newSeq.push(Math.floor(Math.random() * 5) + 1);
    }
    setSequence(newSeq);

    // STEP 1: PREPARATION
    setStep('PREPARE');
    await new Promise((r) => setTimeout(r, 600));
    if (isCancelledRef.current) return;

    // STEP 2: SHOW SEQUENCE (PREVIEW: 300ms ON, 150ms GAP)
    setStep('MEMORIZE');
    for (let i = 0; i < newSeq.length; i++) {
      if (isCancelledRef.current) return;
      const bId = newSeq[i];
      setActiveBulbId(bId);
      sound.playScore();
      await new Promise((r) => setTimeout(r, 300)); // Light ON: 300ms
      setActiveBulbId(null);
      await new Promise((r) => setTimeout(r, 150)); // Gap: 150ms
    }

    if (isCancelledRef.current) return;

    // STEP 3: HIDE HINT & PLAYER TURN IMMEDIATELY ACTIVE
    setStep('PLAYER_TURN');
  }, []);

  // Handle Bulb click during PLAYER_TURN
  const handleBulbClick = (bulbId: number) => {
    if (step !== 'PLAYER_TURN' || isPaused) return;

    sound.playScore();
    setActiveBulbId(bulbId);
    setTimeout(() => setActiveBulbId(null), 150);

    const nextInput = [...playerInput, bulbId];
    setPlayerInput(nextInput);

    const checkIdx = nextInput.length - 1;

    if (nextInput[checkIdx] !== sequence[checkIdx]) {
      // Wrong sequence
      sound.playBomb();
      setWrongSessions((w) => w + 1);
      setStep('SESSION_RESULT');

      setTimeout(() => {
        advanceSession();
      }, 1000);
      return;
    }

    // Correct sequence completed!
    if (nextInput.length === sequence.length) {
      sound.playLevelUp();
      const points = sequence.length * 50 + currentSession * 50;
      setScore((s) => s + points);
      setCorrectSessions((c) => c + 1);
      setStep('SESSION_RESULT');

      setTimeout(() => {
        advanceSession();
      }, 1000);
    }
  };

  const advanceSession = () => {
    if (currentSession < totalSessions) {
      const nextS = currentSession + 1;
      setCurrentSession(nextS);
      runSession(nextS, totalSessions);
    } else {
      sound.playWin();
      setStep('FINAL_RESULT');
      onGameOver(score);
    }
  };

  const accuracy =
    correctSessions + wrongSessions > 0 ? Math.round((correctSessions / (correctSessions + wrongSessions)) * 100) : 100;

  return (
    <div className="flex flex-col h-full w-full select-none font-mono">
      {/* Top HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-yellow-400 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          <span>SESSION: <span className="text-white">{gameStarted ? `${currentSession}/${totalSessions}` : 'CONFIG'}</span></span>
        </div>
        <div className="text-cyan-400">
          SCORE: <span className="text-white">{score}</span>
        </div>
      </div>

      {/* Main Stage */}
      <div className="relative flex-1 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#090d16] flex flex-col items-center justify-center p-4 border-b-4 border-black">
        {/* Setup Screen before game starts */}
        {!gameStarted && (
          <div className="bg-[#151525] border-4 border-black p-6 w-full max-w-sm shadow-[6px_6px_0_0_#000] text-center space-y-4">
            <h2 className="font-pixel text-xl text-yellow-400">LIGHT UP SESSIONS</h2>
            <p className="text-xs text-slate-300">Enter the number of sessions to play:</p>

            <div className="flex items-center justify-center gap-2 border-t border-slate-700 pt-4">
              <input
                type="number"
                min={1}
                max={20}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStartGame(parseInt(customInput) || 5);
                }}
                className="w-24 bg-black border-2 border-yellow-400 text-yellow-300 px-2 py-2.5 font-pixel text-xl text-center"
              />
              <button
                onClick={() => handleStartGame(parseInt(customInput) || 5)}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-pixel py-2.5 text-xs font-bold cursor-pointer shadow-[2px_2px_0_0_#000]"
              >
                START
              </button>
            </div>
          </div>
        )}

        {/* Gameplay Stage */}
        {gameStarted && step !== 'FINAL_RESULT' && (
          <div className="flex flex-col items-center justify-center w-full max-w-lg space-y-6">
            <div
              className={`font-pixel text-xs sm:text-sm px-6 py-2 border-2 border-black shadow-[4px_4px_0_0_#000] text-center font-bold uppercase transition-all ${
                step === 'PREPARE'
                  ? 'bg-amber-500 text-black animate-pulse'
                  : step === 'MEMORIZE'
                  ? 'bg-cyan-500 text-black'
                  : step === 'PLAYER_TURN'
                  ? 'bg-emerald-500 text-black'
                  : 'bg-purple-600 text-white'
              }`}
            >
              {step === 'PREPARE' && 'GET READY!'}
              {step === 'MEMORIZE' && 'MEMORIZE THE SEQUENCE!'}
              {step === 'PLAYER_TURN' && 'YOUR TURN! REPEAT THE SEQUENCE'}
              {step === 'SESSION_RESULT' && (playerInput.join(',') === sequence.join(',') ? '✓ SESSION PASSED!' : '✕ SESSION FAILED!')}
            </div>

            {/* Sequence Hint (Shown during MEMORIZE preview only - HIDDEN during player turn) */}
            <div className="min-h-[36px] flex items-center justify-center">
              {step === 'MEMORIZE' ? (
                <div className="bg-black/80 border border-yellow-400 px-4 py-1 font-pixel text-xs text-yellow-300 tracking-wider">
                  SEQUENCE: {sequence.join(' → ')}
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-pixel">
                  {step === 'PLAYER_TURN' ? `INPUT (${playerInput.length}/${sequence.length})` : ''}
                </div>
              )}
            </div>

            {/* Bulbs Row */}
            <div className="flex justify-center items-center gap-2 sm:gap-4 w-full">
              {HORIZONTAL_BULBS.map((b) => {
                const isActive = activeBulbId === b.id;
                return (
                  <button
                    key={b.id}
                    disabled={step !== 'PLAYER_TURN' || isPaused}
                    onClick={() => handleBulbClick(b.id)}
                    className={`flex-1 h-24 sm:h-32 border-4 border-black shadow-[4px_4px_0_0_#000] flex flex-col items-center justify-center gap-2 font-pixel cursor-pointer transition-all ${
                      isActive ? b.activeColor : b.color
                    } ${step === 'PLAYER_TURN' ? 'hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-80'}`}
                  >
                    <span className="text-2xl sm:text-3xl filter drop-shadow-[2px_2px_0_#000]">💡</span>
                    <span className="text-xs sm:text-sm font-bold">[ {b.label} ]</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
