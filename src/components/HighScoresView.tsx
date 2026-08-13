import React, { useState } from 'react';
import { GameInfo } from '../types';
import { Trophy, RotateCcw, Sparkles } from 'lucide-react';
import { getHighScores, resetAllScores } from '../utils/scores';
import { sound } from '../utils/sound';

interface HighScoresViewProps {
  games: GameInfo[];
  onPlayGame: (gameId: string) => void;
}

export const HighScoresView: React.FC<HighScoresViewProps> = ({ games, onPlayGame }) => {
  const [scores, setScores] = useState(getHighScores());
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    sound.playBomb();
    resetAllScores();
    setScores({});
    setResetConfirm(false);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1a1a2e] border-4 border-black p-6 shadow-[4px_4px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span>// SYSTEM LEADERBOARD</span>
          </div>
          <h2 className="font-pixel text-2xl sm:text-3xl text-yellow-400 text-glow-yellow">
            HIGH SCORES
          </h2>
        </div>

        {/* Reset Button */}
        <div>
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-2 cursor-pointer font-bold transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET ALL SCORES</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-red-400 font-bold">SURE?</span>
              <button
                onClick={handleReset}
                className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs px-3 py-1 border-2 border-black cursor-pointer font-bold"
              >
                YES, RESET
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="bg-black text-white/80 font-mono text-xs px-3 py-1 border-2 border-black cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* High Scores List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => {
          const score = scores[game.id] || 0;
          return (
            <div
              key={game.id}
              className="bg-[#1a1a2e] border-4 border-black p-4 shadow-[4px_4px_0_0_#000] flex items-center justify-between gap-4 hover:bg-[#252545] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/50 border-2 border-black text-amber-400 font-pixel text-lg">
                  🏆
                </div>
                <div>
                  <h3 className="font-pixel text-sm text-yellow-400 uppercase">{game.name}</h3>
                  <span className="font-mono text-xs text-cyan-400 font-bold uppercase">{game.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="font-mono text-right">
                  <div className="text-xl font-bold text-yellow-400">{score.toLocaleString()}</div>
                  <div className="text-[10px] text-white/50">POINTS</div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onPlayGame(game.id);
                  }}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-mono text-xs px-3 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] font-bold cursor-pointer"
                >
                  PLAY
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
