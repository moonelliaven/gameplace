import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Utensils, Check, RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

interface FoodItem {
  id: string;
  name: string;
  icon: string;
}

const FOOD_ITEMS: FoodItem[] = [
  { id: 'burger', name: 'Burger', icon: '🍔' },
  { id: 'fries', name: 'Fries', icon: '🍟' },
  { id: 'soda', name: 'Soda', icon: '🥤' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
];

const CUSTOMER_AVATARS = ['🐱', '🐶', '🦊', '🐸', '🐼', '🐻', '🐰'];

export const FastFood: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [score, setScore] = useState(0);
  const [session, setSession] = useState(1); // 1 to 5 (keeps track of rounds served)
  const [correctOrders, setCorrectOrders] = useState(0);
  const [wrongOrders, setWrongOrders] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30 second timer

  const [currentCustomer, setCurrentCustomer] = useState('🐱');
  const [order, setOrder] = useState<string[]>([]);
  const [tray, setTray] = useState<string[]>([]);

  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong'; id: number } | null>(null);
  const [customerReaction, setCustomerReaction] = useState<'normal' | 'happy' | 'angry'>('normal');
  const [isFinished, setIsFinished] = useState(false);

  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bestScore = getHighScoreForGame('fast-food');

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const stopAllTimers = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  // Start new customer order automatically based on session
  const startSessionOrder = useCallback((sessionNum: number) => {
    const avatar = CUSTOMER_AVATARS[Math.floor(Math.random() * CUSTOMER_AVATARS.length)];
    setCurrentCustomer(avatar);
    setTray([]);
    setCustomerReaction('normal');

    let numItems = 1;
    if (sessionNum === 1) numItems = 1;
    else if (sessionNum === 2) numItems = Math.random() < 0.5 ? 1 : 2;
    else if (sessionNum === 3) numItems = 2;
    else if (sessionNum === 4) numItems = Math.random() < 0.5 ? 2 : 3;
    else numItems = 3;

    const chosen: string[] = [];
    for (let i = 0; i < numItems; i++) {
      const item = FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)].id;
      chosen.push(item);
    }

    setOrder(chosen);
  }, []);

  // Init Session 1 on mount
  useEffect(() => {
    startSessionOrder(1);
    return () => stopAllTimers();
  }, [startSessionOrder, stopAllTimers]);

  // 30-second countdown timer (the only game limit - no session cap)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          onGameOver(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onGameOver]);

  // Add item to tray instantly
  const handleAddToTray = (itemId: string) => {
    if (isPaused || isFinished) return;
    sound.playClick();
    setTray((prev) => [...prev, itemId]);
  };

  // Clear tray
  const handleClearTray = () => {
    if (isPaused || isFinished) return;
    sound.playClick();
    setTray([]);
  };

  // Send / Serve order with fast 250ms transition
  const handleSendOrder = () => {
    if (isPaused || isFinished || tray.length === 0) return;

    const sortedOrder = [...order].sort().join(',');
    const sortedTray = [...tray].sort().join(',');

    if (sortedOrder === sortedTray) {
      sound.playLevelUp();
      const nextScore = score + 20;
      setScore(nextScore);
      setCorrectOrders((c) => c + 1);
      setCustomerReaction('happy');

      const fId = Date.now();
      setFeedback({ text: '✓ CORRECT! (+20)', type: 'correct', id: fId });
      setTimeout(() => setFeedback((f) => (f?.id === fId ? null : f)), 700);

      transitionTimeoutRef.current = setTimeout(() => {
        // Continue serving next order; game end is handled by the 30s timer
        const nextSess = session + 1;
        setSession(nextSess);
        startSessionOrder(nextSess);
      }, 300); // 300ms transition
    } else {
      sound.playBomb();
      setScore((s) => Math.max(0, s - 10));
      setWrongOrders((w) => w + 1);
      setCustomerReaction('angry');

      const fId = Date.now();
      setFeedback({ text: '✕ WRONG ORDER! (-10)', type: 'wrong', id: fId });
      setTimeout(() => setFeedback((f) => (f?.id === fId ? null : f)), 700);

      transitionTimeoutRef.current = setTimeout(() => {
        setTray([]);
        setCustomerReaction('normal');
      }, 300);
    }
  };

  const handleRestart = () => {
    stopAllTimers();
    setScore(0);
    setSession(1);
    setCorrectOrders(0);
    setWrongOrders(0);
    setIsFinished(false);
    setTimeLeft(30);
    startSessionOrder(1);
  };

  const orderText = order
    .map((id) => FOOD_ITEMS.find((f) => f.id === id)?.name.toUpperCase())
    .join(' + ');

  return (
    <div className="flex flex-col h-full w-full select-none font-mono">
      {/* Top HUD */}
      <div className="flex justify-between items-center p-3 bg-[#151525] border-b-4 border-black text-xs font-bold">
        <div
          className={`text-orange-400 flex items-center gap-2 ${
            timeLeft <= 10 && !isFinished ? 'text-red-500 animate-pulse' : ''
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>TIME: <span className={`text-white font-pixel text-sm ${timeLeft <= 10 && !isFinished ? 'text-red-400' : ''}`}>{timeLeft}s</span></span>
        </div>
        <div className="text-emerald-400">
          SERVED: <span className="text-white">{correctOrders}</span>
        </div>
        <div className="text-yellow-400">
          POINTS: <span className="text-white">{score}</span>
        </div>
      </div>

      {/* Main Restaurant Counter */}
      <div className="relative flex-1 bg-gradient-to-b from-[#2d1b0e] via-[#1a120b] to-[#0d0905] overflow-hidden flex flex-col items-center justify-between p-4 border-b-4 border-black">
        {/* Feedback Popup */}
        {feedback && (
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 z-40 px-5 py-1.5 border-2 border-black font-pixel text-xs font-bold shadow-[3px_3px_0_0_#000] animate-bounce ${
              feedback.type === 'correct' ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Customer & Speech Area */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md mt-2">
          {/* Order Speech Bubble */}
          <div className="relative bg-white text-black border-4 border-black p-3 font-pixel text-xs text-center shadow-[4px_4px_0_0_#000] w-full min-h-[60px] flex items-center justify-center">
            <div>
              <p className="text-[10px] text-slate-500 mb-1 font-bold">CUSTOMER SAYS:</p>
              <p className="font-bold text-orange-600 text-sm">"I WANT {orderText}!"</p>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-black rotate-45" />
          </div>

          <div className="text-6xl sm:text-7xl animate-float my-2 relative">
            {currentCustomer}
            {customerReaction === 'happy' && (
              <span className="absolute -top-4 -right-4 text-3xl animate-bounce">❤️</span>
            )}
            {customerReaction === 'angry' && (
              <span className="absolute -top-4 -right-4 text-3xl animate-ping">💢</span>
            )}
          </div>
        </div>

        {/* Cashier Tray */}
        <div className="w-full max-w-md bg-[#151525] border-4 border-black p-3 shadow-[4px_4px_0_0_#000]">
          <div className="flex justify-between items-center mb-1 font-pixel text-[10px] text-slate-400">
            <span>YOUR TRAY:</span>
            {tray.length > 0 && (
              <button
                onClick={handleClearTray}
                className="text-red-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <RotateCcw className="w-3 h-3" /> CLEAR
              </button>
            )}
          </div>

          <div className="min-h-[48px] bg-black border-2 border-slate-700 p-2 flex items-center justify-center gap-3">
            {tray.length === 0 ? (
              <span className="text-xs text-slate-500 font-pixel">Select food items below</span>
            ) : (
              tray.map((itemId, idx) => (
                <span key={idx} className="text-3xl animate-bounce">
                  {FOOD_ITEMS.find((f) => f.id === itemId)?.icon}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Food Choices Controls */}
      <div className="p-3 bg-[#151525] flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-2">
          {FOOD_ITEMS.map((food) => (
            <button
              key={food.id}
              disabled={isFinished}
              onClick={() => handleAddToTray(food.id)}
              className="font-pixel p-2 text-center flex flex-col items-center justify-center gap-1 border-2 border-black bg-slate-800 hover:bg-slate-700 text-white cursor-pointer active:scale-95 shadow-[2px_2px_0_0_#000]"
            >
              <span className="text-2xl">{food.icon}</span>
              <span className="text-[9px] text-amber-300 font-bold">{food.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleSendOrder}
          disabled={tray.length === 0 || isFinished}
          className={`w-full font-pixel py-3 text-xs font-bold border-2 border-black flex items-center justify-center gap-2 ${
            tray.length > 0 && !isFinished
              ? 'bg-orange-500 hover:bg-orange-400 text-black cursor-pointer shadow-[3px_3px_0_0_#000] active:scale-95'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>SEND ORDER</span>
        </button>
      </div>
    </div>
  );
};
