import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Calculator, Timer, Trophy, Check, X, RotateCcw } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface Equation {
  a: number;
  b: number;
  op: '+' | '-' | '×';
  answer: number;
  correct: boolean;
  display: string;
}

const makeEquation = (): Equation => {
  const ops: Array<'+' | '-' | '×'> = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 0;
  let b = 0;
  let answer = 0;
  if (op === '+') {
    a = Math.floor(Math.random() * 90) + 5;
    b = Math.floor(Math.random() * 90) + 5;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 90) + 10;
    b = Math.floor(Math.random() * a);
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 10) + 2;
    b = Math.floor(Math.random() * 10) + 2;
    answer = a * b;
  }

  const correct = Math.random() < 0.5;
  const shownAnswer = correct ? answer : answer + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 5) + 1);

  return { a, b, op, answer, correct, display: `${a} ${op} ${b} = ${shownAnswer}` };
};

export const MathDash: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'PLAYING' | 'FINISHED'>('PLAYING');
  const [equation, setEquation] = useState<Equation>(makeEquation);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; id: number } | null>(null);

  const scoreRef = useRef(0);
  const equationRef = useRef(equation);
  equationRef.current = equation;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const bestScore = getHighScoreForGame('math-dash');

  const nextEquation = useCallback(() => {
    setEquation(makeEquation());
  }, []);

  // 60s timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setGameState('FINISHED');
          sound.playWin();
          onGameOver(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onGameOver]);

  const handleAnswer = (userSaysTrue: boolean) => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;

    const eq = equationRef.current;
    const isCorrect = eq.correct === userSaysTrue;

    if (isCorrect) {
      sound.playScore();
      const newStreak = streak + 1;
      const points = 10 + (newStreak >= 5 ? 10 : 0);
      const newScore = scoreRef.current + points;
      scoreRef.current = newScore;
      setScore(newScore);
      setStreak(newStreak);
      setBestStreak((bs) => Math.max(bs, newStreak));
      setCorrectCount((c) => c + 1);
      if (newStreak % 5 === 0) sound.playLevelUp();
    } else {
      sound.playBomb();
      setStreak(0);
      setWrongCount((w) => w + 1);
    }

    const fId = Date.now();
    setFeedback({ type: isCorrect ? 'correct' : 'wrong', id: fId });
    setTimeout(() => setFeedback((f) => (f?.id === fId ? null : f)), 500);

    nextEquation();
  };

  const handleRestart = () => {
    sound.playClick();
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setTimeLeft(60);
    setGameState('PLAYING');
    nextEquation();
  };

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-fuchsia-300 flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          STREAK: <span className={`${streak >= 5 ? 'text-yellow-300 animate-pulse' : 'text-white'}`}>x{streak}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">✓{correctCount}</span>
          <span className="text-rose-400">✕{wrongCount}</span>
        </div>
        <div className="text-cyan-400 flex items-center gap-1">
          <Timer className="w-4 h-4" />
          <span className={`${timeLeft <= 10 ? 'text-red-500 animate-ping' : 'text-white'}`}>{timeLeft}s</span>
        </div>
      </div>

      {/* Main */}
      <div className="relative flex-1 bg-gradient-to-b from-[#2e1065] via-[#1e1b4b] to-[#0b0b1a] flex flex-col items-center justify-center gap-8 p-4 border-b-4 border-black">
        {feedback && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-1.5 border-2 border-black font-pixel text-xs font-bold shadow-[3px_3px_0_0_#000] animate-bounce ${
              feedback.type === 'correct' ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'
            }`}
          >
            {feedback.type === 'correct' ? '✓ CORRECT!' : '✕ WRONG!'}
          </div>
        )}

        <div className="bg-[#151525] border-4 border-black shadow-[6px_6px_0_0_#000] p-6 sm:p-8 text-center w-full max-w-md">
          <p className="text-[10px] text-slate-400 font-pixel mb-3">TRUE OR FALSE?</p>
          <p className="font-pixel text-2xl sm:text-3xl text-white tracking-wide">{equation.display}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <button
            onClick={() => handleAnswer(true)}
            disabled={gameState === 'FINISHED'}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-pixel py-5 border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-6 h-6" />TRUE
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={gameState === 'FINISHED'}
            className="bg-rose-600 hover:bg-rose-500 text-white font-pixel py-5 border-4 border-black shadow-[4px_4px_0_0_#000] active:translate-y-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <X className="w-6 h-6" />FALSE
          </button>
        </div>

        {gameState === 'FINISHED' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="font-pixel text-2xl text-yellow-400 mb-2">TIME'S UP!</h2>
            <p className="font-mono text-sm text-slate-300 mb-2">
              FINAL SCORE: <span className="text-yellow-400 font-bold">{score}</span>
            </p>
            <p className="font-mono text-xs text-slate-400 mb-6">
              ✓ {correctCount} correct · ✕ {wrongCount} wrong · BEST STREAK x{bestStreak}
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