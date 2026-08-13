import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/sound';

interface HeaderProps {
  currentTab: 'HOME' | 'GAMES' | 'ABOUT';
  onSelectTab: (tab: 'HOME' | 'GAMES' | 'ABOUT') => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#151525] border-b-4 border-black px-4 sm:px-8 py-3 shadow-[0_4px_0_0_#000]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => {
            sound.playClick();
            onSelectTab('HOME');
          }}
          className="flex items-center gap-3 group cursor-pointer text-left shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-400 border-3 sm:border-4 border-black shadow-[3px_3px_0_0_rgba(255,255,0,0.3)] flex items-center justify-center text-slate-950 font-pixel text-lg sm:text-xl group-hover:scale-105 transition-transform">
            🕹️
          </div>
          <div>
            <h1 className="font-pixel text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-yellow-400 uppercase italic text-glow-yellow">
              GAMEPLACE
            </h1>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-3 sm:gap-6 md:gap-8 font-mono text-xs sm:text-sm">
          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('HOME');
            }}
            className={`pb-1 font-bold cursor-pointer transition-colors ${
              currentTab === 'HOME'
                ? 'text-cyan-400 border-b-4 border-cyan-400'
                : 'text-white/80 hover:text-cyan-400'
            }`}
          >
            HOME
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('GAMES');
            }}
            className={`pb-1 font-bold cursor-pointer transition-colors ${
              currentTab === 'GAMES'
                ? 'text-cyan-400 border-b-4 border-cyan-400'
                : 'text-white/80 hover:text-cyan-400'
            }`}
          >
            GAMES
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onSelectTab('ABOUT');
            }}
            className={`pb-1 font-bold cursor-pointer transition-colors ${
              currentTab === 'ABOUT'
                ? 'text-cyan-400 border-b-4 border-cyan-400'
                : 'text-white/80 hover:text-cyan-400'
            }`}
          >
            ABOUT
          </button>

          {/* Mute Audio Button */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-1.5 bg-[#1a1a2e] border-2 border-white/20 hover:border-white text-yellow-400 cursor-pointer transition-all shrink-0"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </nav>
      </div>
    </header>
  );
};
