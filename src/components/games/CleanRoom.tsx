import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameContainerProps } from '../../types';
import { sound } from '../../utils/sound';
import { Sparkles, Timer, Trophy, Play, RotateCcw, Hand, Home, Award } from 'lucide-react';
import { getHighScoreForGame } from '../../utils/scores';

export interface CleanItem {
  id: string;
  name: string;
  icon: string;
  category: 'ELECTRONICS' | 'CLOTHES' | 'FOOD' | 'BOOKS';
  x: number; // percentage
  y: number; // percentage
  sorted: boolean;
}

export interface CategoryBox {
  id: 'ELECTRONICS' | 'CLOTHES' | 'FOOD' | 'BOOKS';
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

const CATEGORY_BOXES: CategoryBox[] = [
  {
    id: 'ELECTRONICS',
    label: 'TECH',
    icon: '💻',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/90',
    borderColor: 'border-cyan-400',
    glowColor: 'shadow-cyan-500/50',
  },
  {
    id: 'CLOTHES',
    label: 'CLOTHES',
    icon: '👕',
    color: 'text-pink-400',
    bgColor: 'bg-pink-950/90',
    borderColor: 'border-pink-400',
    glowColor: 'shadow-pink-500/50',
  },
  {
    id: 'FOOD',
    label: 'FOOD',
    icon: '🍕',
    color: 'text-yellow-400',
    bgColor: 'bg-amber-950/90',
    borderColor: 'border-yellow-400',
    glowColor: 'shadow-yellow-500/50',
  },
  {
    id: 'BOOKS',
    label: 'BOOKS',
    icon: '📚',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/90',
    borderColor: 'border-emerald-400',
    glowColor: 'shadow-emerald-500/50',
  },
];

const ITEM_POOL: Omit<CleanItem, 'id' | 'x' | 'y' | 'sorted'>[] = [
  // Electronics
  { name: 'Phone', icon: '📱', category: 'ELECTRONICS' },
  { name: 'Gamepad', icon: '🎮', category: 'ELECTRONICS' },
  { name: 'Headphones', icon: '🎧', category: 'ELECTRONICS' },
  { name: 'Laptop', icon: '💻', category: 'ELECTRONICS' },
  { name: 'Cable', icon: '🔌', category: 'ELECTRONICS' },
  { name: 'Batteries', icon: '🔋', category: 'ELECTRONICS' },
  { name: 'Camera', icon: '📷', category: 'ELECTRONICS' },
  // Clothes
  { name: 'Sock', icon: '🧦', category: 'CLOTHES' },
  { name: 'Shirt', icon: '👕', category: 'CLOTHES' },
  { name: 'Pants', icon: '👖', category: 'CLOTHES' },
  { name: 'Cap', icon: '🧢', category: 'CLOTHES' },
  { name: 'Shoe', icon: '👟', category: 'CLOTHES' },
  { name: 'Jacket', icon: '🧥', category: 'CLOTHES' },
  // Food
  { name: 'Pizza', icon: '🍕', category: 'FOOD' },
  { name: 'Burger', icon: '🍔', category: 'FOOD' },
  { name: 'Soda', icon: '🥤', category: 'FOOD' },
  { name: 'Apple', icon: '🍎', category: 'FOOD' },
  { name: 'Donut', icon: '🍩', category: 'FOOD' },
  { name: 'Candy', icon: '🍬', category: 'FOOD' },
  // Books
  { name: 'Book', icon: '📖', category: 'BOOKS' },
  { name: 'Notebook', icon: '📓', category: 'BOOKS' },
  { name: 'Magazine', icon: '📰', category: 'BOOKS' },
  { name: 'Paper', icon: '📄', category: 'BOOKS' },
  { name: 'Comic', icon: '📚', category: 'BOOKS' },
];

const ROOM_BACKGROUNDS = [
  'from-[#1a1a3a] via-[#121226] to-[#0d0d1a]',
  'from-[#2a1a3a] via-[#1a0f26] to-[#0d0d1a]',
  'from-[#1a2e3a] via-[#0f1f26] to-[#0d0d1a]',
  'from-[#1a3a2a] via-[#0f261a] to-[#0d0d1a]',
];

export const CleanRoom: React.FC<GameContainerProps> = ({ onGameOver, isPaused }) => {
  const [gameState, setGameState] = useState<'PLAYING' | 'FINISHED'>('PLAYING');
  const [items, setItems] = useState<CleanItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [roomsCleaned, setRoomsCleaned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong' | 'room'; id: number } | null>(null);

  const playAreaRef = useRef<HTMLDivElement>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [hoveredBox, setHoveredBox] = useState<'ELECTRONICS' | 'CLOTHES' | 'FOOD' | 'BOOKS' | null>(null);
  const hoveredBoxRef = useRef<'ELECTRONICS' | 'CLOTHES' | 'FOOD' | 'BOOKS' | null>(null);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const roomsCleanedRef = useRef(roomsCleaned);
  roomsCleanedRef.current = roomsCleaned;

  const bestScore = getHighScoreForGame('clean-room');

  // Generate items for a new room session (8 items per room for speed sorting)
  const generateNewRoom = useCallback(() => {
    const itemCount = 8;
    const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5).slice(0, itemCount);
    const roomItems: CleanItem[] = shuffled.map((item, idx) => ({
      id: `item-${idx}-${Date.now()}`,
      name: item.name,
      icon: item.icon,
      category: item.category,
      x: 12 + (idx % 4) * 22 + (Math.random() * 6 - 3),
      y: 15 + Math.floor(idx / 4) * 32 + (Math.random() * 6 - 3),
      sorted: false,
    }));

    setItems(roomItems);
    setSelectedItemId(null);
    setDraggingItemId(null);
  }, []);

  // Detect touch device on mount & initialize room items preview
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    generateNewRoom();
  }, [generateNewRoom]);

  // 30-Second Countdown Timer Effect
  useEffect(() => {
    if (gameState !== 'PLAYING' || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sound.playGameOver();
          setGameState('FINISHED');
          onGameOver(scoreRef.current, roomsCleanedRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, isPaused, onGameOver]);

  // Check room completion -> Spawn next room!
  useEffect(() => {
    if (gameState === 'PLAYING' && items.length > 0 && items.every((i) => i.sorted)) {
      sound.playLevelUp();
      setRoomsCleaned((r) => r + 1);
      setScore((s) => s + 100); // Room clear bonus!
      setTimeLeft((t) => Math.min(30, t + 2)); // +2s Time bonus reward!

      const fId = Date.now();
      setFeedback({ text: '✨ ROOM CLEANED! (+100 PTS / +2s)', type: 'room', id: fId });
      setTimeout(() => {
        setFeedback((f) => (f?.id === fId ? null : f));
      }, 1200);

      // Load next messy room session
      generateNewRoom();
    }
  }, [items, gameState, generateNewRoom]);

  // Attempt to sort item into box
  const sortItemToCategory = (itemId: string, category: 'ELECTRONICS' | 'CLOTHES' | 'FOOD' | 'BOOKS') => {
    if (isPaused || gameState !== 'PLAYING') return;

    const item = items.find((i) => i.id === itemId);
    if (!item || item.sorted) return;

    if (item.category === category) {
      // Correct!
      sound.playScore();
      setScore((s) => s + 20);
      setCorrectCount((c) => c + 1);

      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, sorted: true } : i)));
      setSelectedItemId(null);

      const fId = Date.now();
      setFeedback({ text: '✓ CORRECT! (+20)', type: 'correct', id: fId });
      setTimeout(() => {
        setFeedback((f) => (f?.id === fId ? null : f));
      }, 800);
    } else {
      // Wrong box!
      sound.playBomb();
      setScore((s) => Math.max(0, s - 10));
      setWrongCount((w) => w + 1);

      const fId = Date.now();
      setFeedback({ text: '✕ WRONG BOX! (-10)', type: 'wrong', id: fId });
      setTimeout(() => {
        setFeedback((f) => (f?.id === fId ? null : f));
      }, 800);
    }
  };

  // Pointer down on item
  const handlePointerDown = (item: CleanItem, e: React.PointerEvent) => {
    if (isPaused || item.sorted || gameState !== 'PLAYING') return;
    e.preventDefault();
    e.stopPropagation();

    setSelectedItemId(item.id);
    setDraggingItemId(item.id);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  // Global window pointermove & pointerup listeners
  useEffect(() => {
    if (!draggingItemId) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });

      let currentHovered: 'ELECTRONICS' | 'CLOTHES' | 'FOOD' | 'BOOKS' | null = null;
      try {
        let el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        while (el && !el.getAttribute?.('data-category-box')) el = el.parentElement;
        currentHovered = (el && (el.getAttribute('data-category-box') as any)) || null;
      } catch (err) {
        // fallback to bounding rect checks
        const boxElements = document.querySelectorAll('[data-category-box]');
        boxElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const TOLERANCE = 30;
          if (
            e.clientX >= rect.left - TOLERANCE &&
            e.clientX <= rect.right + TOLERANCE &&
            e.clientY >= rect.top - TOLERANCE &&
            e.clientY <= rect.bottom + TOLERANCE
          ) {
            currentHovered = el.getAttribute('data-category-box') as any;
          }
        });
      }

      setHoveredBox(currentHovered);
      hoveredBoxRef.current = currentHovered;
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      const droppedItemId = draggingItemId;
      setDraggingItemId(null);
      setHoveredBox(null);

      let matchedCategory: 'ELECTRONICS' | 'CLOTHES' | 'FOOD' | 'BOOKS' | null = null;
      try {
        let el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        while (el && !el.getAttribute?.('data-category-box')) el = el.parentElement;
        matchedCategory = (el && (el.getAttribute('data-category-box') as any)) || null;
      } catch (err) {
        const boxElements = document.querySelectorAll('[data-category-box]');
        const TOLERANCE = 50;
        boxElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (
            e.clientX >= rect.left - TOLERANCE &&
            e.clientX <= rect.right + TOLERANCE &&
            e.clientY >= rect.top - TOLERANCE &&
            e.clientY <= rect.bottom + TOLERANCE
          ) {
            matchedCategory = el.getAttribute('data-category-box') as any;
          }
        });
      }

      if (matchedCategory && droppedItemId) {
        sortItemToCategory(droppedItemId, matchedCategory);
      } else if (hoveredBoxRef.current && droppedItemId) {
        // Fallback: use the box that was hovered during the drag
        sortItemToCategory(droppedItemId, hoveredBoxRef.current);
      }
      hoveredBoxRef.current = null;
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [draggingItemId]);

  const remainingCount = items.filter((i) => !i.sorted).length;
  const totalCount = items.length;
  const selectedItem = items.find((i) => i.id === selectedItemId);
  const currentBgTheme = ROOM_BACKGROUNDS[roomsCleaned % ROOM_BACKGROUNDS.length];

  return (
    <div className="flex flex-col h-full w-full select-none font-mono bg-[#0d0d1a] touch-none">
      {/* Top HUD */}
      <div className="flex justify-between items-center px-3 py-2 bg-[#151525] border-b-4 border-black text-xs font-bold z-20">
        {/* Rooms Cleaned */}
        <div className="text-emerald-400 flex items-center gap-1.5">
          <Home className="w-4 h-4" />
          <span>
            ROOMS: <span className="text-white text-sm font-pixel">{roomsCleaned}</span>
          </span>
        </div>

        {/* 30-Second Countdown Timer */}
        <div
          className={`flex items-center gap-1 font-pixel text-sm px-2.5 py-1 rounded border-2 border-black ${
            timeLeft <= 10 && gameState === 'PLAYING'
              ? 'bg-rose-600 text-white animate-pulse border-rose-400 shadow-[0_0_12px_#f43f5e]'
              : 'bg-yellow-400 text-slate-950'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>

        {/* Score */}
        <div className="text-cyan-400 font-pixel text-xs">
          SCORE: <span className="text-yellow-400 font-bold">{score}</span>
        </div>
      </div>

      {/* Main Play Area */}
      <div
        ref={playAreaRef}
        className={`relative flex-1 bg-gradient-to-b ${currentBgTheme} overflow-hidden flex flex-col justify-between p-2.5 sm:p-4 border-b-4 border-black touch-none`}
      >
        {/* Room Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between p-4 select-none">
          <div className="flex justify-between items-start">
            <div className="w-20 h-16 border-2 border-white/40 bg-white/5 flex items-center justify-center text-[10px]">
              🪟 ROOM #{roomsCleaned + 1}
            </div>
            <div className="w-24 h-12 border-2 border-white/40 bg-white/5 flex items-center justify-center text-[10px]">
              🖼️ POSTER
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="w-28 h-10 border-2 border-white/40 bg-white/5 flex items-center justify-center text-[10px]">
              🛏️ BED
            </div>
            <div className="w-32 h-8 border-2 border-white/40 bg-white/5 flex items-center justify-center text-[10px]">
              🪵 DESK
            </div>
          </div>
        </div>

        {/* Feedback Popup Banner */}
        {feedback && (
          <div
            className={`absolute top-2 left-1/2 -translate-x-1/2 z-40 px-4 py-2 border-2 border-black font-pixel text-xs font-bold shadow-[4px_4px_0_0_#000] animate-bounce ${
              feedback.type === 'room'
                ? 'bg-yellow-400 text-slate-950 scale-110'
                : feedback.type === 'correct'
                ? 'bg-emerald-400 text-black'
                : 'bg-rose-500 text-white'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Helper Banner */}
        <div className="relative z-10 text-center bg-black/85 border-2 border-cyan-400/60 p-2 text-[10px] sm:text-xs text-cyan-300 font-pixel shadow-[3px_3px_0_0_#000] rounded flex items-center justify-center gap-1.5">
          <Hand className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          <span>
            {selectedItem
              ? `SELECTED: ${selectedItem.name.toUpperCase()} ➔ TAP MATCHING BOX!`
              : `ROOM #${roomsCleaned + 1}: SORT ITEMS FAST (${totalCount - remainingCount}/${totalCount})`}
          </span>
        </div>

        {/* Items Scatter Area */}
        <div className="relative flex-1 my-2 overflow-hidden border-2 border-dashed border-white/15 rounded bg-black/20 touch-none">
          {items.map((item) => {
            if (item.sorted) return null;
            const isSelected = selectedItemId === item.id;
            const isDragging = draggingItemId === item.id;

            const offsetY = isTouchDevice ? 40 : 0;

            return (
              <div
                key={item.id}
                onPointerDown={(e) => handlePointerDown(item, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                  sound.playClick();
                }}
                style={{
                  left: isDragging ? `${dragPos.x - dragOffset.x}px` : `${item.x}%`,
                  top: isDragging ? `${dragPos.y - dragOffset.y - offsetY}px` : `${item.y}%`,
                  position: isDragging ? 'fixed' : 'absolute',
                  zIndex: isDragging ? 50 : isSelected ? 30 : 20,
                  pointerEvents: isDragging ? 'none' : 'auto',
                }}
                className={`transform -translate-x-1/2 -translate-y-1/2 touch-none cursor-grab active:cursor-grabbing p-3 sm:p-3.5 bg-[#1a1a2e] border-2 shadow-[3px_3px_0_0_#000] flex flex-col items-center gap-1 transition-transform rounded ${
                  isDragging
                    ? 'scale-125 border-yellow-400 shadow-[0_0_24px_#f59e0b]'
                    : isSelected
                    ? 'border-yellow-400 scale-110 shadow-[0_0_16px_#f59e0b] ring-2 ring-yellow-400 animate-pulse'
                    : 'border-black hover:border-white'
                }`}
              >
                <div className="relative text-3xl sm:text-4xl select-none">
                  {isDragging && <span className="absolute -top-3 -left-3 text-xs animate-ping">✨</span>}
                  <span>{item.icon}</span>
                  {isDragging && <span className="absolute -bottom-3 -right-3 text-xs animate-ping">✨</span>}
                </div>
                <span className="font-pixel text-[9px] sm:text-[10px] text-white bg-black/90 px-1.5 py-0.5 rounded border border-white/20 whitespace-nowrap">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Category Box Drop Zones */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 relative z-20 touch-none">
          {CATEGORY_BOXES.map((box) => {
            const sortedInBox = items.filter((i) => i.sorted && i.category === box.id);
            const isTargeted = hoveredBox === box.id;
            const isHighlightedForSelected = selectedItemId && !draggingItemId;

            return (
              <div
                key={box.id}
                data-category-box={box.id}
                onClick={() => {
                  if (selectedItemId) {
                    sortItemToCategory(selectedItemId, box.id);
                  }
                }}
                className={`${box.bgColor} border-4 ${box.borderColor} p-2.5 sm:p-3 shadow-[4px_4px_0_0_#000] flex flex-col items-center justify-between cursor-pointer rounded transition-all touch-none min-h-[72px] sm:min-h-[84px] ${
                  isTargeted
                    ? `scale-105 brightness-150 border-white ${box.glowColor} shadow-[0_0_20px_rgba(255,255,255,0.8)]`
                    : isHighlightedForSelected
                    ? 'border-yellow-300 animate-pulse ring-2 ring-yellow-400/50'
                    : 'hover:brightness-125'
                }`}
              >
                <div className={`font-pixel text-[10px] sm:text-xs ${box.color} font-bold uppercase flex items-center gap-1`}>
                  <span>{box.icon}</span>
                  <span>{box.label}</span>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-1 my-1 min-h-[28px]">
                  {sortedInBox.length === 0 ? (
                    <span className="text-[9px] sm:text-[10px] text-white/50 italic font-pixel">
                      {isHighlightedForSelected ? 'TAP TO PLACE!' : 'DROP HERE'}
                    </span>
                  ) : (
                    sortedInBox.map((si) => (
                      <span key={si.id} className="text-sm sm:text-base" title={si.name}>
                        {si.icon}
                      </span>
                    ))
                  )}
                </div>

                <div className="text-[9px] text-white/70 font-bold font-pixel">
                  {sortedInBox.length} ITEMS
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
