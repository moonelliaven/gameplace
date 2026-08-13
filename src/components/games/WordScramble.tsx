import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Type, Trophy, Play, RotateCcw, Timer, Eraser } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

const WORDS = [
  { word: 'ARCADE', hint: 'CLASSIC GAME ROOM' },
  { word: 'PIXEL', hint: '8-BIT SQUARE' },
  { word: 'JOYSTICK', hint: 'CONTROL LEVER' },
  { word: 'BONUS', hint: 'EXTRA REWARD' },
  { word: 'HIGHSCORE', hint: 'TOP RESULT' },
  { word: 'CABINET', hint: 'ARCADE MACHINE' },
  { word: 'RETRO', hint: 'OLD SCHOOL' },
  { word: 'TURBO', hint: 'EXTRA FAST' },
  { word: 'COMBO', hint: 'CHAIN OF HITS' },
  { word: 'MONITOR', hint: 'DISPLAY SCREEN' },
  { word: 'PLAYER', hint: 'GAME PARTICIPANT' },
  { word: 'GHOST', hint: 'PAC-MAN ENEMY' },
  { word: 'TETRIS', hint: 'FALLING BLOCKS' },
  { word: 'SNAKE', hint: 'GROWING REPTILE' },
  { word: 'PACMAN', hint: 'PELLET EATER' },
];

const shuffle = (str: string): string => {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.join('') === str) return shuffle(str);
  return arr.join('');
};

export const WordScramble: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'FINISHED' | 'WON'>('READY');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [solvedCount, setSolvedCount] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong'; id: number } | null>(null);

  const scoreRef = useRef(0);
  const roundRef = useRef(1);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const slotsRef = useRef<(string | null)[]>([]);

  const bestScore = getHighScoreForGame('word-scramble');

  const loadWord = useCallback(() => {
    const entry = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(entry.word);
    setScrambled(shuffle(entry.word).split(''));
    const empty: (string | null)[] = Array(entry.word.length).fill(null);
    setSlots(empty);
    slotsRef.current = empty;
  }, []);

  const startGame = () => {
    sound.playClick();
    setScore(0);
    scoreRef.current = 0;
    setRound(1);
    roundRef.current = 1;
    setSolvedCount(0);
    setTimeLeft(60);
    loadWord();
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

  const pickLetter = (letter: string, index: number) => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;

    const slotIdx = slotsRef.current.indexOf(null);
    if (slotIdx < 0) return;

    const nextSlots = [...slotsRef.current];
    nextSlots[slotIdx] = letter;
    slotsRef.current = nextSlots;
    setSlots(nextSlots);

    const newScrambled = [...scrambled];
    newScrambled[index] = '';
    setScrambled(newScrambled);

    sound.playClick();

    // Check completion
    if (nextSlots.every((l) => l !== null)) {
      if (nextSlots.join('') === currentWord) {
        sound.playLevelUp();
        const gained = currentWord.length * 10;
        scoreRef.current += gained;
        setScore(scoreRef.current);
        setSolvedCount((s) => s + 1);
        setRound((r) => r + 1);
        roundRef.current += 1;

        const fId = Date.now();
        setFeedback({ text: `✓ CORRECT! +${gained}`, type: 'correct', id: fId });
        setTimeout(() => setFeedback((f) => (f?.id === fId ? null : f)), 900);

        setTimeout(() => loadWord(), 1000);
      } else {
        sound.playBomb();
        const fId = Date.now();
        setFeedback({ text: '✕ WRONG! TRY AGAIN', type: 'wrong', id: fId });
        setTimeout(() => setFeedback((f) => (f?.id === fId ? null : f)), 900);

        // Reset letters
        setTimeout(() => {
          setScrambled(shuffle(currentWord).split(''));
          const empty: (string | null)[] = Array(currentWord.length).fill(null);
          setSlots(empty);
          slotsRef.current = empty;
        }, 600);
      }
    }
  };

  const clearPicked = () => {
    if (gameStateRef.current !== 'PLAYING' || isPausedRef.current) return;
    sound.playClick();
    setScrambled(shuffle(currentWord).split(''));
    const empty: (string | null)[] = Array(currentWord.length).fill(null);
    setSlots(empty);
    slotsRef.current = empty;
  };

  const handleRestart = () => {
    sound.playClick();
    startGame();
  };

  const wordHint = WORDS.find((w) => w.word === currentWord)?.hint;

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-slate-950">
      {/* HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div className="text-emerald-300 flex items-center gap-2">
          <Type className="w-4 h-4" />
          <span>SCORE: <span className="text-yellow-400 font-pixel">{score}</span></span>
        </div>
        <div className="text-cyan-400 font-pixel text-[11px]">
          SOLVED: <span className="text-white">{solvedCount}</span>
        </div>
        <div className="flex items-center gap-1 text-orange-400">
          <Timer className="w-4 h-4" />
          <span className={`${timeLeft <= 10 ? 'text-red-500 animate-ping' : 'text-white'}`}>{timeLeft}s</span>
        </div>
      </div>

      <div className="relative flex-1 bg-gradient-to-b from-[#064e3b] to-[#0b0b1a] flex flex-col items-center justify-center gap-6 p-4 border-b-4 border-black">
        {feedback && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-1.5 border-2 border-black font-pixel text-xs font-bold shadow-[3px_3px_0_0_#000] animate-bounce ${
              feedback.type === 'correct' ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="bg-[#151525] border-4 border-black shadow-[6px_6px_0_0_#000] p-5 w-full max-w-md text-center">
          <p className="text-[10px] text-slate-400 font-pixel mb-1">HINT: {wordHint}</p>
          <div className="flex justify-center gap-1.5 flex-wrap mb-4 mt-3">
            {Array.from(currentWord).map((letter, idx) => (
              <div
                key={idx}
                className={`w-8 h-10 sm:w-9 sm:h-11 border-2 flex items-center justify-center font-pixel text-sm font-bold ${
                  slots[idx] ? 'bg-emerald-500 text-black border-emerald-300' : 'bg-black border-white/30 text-white'
                }`}
              >
                {slots[idx] || ''}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1.5 flex-wrap">
            {scrambled.map((letter, idx) =>
              letter ? (
                <button
                  key={idx}
                  onClick={() => pickLetter(letter, idx)}
                  className="w-9 h-11 sm:w-10 sm:h-12 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center font-pixel text-sm font-bold cursor-pointer active:scale-90"
                >
                  {letter}
                </button>
              ) : (
                <div key={idx} className="w-9 h-11 sm:w-10 sm:h-12" />
              )
            )}
          </div>
        </div>

        <button
          onClick={clearPicked}
          disabled={gameState !== 'PLAYING'}
          className="bg-slate-800 hover:bg-slate-700 text-white font-pixel py-2 px-6 text-xs border-2 border-black shadow-[3px_3px_0_0_#000] cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          <Eraser className="w-4 h-4" />RESET LETTERS
        </button>

        {gameState === 'READY' && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center z-30">
            <h1 className="font-pixel text-3xl text-emerald-300 mb-2 filter drop-shadow-[4px_4px_0_#000]">WORD SCRAMBLE</h1>
            <p className="font-mono text-xs text-slate-300 max-w-xs mb-6">
              Unscramble the arcade words before the 60-second fuse burns out!
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
            <h2 className="font-pixel text-2xl text-red-500 mb-2">FUSE BURNED OUT!</h2>
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