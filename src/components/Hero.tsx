import React from 'react';
import { Play, Sparkles, Zap, Clock, ShieldCheck } from 'lucide-react';
import { PixelMascot } from './PixelMascot';
import { sound } from '../utils/sound';

interface HeroProps {
  onPlayNow: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onPlayNow }) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-center bg-cyan-900/20 border-4 border-cyan-500/50 p-6 sm:p-8 shadow-[inset_0_0_20px_rgba(0,255,255,0.2)] relative">
        {/* Left Column: Text & CTA */}
        <div className="max-w-xl text-left">
          <p className="text-cyan-400 text-xs sm:text-sm mb-2 uppercase tracking-widest font-mono">
            // SYSTEM ACCESS GRANTED
          </p>

          <h2 className="text-3xl sm:text-5xl font-black font-pixel leading-tight mb-3 text-white">
            WELCOME TO <span className="text-yellow-400">GAMEPLACE!</span>
          </h2>

          <p className="text-base sm:text-lg opacity-80 mb-6 font-sans italic text-slate-200">
            "Small Games. Big Fun." Play tiny pixel games whenever you want. Fast, colorful, and instantly playable arcade games!
          </p>

          <button
            onClick={() => {
              sound.playClick();
              onPlayNow();
            }}
            className="bg-yellow-400 text-black px-8 py-3.5 border-b-4 border-r-4 border-black hover:translate-x-1 hover:translate-y-1 hover:border-0 transition-all font-black text-lg sm:text-xl font-mono flex items-center gap-2 cursor-pointer active:translate-y-2"
          >
            <span>PLAY NOW</span>
            <Play className="w-5 h-5 fill-black" />
          </button>
        </div>

        {/* Right Column: Mascot frame */}
        <div className="mt-8 lg:mt-0 flex justify-center">
          <PixelMascot />
        </div>
      </div>
    </section>
  );
};
