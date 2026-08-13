import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GAMES_LIST } from '../../data/gamesData';
import { getUserGameStats, getGlobalLeaderboard } from '../../lib/firebase';
import { Trophy, LogOut, Sparkles, Gamepad2, Flame, Award, ArrowLeft } from 'lucide-react';
import { sound } from '../../utils/sound';

interface UserProfileViewProps {
  onPlayGame: (gameId: string) => void;
  onBackToHome: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onPlayGame, onBackToHome }) => {
  const { userProfile, logout } = useAuth();
  const [gameStats, setGameStats] = useState<Record<string, { bestScore: number; gamesPlayed: number }>>({});
  const [globalRank, setGlobalRank] = useState<number | string>('...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    async function loadProfileData() {
      setLoading(true);
      try {
        // Fetch stats per game
        const stats = await getUserGameStats(userProfile!.id);
        setGameStats(stats);

        // Calculate global rank
        const topPlayers = await getGlobalLeaderboard(100);
        const rankIndex = topPlayers.findIndex((p) => p.id === userProfile!.id);
        if (rankIndex !== -1) {
          setGlobalRank(rankIndex + 1);
        } else {
          setGlobalRank('>100');
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [userProfile]);

  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center font-mono">
        <p className="text-yellow-400 font-pixel mb-4">Please login to view your profile.</p>
        <button
          onClick={onBackToHome}
          className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 border-2 border-black font-pixel text-xs cursor-pointer"
        >
          BACK TO HOME
        </button>
      </div>
    );
  }

  // Calculate totals
  let totalGamesPlayed = 0;
  let overallBestScore = 0;
  let favoriteGameId = '';
  let highestGameScore = 0;

  (Object.entries(gameStats) as [string, { bestScore: number; gamesPlayed: number }][]).forEach(([gId, stat]) => {
    totalGamesPlayed += stat.gamesPlayed;
    if (stat.bestScore > overallBestScore) {
      overallBestScore = stat.bestScore;
    }
    if (stat.bestScore > highestGameScore) {
      highestGameScore = stat.bestScore;
      favoriteGameId = gId;
    }
  });

  const favoriteGame = GAMES_LIST.find((g) => g.id === favoriteGameId);

  const handleLogout = async () => {
    sound.playClick();
    await logout();
    onBackToHome();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8 font-mono text-white animate-fade-in">
      {/* Top Banner Navigation */}
      <div className="flex justify-between items-center bg-[#18182c] border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
        <button
          onClick={() => {
            sound.playClick();
            onBackToHome();
          }}
          className="bg-slate-800 hover:bg-slate-700 text-white font-pixel text-xs px-3 py-2 border-2 border-black flex items-center gap-2 cursor-pointer shadow-[2px_2px_0_0_#000]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>

        <h2 className="font-pixel text-lg sm:text-xl text-yellow-400 tracking-wider">
          USER PROFILE
        </h2>

        <button
          onClick={handleLogout}
          className="bg-rose-600 hover:bg-rose-500 text-white font-pixel text-xs px-3 py-2 border-2 border-black flex items-center gap-2 cursor-pointer shadow-[2px_2px_0_0_#000]"
        >
          <LogOut className="w-4 h-4" />
          <span>LOG OUT</span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-[#18182c] border-4 border-black p-6 sm:p-8 shadow-[6px_6px_0_0_#000] flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left relative overflow-hidden">
        {/* Background Pixel Accent */}
        <div className="absolute -right-8 -bottom-8 text-8xl opacity-10 pointer-events-none select-none">
          🎮
        </div>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-yellow-400 border-4 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center text-4xl overflow-hidden text-slate-950 font-pixel">
            {userProfile.avatar_url?.startsWith('http') ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{userProfile.avatar_url || '👾'}</span>
            )}
          </div>
          {userProfile.email_verified && (
            <span
              className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-pixel text-[10px] px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_0_#000]"
              title="Verified Account"
            >
              VERIFIED
            </span>
          )}
        </div>

        {/* Name & Primary Stats */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="font-pixel text-2xl sm:text-3xl text-yellow-400 uppercase tracking-tight">
              {userProfile.display_name || userProfile.username}
            </h1>
            <p className="text-xs text-cyan-400 font-bold mt-1">
              @{userProfile.username}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">TOTAL POINTS</span>
              <span className="font-pixel text-xl text-yellow-400">{userProfile.total_points?.toLocaleString() || 0}</span>
            </div>

            <div className="bg-slate-900 border-2 border-black p-3 shadow-[2px_2px_0_0_#000]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">GLOBAL RANK</span>
              <span className="font-pixel text-xl text-cyan-400">#{globalRank}</span>
            </div>

            <div className="bg-slate-900 border-2 border-black p-3 shadow-[2px_2px_0_0_#000] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">GAMES PLAYED</span>
              <span className="font-pixel text-xl text-pink-400">{totalGamesPlayed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#18182c] border-4 border-black p-5 shadow-[4px_4px_0_0_#000] flex items-center gap-4">
          <div className="p-3 bg-yellow-400/10 border-2 border-yellow-400 text-yellow-400 font-pixel text-xl">
            🏆
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">ALL-TIME BEST SCORE</span>
            <span className="font-pixel text-xl text-yellow-400">{overallBestScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[#18182c] border-4 border-black p-5 shadow-[4px_4px_0_0_#000] flex items-center gap-4">
          <div className="p-3 bg-cyan-400/10 border-2 border-cyan-400 text-cyan-400 font-pixel text-xl">
            🔥
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">BEST GAME</span>
            <span className="font-pixel text-sm text-cyan-300 uppercase">
              {favoriteGame ? favoriteGame.name : 'NO GAMES YET'}
            </span>
          </div>
        </div>
      </div>

      {/* GAME PERFORMANCE BREAKDOWN */}
      <div className="bg-[#18182c] border-4 border-black p-6 shadow-[6px_6px_0_0_#000] space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-white/10 pb-3">
          <Gamepad2 className="w-5 h-5 text-yellow-400" />
          <h3 className="font-pixel text-lg text-yellow-400">GAME PERFORMANCE</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES_LIST.map((game) => {
            const stat = gameStats[game.id] || { bestScore: 0, gamesPlayed: 0 };
            return (
              <div
                key={game.id}
                className="bg-slate-900 border-2 border-black p-4 flex flex-col justify-between gap-3 shadow-[3px_3px_0_0_#000]"
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-pixel text-xs text-yellow-400 uppercase">{game.name}</h4>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">{game.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800 pt-2 font-mono">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">BEST SCORE</span>
                    <span className="font-bold text-yellow-300">{stat.bestScore.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">PLAYED</span>
                    <span className="font-bold text-white/80">{stat.gamesPlayed}x</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onPlayGame(game.id);
                  }}
                  className="w-full mt-1 bg-yellow-400 hover:bg-yellow-300 text-black font-pixel text-[10px] py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer"
                >
                  PLAY AGAIN
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
