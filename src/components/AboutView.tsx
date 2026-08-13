import React from 'react';
import { Info, Gamepad2, Shield, Heart, Sparkles } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      <div className="bg-[#1a1a2e] border-4 border-black p-6 sm:p-8 shadow-[6px_6px_0_0_#000]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b-4 border-black">
          <div className="w-12 h-12 bg-yellow-400 border-4 border-black shadow-[4px_4px_0_0_rgba(255,255,0,0.3)] flex items-center justify-center text-slate-950 font-pixel text-2xl">
            🕹️
          </div>
          <div>
            <h2 className="font-pixel text-2xl sm:text-3xl text-yellow-400 text-glow-yellow">
              ABOUT GAMEPLACE
            </h2>
            <p className="font-mono text-xs text-cyan-400 font-bold uppercase mt-1">// "Small Games. Big Fun."</p>
          </div>
        </div>

        {/* Content grid */}
        <div className="space-y-6 font-mono text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-yellow-400 font-pixel">GAMEPLACE</strong> is a retro arcade mini-game hub featuring 9 colorful, pixel-art games built for pure instant fun! Designed with classic arcade mechanics, every mini-game can be played in under 60 seconds with zero tutorials or complex setups.
          </p>

          {/* Features list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="bg-[#151525] border-2 border-white/20 p-4 shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center gap-2 font-pixel text-xs text-yellow-400 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>RETRO PIXEL ART</span>
              </div>
              <p className="text-xs text-white/70">
                Nostalgic 8-bit visual aesthetic with pixelated buttons, arcade borders, and synthesized Web Audio chiptune sound effects.
              </p>
            </div>

            <div className="bg-[#151525] border-2 border-white/20 p-4 shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center gap-2 font-pixel text-xs text-cyan-400 mb-2">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>26 INSTANT MINI GAMES</span>
              </div>
              <p className="text-xs text-white/70">
                Pixel Aim, Clean Room, Catch It!, Light Up, Pixel Pop, Fast Food, Pixel Break, Pixel Snake, Pixel Stack, Math Dash, Pixel Racer, and 14 more!
              </p>
            </div>

            <div className="bg-[#151525] border-2 border-white/20 p-4 shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center gap-2 font-pixel text-xs text-emerald-400 mb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>LOCAL HIGH SCORES</span>
              </div>
              <p className="text-xs text-white/70">
                All your best scores are automatically saved locally in your browser using standard HTML5 localStorage.
              </p>
            </div>

            <div className="bg-[#151525] border-2 border-white/20 p-4 shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center gap-2 font-pixel text-xs text-pink-400 mb-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <span>CROSS-PLATFORM</span>
              </div>
              <p className="text-xs text-white/70">
                Fully responsive layout supporting desktop keyboard controls (WASD / Arrows) and mobile touch buttons!
              </p>
            </div>
          </div>

          <div className="border-t-2 border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-white/50 gap-2 uppercase">
            <span>GAMEPLACE VERSION 1.0.4</span>
            <span className="text-yellow-400 font-bold">PIXEL ARCADE HUB</span>
          </div>
        </div>
      </div>
    </section>
  );
};
