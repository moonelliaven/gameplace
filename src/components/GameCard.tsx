import React, { useState } from 'react';
import { GameInfo } from '../types';
import { Play } from 'lucide-react';
import { getHighScoreForGame } from '../utils/scores';
import { sound } from '../utils/sound';
import { GameThumbnail } from './GameThumbnail';

interface GameCardProps {
  game: GameInfo;
  onPlayGame: (gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlayGame }) => {
  const highScore = getHighScoreForGame(game.id);
  const [hasImageError, setHasImageError] = useState(false);

  const difficultyColor =
    game.difficulty === 'Hard'
      ? 'bg-red-600'
      : game.difficulty === 'Medium'
      ? 'bg-yellow-600'
      : 'bg-green-600';

  return (
    <div
      onClick={() => {
        sound.playClick();
        onPlayGame(game.id);
      }}
      className="bg-[#1a1a2e] border-4 border-black p-4 flex flex-col justify-between gap-3 hover:bg-[#252545] hover:border-yellow-400 transition-all relative group cursor-pointer shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#facc15]"
    >
      {/* 16:9 Thumbnail Container */}
      <div className="relative aspect-video w-full bg-black border-2 border-black/80 overflow-hidden group-hover:scale-[1.02] transition-transform duration-200">
        {!hasImageError ? (
          <GameThumbnail gameId={game.id} />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-yellow-400 text-3xl font-pixel">
            🕹️
          </div>
        )}

        {/* Play Overlay on Hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
          <div className="bg-yellow-400 text-slate-950 font-pixel text-xs px-4 py-2 border-2 border-black flex items-center gap-2 shadow-[3px_3px_0_0_#000] animate-bounce">
            <Play className="w-4 h-4 fill-slate-950" />
            <span>PLAY NOW</span>
          </div>
        </div>
      </div>

      {/* Title & Difficulty Badge */}
      <div className="flex justify-between items-start gap-2 mt-1">
        <h3 className="font-pixel text-sm sm:text-base font-bold text-yellow-400 uppercase tracking-wide group-hover:text-yellow-300">
          {game.name}
        </h3>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 text-white font-bold uppercase shrink-0 border border-black ${difficultyColor}`}
        >
          {game.difficulty}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-2">
        {game.description}
      </p>

      {/* Card Footer: Top Score & Category */}
      <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-center text-xs font-mono">
        <span className="text-cyan-400 font-bold">
          TOP: {highScore > 0 ? highScore.toLocaleString() : 0}
        </span>
        <span className="font-bold uppercase text-white/70">
          {game.category}
        </span>
      </div>
    </div>
  );
};
