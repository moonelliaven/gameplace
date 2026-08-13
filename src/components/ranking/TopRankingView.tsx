import React, { useState, useEffect } from 'react';
import { GameInfo } from '../../types';
import { GAMES_LIST } from '../../data/gamesData';
import { getGlobalLeaderboard, getGameLeaderboard, UserProfile } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Medal, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { sound } from '../../utils/sound';

interface TopRankingViewProps {
  onPlayGame: (gameId: string) => void;
}

export const TopRankingView: React.FC<TopRankingViewProps> = ({ onPlayGame }) => {
  const { userProfile, openAuthModal } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [leaderboardData, setLeaderboardData] = useState<
    { id?: string; rank: number; name: string; avatar: string; points: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'ALL') {
        const top = await getGlobalLeaderboard(50);
        const mapped = top.map((user, index) => ({
          id: user.id,
          rank: index + 1,
          name: user.display_name || user.username,
          avatar: user.avatar_url || '👾',
          points: user.total_points || 0,
        }));
        setLeaderboardData(mapped);
      } else {
        const top = await getGameLeaderboard(tab, 50);
        const mapped = top.map((entry, index) => ({
          id: entry.user_id,
          rank: index + 1,
          name: entry.username,
          avatar: entry.avatar_url || '🎮',
          points: entry.score,
        }));
        setLeaderboardData(mapped);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedTab);
  }, [selectedTab]);

  const currentGame = GAMES_LIST.find((g) => g.id === selectedTab);

  // User's own rank calculation
  const userRankEntry = userProfile
    ? leaderboardData.find((entry) => entry.id === userProfile.id)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6 font-mono text-white animate-fade-in">
      {/* Leaderboard Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#18182c] border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>// GLOBAL ARCADE LEADERBOARD</span>
          </div>
          <h1 className="font-pixel text-2xl sm:text-3xl text-yellow-400 text-glow-yellow uppercase">
            TOP RANKING
          </h1>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => {
            sound.playClick();
            fetchLeaderboard(selectedTab);
          }}
          disabled={loading}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-xs px-4 py-2 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-[#18182c] border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center gap-2 text-xs font-pixel text-cyan-400 mb-3">
          <Filter className="w-4 h-4" />
          <span>SELECT RANKING CATEGORY:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setSelectedTab('ALL');
            }}
            className={`px-3 py-1.5 border-2 border-black font-pixel text-xs cursor-pointer transition-all shadow-[2px_2px_0_0_#000] ${
              selectedTab === 'ALL'
                ? 'bg-yellow-400 text-slate-950 font-bold scale-105'
                : 'bg-slate-900 text-white/80 hover:bg-slate-800'
            }`}
          >
            ⭐ ALL POINTS
          </button>

          {GAMES_LIST.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                sound.playClick();
                setSelectedTab(game.id);
              }}
              className={`px-3 py-1.5 border-2 border-black font-pixel text-[11px] cursor-pointer transition-all shadow-[2px_2px_0_0_#000] ${
                selectedTab === game.id
                  ? 'bg-cyan-400 text-slate-950 font-bold scale-105'
                  : 'bg-slate-900 text-white/80 hover:bg-slate-800'
              }`}
            >
              {game.name}
            </button>
          ))}
        </div>
      </div>

      {/* Current User's Own Rank Card */}
      {userProfile ? (
        <div className="bg-slate-900 border-4 border-cyan-400 p-4 shadow-[4px_4px_0_0_#000] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-xs text-cyan-400 uppercase font-bold">
              YOUR RANK:
            </span>
            <span className="bg-cyan-400 text-slate-950 font-pixel text-sm px-2.5 py-1 border-2 border-black">
              #{userRankEntry ? userRankEntry.rank : 'UNRANKED'}
            </span>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xl">
                {userProfile.avatar_url?.startsWith('http') ? (
                  <img
                    src={userProfile.avatar_url}
                    alt=""
                    className="w-6 h-6 rounded-full inline-block border border-white"
                  />
                ) : (
                  userProfile.avatar_url || '👾'
                )}
              </span>
              <span className="font-pixel text-sm text-yellow-400">
                {userProfile.display_name || userProfile.username}
              </span>
            </div>
          </div>

          <div className="font-pixel text-sm text-yellow-300">
            {selectedTab === 'ALL'
              ? `${userProfile.total_points.toLocaleString()} POINTS`
              : userRankEntry
              ? `${userRankEntry.points.toLocaleString()} POINTS`
              : 'NO SCORE YET'}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-950/40 border-2 border-yellow-500/60 p-4 shadow-[3px_3px_0_0_#000] flex flex-wrap items-center justify-between gap-4">
          <span className="font-pixel text-xs text-yellow-300">
            Guest scores are not saved to the global ranking.
          </span>
          <button
            onClick={() => openAuthModal('LOGIN')}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-xs px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer"
          >
            LOGIN TO SAVE SCORE
          </button>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-[#18182c] border-4 border-black p-4 sm:p-6 shadow-[6px_6px_0_0_#000]">
        <div className="border-b-2 border-white/20 pb-3 mb-4 flex justify-between items-center font-pixel text-xs text-yellow-400">
          <span>
            {selectedTab === 'ALL'
              ? 'TOP PLAYERS (ALL POINTS)'
              : `${currentGame?.name || 'GAME'} LEADERBOARD`}
          </span>
          <span className="text-[10px] text-slate-400">
            {leaderboardData.length} PLAYERS
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center font-pixel text-yellow-400 animate-pulse">
            LOADING LEADERBOARD...
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-pixel text-xs">
            NO SCORES RECORDED YET. BE THE FIRST TO PLAY!
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboardData.map((item) => {
              const isTop1 = item.rank === 1;
              const isTop2 = item.rank === 2;
              const isTop3 = item.rank === 3;

              let badge = `#${item.rank}`;
              let rowStyle = 'bg-slate-900/80 border-slate-800';

              if (isTop1) {
                badge = '🥇 1ST';
                rowStyle =
                  'bg-yellow-950/60 border-yellow-400 text-yellow-300 shadow-[3px_3px_0_0_#eab308]';
              } else if (isTop2) {
                badge = '🥈 2ND';
                rowStyle =
                  'bg-slate-800 border-slate-300 text-slate-200 shadow-[3px_3px_0_0_#cbd5e1]';
              } else if (isTop3) {
                badge = '🥉 3RD';
                rowStyle =
                  'bg-amber-950/60 border-amber-600 text-amber-300 shadow-[3px_3px_0_0_#d97706]';
              }

              return (
                <div
                  key={`${item.id}-${item.rank}`}
                  className={`border-2 p-3 sm:p-4 flex items-center justify-between gap-4 transition-transform hover:scale-[1.01] ${rowStyle}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Rank Badge */}
                    <div className="w-12 text-center font-pixel text-xs sm:text-sm shrink-0 font-bold">
                      {badge}
                    </div>

                    {/* Avatar */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black/60 border-2 border-black flex items-center justify-center text-lg sm:text-xl shrink-0 overflow-hidden">
                      {item.avatar?.startsWith('http') ? (
                        <img
                          src={item.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{item.avatar || '🎮'}</span>
                      )}
                    </div>

                    {/* Display Name */}
                    <div className="font-pixel text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">
                      {item.name}
                    </div>
                  </div>

                  {/* Points */}
                  <div className="font-pixel text-sm sm:text-base text-yellow-400 font-bold shrink-0">
                    {item.points.toLocaleString()}
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">
                      PTS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
