import React from 'react';

export const PixelMascot: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Pixel Arcade Character Container */}
      <div className="relative animate-float">
        {/* Glow backdrop */}
        <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/20 via-pink-500/20 to-cyan-500/20 blur-xl rounded-full" />
        
        {/* Pixel Character Screen Frame */}
        <div className="relative bg-slate-950 p-3 border-4 border-black shadow-[6px_6px_0px_#000]">
          {/* CRT Grid scanline feel */}
          <div className="relative bg-indigo-950 p-4 border-2 border-indigo-500/50 rounded-none overflow-hidden">
            {/* Pixel Character SVG Grid */}
            <svg
              className="w-28 h-28 md:w-36 md:h-36 pixelated"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Antenna */}
              <rect x="7" y="0" width="2" height="2" fill="#F59E0B" />
              <rect x="6" y="2" width="4" height="1" fill="#3B82F6" />

              {/* Head / Body Base */}
              <rect x="3" y="3" width="10" height="9" fill="#8B5CF6" />
              <rect x="2" y="4" width="12" height="7" fill="#8B5CF6" />

              {/* Face Screen */}
              <rect x="4" y="4" width="8" height="5" fill="#06B6D4" />

              {/* Pixel Eyes (blinking feel) */}
              <rect x="5" y="5" width="2" height="2" fill="#000000" />
              <rect x="9" y="5" width="2" height="2" fill="#000000" />
              {/* Eye Catchlights */}
              <rect x="5" y="5" width="1" height="1" fill="#FFFFFF" />
              <rect x="9" y="5" width="1" height="1" fill="#FFFFFF" />

              {/* Mouth / Smile */}
              <rect x="6" y="8" width="4" height="1" fill="#000000" />

              {/* Arcade Controller / Buttons on Chest */}
              <rect x="4" y="10" width="8" height="3" fill="#EC4899" />
              {/* Joystick */}
              <rect x="5" y="11" width="1" height="1" fill="#F59E0B" />
              {/* Buttons */}
              <rect x="9" y="11" width="1" height="1" fill="#10B981" />
              <rect x="10" y="11" width="1" height="1" fill="#EF4444" />

              {/* Feet */}
              <rect x="3" y="13" width="3" height="2" fill="#F59E0B" />
              <rect x="10" y="13" width="3" height="2" fill="#F59E0B" />
            </svg>
          </div>
          {/* Arcade Cabinet Details */}
          <div className="mt-2 flex justify-between items-center text-[8px] font-pixel text-yellow-400 px-1">
            <span>COIN: 99</span>
            <span className="animate-pulse text-green-400">READY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
