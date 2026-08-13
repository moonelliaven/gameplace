import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { GameMenu } from './components/GameMenu';
import { GameFrame } from './components/GameFrame';
import { AboutView } from './components/AboutView';
import { GAMES_LIST } from './data/gamesData';
import { sound } from './utils/sound';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'HOME' | 'GAMES' | 'ABOUT'>('HOME');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const activeGame = GAMES_LIST.find((g) => g.id === activeGameId) || null;

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handlePlayGame = (gameId: string) => {
    setActiveGameId(gameId);
  };

  const handleExitGame = () => {
    setActiveGameId(null);
  };

  return (
    <div
      className="min-h-screen bg-[#0d0d1a] text-white flex flex-col font-mono relative overflow-x-hidden selection:bg-yellow-400 selection:text-black"
      style={{ background: 'radial-gradient(circle at center, #1a1a3a 0%, #0d0d1a 100%)' }}
    >
      {/* Immersive CRT Overlay Effect */}
      <div className="absolute inset-0 pointer-events-none crt-overlay" />

      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Body */}
      <main className="flex-1 relative z-10">
        {currentTab === 'HOME' && (
          <>
            <Hero
              onPlayNow={() => {
                const element = document.getElementById('game-menu');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setCurrentTab('GAMES');
                }
              }}
            />
            <GameMenu
              games={GAMES_LIST}
              onPlayGame={handlePlayGame}
              isHomePage={true}
              onNavigateToGames={() => setCurrentTab('GAMES')}
            />
          </>
        )}

        {currentTab === 'GAMES' && (
          <GameMenu games={GAMES_LIST} onPlayGame={handlePlayGame} isHomePage={false} />
        )}

        {currentTab === 'ABOUT' && <AboutView />}
      </main>

      {/* Active Game Overlay Frame */}
      {activeGame && (
        <GameFrame game={activeGame} onExit={handleExitGame} />
      )}

      {/* Retro Arcade Immersive Footer */}
      <footer className="border-t-4 border-[#333] bg-black py-4 px-6 md:px-8 text-[10px] uppercase tracking-widest text-white/40 font-mono flex flex-col md:flex-row items-center justify-between gap-3 relative z-10">
        <div>© 2024 GAMEPLACE STUDIO // ALL RIGHTS RESERVED</div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
            <span className="text-white/80">8,241 PLAYERS ONLINE</span>
          </span>
          <span className="text-white/80">VER 1.0.4 - PIXEL_BUILD</span>
        </div>
      </footer>
    </div>
  );
}
