import React, { useState } from 'react';
import { GameCategory, GameDifficulty, GameInfo } from '../types';
import { GameCard } from './GameCard';
import { Gamepad2, Search, Sparkles, ArrowRight, Gauge } from 'lucide-react';
import { sound } from '../utils/sound';

interface GameMenuProps {
  games: GameInfo[];
  onPlayGame: (gameId: string) => void;
  isHomePage?: boolean;
  onNavigateToGames?: () => void;
}

const CATEGORIES: GameCategory[] = ['ALL', 'ARCADE', 'PUZZLE', 'CASUAL', 'REACTION'];
const DIFFICULTIES: Array<'ALL' | GameDifficulty> = ['ALL', 'Easy', 'Medium', 'Hard'];

export const GameMenu: React.FC<GameMenuProps> = ({
  games,
  onPlayGame,
  isHomePage = false,
  onNavigateToGames,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | GameDifficulty>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = games.filter((game) => {
    const matchesCategory =
      selectedCategory === 'ALL' || game.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === 'ALL' || game.difficulty === selectedDifficulty;
    const matchesSearch =
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const displayedGames = isHomePage ? filteredGames.slice(0, 10) : filteredGames;

  return (
    <section id="game-menu" className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
      {/* Menu Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase">
          <span className="text-cyan-400 font-bold">// ARCADE CATALOG</span>
          <span className="text-white/40">
            [{isHomePage ? `TOP 10 OF ${games.length}` : `${filteredGames.length} GAMES AVAILABLE`}]
          </span>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="SEARCH MINI GAMES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a2e] border-2 border-white/20 focus:border-cyan-400 pl-9 pr-3 py-1.5 font-mono text-xs text-white placeholder-white/40 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono uppercase flex-wrap">
        <span className="bg-white text-black px-2 py-1 font-bold">FILTER:</span>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat);
              }}
              className={`px-4 py-1 border-2 font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'border-white bg-white text-black'
                  : 'border-white/20 text-white/80 hover:border-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Difficulty Level Filter Buttons */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono uppercase flex-wrap">
        <span className="bg-cyan-500 text-black px-2 py-1 font-bold flex items-center gap-1">
          <Gauge className="w-3.5 h-3.5" /> LEVEL:
        </span>
        {DIFFICULTIES.map((diff) => {
          const isSelected = selectedDifficulty === diff;
          return (
            <button
              key={diff}
              onClick={() => {
                sound.playClick();
                setSelectedDifficulty(diff);
              }}
              className={`px-4 py-1 border-2 font-bold transition-all cursor-pointer ${
                isSelected
                  ? diff === 'Easy'
                    ? 'border-green-400 bg-green-400 text-black'
                    : diff === 'Medium'
                    ? 'border-yellow-400 bg-yellow-400 text-black'
                    : diff === 'Hard'
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-white bg-white text-black'
                  : 'border-white/20 text-white/80 hover:border-white'
              }`}
            >
              {diff}
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      {displayedGames.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedGames.map((game) => (
              <GameCard key={game.id} game={game} onPlayGame={onPlayGame} />
            ))}
          </div>

          {/* Show More Button (Only on Home page when there are more games or to view full catalog) */}
          {isHomePage && onNavigateToGames && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  sound.playClick();
                  onNavigateToGames();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="pixel-btn group bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-xs sm:text-sm px-8 py-4 border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] flex items-center gap-3 transition-all cursor-pointer active:translate-y-1"
              >
                <Gamepad2 className="w-5 h-5 text-slate-950" />
                <span>SHOW MORE GAMES ({games.length} TOTAL)</span>
                <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-[#1a1a2e] border-4 border-black p-8 shadow-[4px_4px_0_0_#000]">
          <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-spin" />
          <p className="font-pixel text-sm text-yellow-400 mb-2">NO MINI GAMES FOUND</p>
          <p className="font-retro text-xs text-slate-400">
            Try clearing your search query or selecting another category filter!
          </p>
        </div>
      )}
    </section>
  );
};
