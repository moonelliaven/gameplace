import React from 'react';

interface GameThumbnailProps {
  gameId: string;
}

export const GameThumbnail: React.FC<GameThumbnailProps> = ({ gameId }) => {
  switch (gameId) {
    case 'pixel-aim':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          {/* Background */}
          <rect width="320" height="180" fill="#1e1028" />
          <path d="M0 0 h320 v180 h-320 z" fill="none" stroke="#e11d48" strokeWidth="4" />
          {/* Grid lines */}
          <line x1="0" y1="90" x2="320" y2="90" stroke="#4c1d95" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="160" y1="0" x2="160" y2="180" stroke="#4c1d95" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* Targets */}
          <circle cx="80" cy="60" r="24" fill="#fb7185" stroke="#ffe4e6" strokeWidth="3" />
          <circle cx="80" cy="60" r="14" fill="#f43f5e" />
          <circle cx="80" cy="60" r="6" fill="#ffffff" />

          <circle cx="230" cy="110" r="18" fill="#fb7185" stroke="#ffe4e6" strokeWidth="2" />
          <circle cx="230" cy="110" r="10" fill="#f43f5e" />
          <circle cx="230" cy="110" r="4" fill="#ffffff" />

          {/* Crosshair on main target */}
          <circle cx="80" cy="60" r="32" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="40" y1="60" x2="120" y2="60" stroke="#facc15" strokeWidth="2" />
          <line x1="80" y1="20" x2="80" y2="100" stroke="#facc15" strokeWidth="2" />

          {/* Pop score indicator */}
          <text x="110" y="45" fill="#facc15" fontSize="14" fontFamily="monospace" fontWeight="bold">+100</text>

          {/* HUD Overlay */}
          <rect x="10" y="10" width="100" height="24" fill="#000000" opacity="0.8" rx="2" />
          <text x="16" y="26" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">SCORE: 850</text>
          
          <rect x="220" y="10" width="90" height="24" fill="#000000" opacity="0.8" rx="2" />
          <text x="226" y="26" fill="#f43f5e" fontSize="11" fontFamily="monospace" fontWeight="bold">TIME: 18s</text>
        </svg>
      );

    case 'clean-room':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          {/* Pixel Room Background */}
          <rect width="320" height="130" fill="#0f172a" />
          <rect y="130" width="320" height="50" fill="#334155" />
          {/* Baseboard line */}
          <line x1="0" y1="130" x2="320" y2="130" stroke="#000000" strokeWidth="3" />

          {/* Bed */}
          <rect x="20" y="80" width="90" height="50" fill="#0284c7" stroke="#000000" strokeWidth="2" />
          <rect x="25" y="70" width="30" height="20" fill="#ffffff" stroke="#000000" strokeWidth="2" />
          <rect x="20" y="100" width="90" height="30" fill="#38bdf8" />

          {/* Messy items */}
          {/* Sock */}
          <path d="M140 140 h15 v10 h-8 v8 h-7 z" fill="#f43f5e" stroke="#000" strokeWidth="1" />
          <text x="142" y="135" fill="#facc15" fontSize="12">✨</text>

          {/* Pizza Box */}
          <rect x="180" y="142" width="24" height="12" fill="#d97706" stroke="#000" strokeWidth="1" />
          <path d="M184 142 l8 -8 l8 8 z" fill="#b45309" />

          {/* Trash Box Container */}
          <rect x="250" y="105" width="45" height="40" fill="#10b981" stroke="#000" strokeWidth="2" />
          <text x="258" y="130" fill="#ffffff" fontSize="16" fontFamily="monospace">♻️</text>

          {/* HUD Overlay */}
          <rect x="10" y="10" width="110" height="24" fill="#000000" opacity="0.8" />
          <text x="16" y="26" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">CLEAN: 75%</text>
        </svg>
      );

    case 'catch-it':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          {/* Sky Background */}
          <rect width="320" height="180" fill="#0f172a" />
          <rect y="150" width="320" height="30" fill="#1e293b" />

          {/* Clouds */}
          <ellipse cx="60" cy="30" rx="30" ry="12" fill="#334155" />
          <ellipse cx="260" cy="40" rx="40" ry="15" fill="#334155" />

          {/* Falling items */}
          {/* Apple */}
          <circle cx="100" cy="70" r="10" fill="#ef4444" stroke="#000" strokeWidth="2" />
          <rect x="99" y="56" width="3" height="5" fill="#78350f" />

          {/* Star */}
          <polygon points="170,40 174,52 186,52 176,60 180,72 170,64 160,72 164,60 154,52 166,52" fill="#facc15" stroke="#000" strokeWidth="1" />

          {/* Falling Bomb */}
          <circle cx="230" cy="90" r="9" fill="#171717" stroke="#ef4444" strokeWidth="2" />
          <line x1="230" y1="81" x2="235" y2="75" stroke="#f59e0b" strokeWidth="2" />

          {/* Basket */}
          <rect x="135" y="140" width="50" height="25" fill="#d97706" stroke="#000000" strokeWidth="3" />
          <line x1="135" y1="148" x2="185" y2="148" stroke="#78350f" strokeWidth="2" />

          {/* HUD Overlay */}
          <rect x="10" y="10" width="100" height="24" fill="#000000" opacity="0.8" />
          <text x="16" y="26" fill="#fbbf24" fontSize="11" fontFamily="monospace" fontWeight="bold">SCORE: 630</text>
        </svg>
      );

    case 'light-up':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          {/* Dark Background */}
          <rect width="320" height="180" fill="#111827" />

          {/* Bulbs Display */}
          <circle cx="65" cy="80" r="24" fill="#ef4444" stroke="#000" strokeWidth="3" opacity="0.4" />
          <circle cx="128" cy="80" r="24" fill="#f59e0b" stroke="#fff" strokeWidth="4" />
          <circle cx="192" cy="80" r="24" fill="#10b981" stroke="#000" strokeWidth="3" opacity="0.4" />
          <circle cx="255" cy="80" r="24" fill="#3b82f6" stroke="#000" strokeWidth="3" opacity="0.4" />

          {/* Glow effect on active bulb */}
          <circle cx="128" cy="80" r="32" fill="#f59e0b" opacity="0.25" />

          {/* Level Prompt */}
          <rect x="110" y="135" width="100" height="26" fill="#000" stroke="#f59e0b" strokeWidth="2" />
          <text x="122" y="152" fill="#facc15" fontSize="11" fontFamily="monospace" fontWeight="bold">LEVEL 05</text>
        </svg>
      );

    case 'pixel-pop':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          {/* Sky */}
          <rect width="320" height="180" fill="#1e1b4b" />

          {/* Balloons */}
          {/* Red Balloon */}
          <ellipse cx="70" cy="80" rx="18" ry="24" fill="#ec4899" stroke="#000" strokeWidth="2" />
          <polygon points="70,104 66,110 74,110" fill="#ec4899" />

          {/* Gold Balloon */}
          <ellipse cx="160" cy="50" rx="20" ry="26" fill="#eab308" stroke="#fff" strokeWidth="3" />
          <polygon points="160,76 156,82 164,82" fill="#eab308" />

          {/* Cyan Balloon */}
          <ellipse cx="240" cy="95" rx="16" ry="22" fill="#06b6d4" stroke="#000" strokeWidth="2" />

          {/* HUD */}
          <rect x="10" y="10" width="100" height="24" fill="#000000" opacity="0.8" />
          <text x="16" y="26" fill="#f472b6" fontSize="11" fontFamily="monospace" fontWeight="bold">POPS: 42</text>
        </svg>
      );

    case 'fast-food':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          {/* Restaurant Background */}
          <rect width="320" height="100" fill="#7c2d12" />
          <rect y="100" width="320" height="80" fill="#9a3412" />
          {/* Counter Table */}
          <rect y="110" width="320" height="25" fill="#f97316" stroke="#000" strokeWidth="3" />

          {/* Fast Food Character / Chef (Preserving Character Identity) */}
          <circle cx="160" cy="70" r="18" fill="#fde047" stroke="#000" strokeWidth="2" />
          <rect x="145" y="40" width="30" height="18" fill="#ffffff" stroke="#000" strokeWidth="2" />
          {/* Eyes */}
          <rect x="153" y="66" width="4" height="4" fill="#000" />
          <rect x="163" y="66" width="4" height="4" fill="#000" />
          {/* Smile */}
          <path d="M154 76 Q160 82 166 76" stroke="#000" strokeWidth="2" fill="none" />

          {/* Food items on counter */}
          <text x="60" y="105" fontSize="22">🍔</text>
          <text x="100" y="105" fontSize="22">🍟</text>
          <text x="220" y="105" fontSize="22">🥤</text>

          {/* Customer Order Bubble */}
          <rect x="210" y="20" width="90" height="35" fill="#ffffff" stroke="#000" strokeWidth="2" rx="4" />
          <text x="220" y="42" fontSize="18">🍔 + 🍟</text>

          {/* HUD */}
          <rect x="10" y="10" width="100" height="24" fill="#000000" opacity="0.8" />
          <text x="16" y="26" fill="#fb923c" fontSize="11" fontFamily="monospace" fontWeight="bold">SERVED: 15</text>
        </svg>
      );

    case 'pixel-break':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          {/* Background */}
          <rect width="320" height="180" fill="#0f0728" />

          {/* Pixel Blocks */}
          <rect x="30" y="30" width="50" height="16" fill="#a855f7" stroke="#000" strokeWidth="2" />
          <rect x="85" y="30" width="50" height="16" fill="#ec4899" stroke="#000" strokeWidth="2" />
          <rect x="140" y="30" width="50" height="16" fill="#eab308" stroke="#fff" strokeWidth="2" />
          <rect x="195" y="30" width="50" height="16" fill="#3b82f6" stroke="#000" strokeWidth="2" />
          <rect x="250" y="30" width="40" height="16" fill="#10b981" stroke="#000" strokeWidth="2" />

          <rect x="30" y="52" width="50" height="16" fill="#10b981" stroke="#000" strokeWidth="2" />
          <rect x="85" y="52" width="50" height="16" fill="#a855f7" stroke="#000" strokeWidth="2" />
          <rect x="195" y="52" width="50" height="16" fill="#ec4899" stroke="#000" strokeWidth="2" />

          {/* Ball */}
          <circle cx="160" cy="110" r="6" fill="#facc15" stroke="#000" strokeWidth="2" />

          {/* Paddle */}
          <rect x="125" y="150" width="70" height="12" fill="#c084fc" stroke="#000" strokeWidth="2" />

          {/* HUD */}
          <rect x="10" y="10" width="90" height="20" fill="#000000" opacity="0.8" />
          <text x="14" y="24" fill="#c084fc" fontSize="10" fontFamily="monospace" fontWeight="bold">COMBO x3</text>
        </svg>
      );

    case 'pixel-snake':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          {/* Classic Pixel Grid */}
          <rect width="320" height="180" fill="#14532d" />
          <path d="M0 0 h320 v180 h-320 z" fill="none" stroke="#22c55e" strokeWidth="4" />

          {/* Snake segments */}
          <rect x="80" y="90" width="16" height="16" fill="#86efac" stroke="#14532d" strokeWidth="2" />
          <rect x="96" y="90" width="16" height="16" fill="#86efac" stroke="#14532d" strokeWidth="2" />
          <rect x="112" y="90" width="16" height="16" fill="#86efac" stroke="#14532d" strokeWidth="2" />
          <rect x="112" y="74" width="16" height="16" fill="#86efac" stroke="#14532d" strokeWidth="2" />
          <rect x="128" y="74" width="16" height="16" fill="#22c55e" stroke="#000" strokeWidth="2" />
          {/* Eye */}
          <rect x="138" y="78" width="3" height="3" fill="#000" />

          {/* Apple */}
          <rect x="200" y="74" width="16" height="16" fill="#ef4444" stroke="#000" strokeWidth="2" />

          {/* HUD */}
          <rect x="10" y="10" width="100" height="24" fill="#000000" opacity="0.8" />
          <text x="16" y="26" fill="#4ade80" fontSize="11" fontFamily="monospace" fontWeight="bold">SCORE: 180</text>
        </svg>
      );

    case 'pixel-stack':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#1e1b4b" />
          {[150, 120, 90, 60].map((y, i) => (
            <rect key={i} x={100 - i * 12} y={y} width={120 + i * 24} height="26" fill={['#a78bfa', '#f472b6', '#22d3ee', '#fbbf24'][i]} stroke="#000" strokeWidth="2" />
          ))}
          <rect x="100" y="30" width="120" height="26" fill="#e2e8f0" stroke="#000" strokeWidth="2" />
          <text x="160" y="182" fill="#fff" fontSize="0"> </text>
          <rect x="10" y="10" width="100" height="24" fill="#000" opacity="0.8" />
          <text x="16" y="26" fill="#c4b5fd" fontSize="11" fontFamily="monospace" fontWeight="bold">STACK: 12</text>
        </svg>
      );

    case 'math-dash':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#2e1065" />
          <rect x="60" y="55" width="200" height="50" fill="#151525" stroke="#e879f9" strokeWidth="3" />
          <text x="160" y="88" fill="#fff" fontSize="22" fontFamily="monospace" fontWeight="bold" textAnchor="middle">12 + 7 = 19</text>
          <rect x="70" y="125" width="80" height="34" fill="#10b981" stroke="#000" strokeWidth="2" />
          <text x="110" y="147" fill="#000" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle">TRUE</text>
          <rect x="170" y="125" width="80" height="34" fill="#ef4444" stroke="#000" strokeWidth="2" />
          <text x="210" y="147" fill="#fff" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle">FALSE</text>
          <rect x="10" y="10" width="90" height="24" fill="#000" opacity="0.8" />
          <text x="16" y="26" fill="#f0abfc" fontSize="11" fontFamily="monospace" fontWeight="bold">STREAK x3</text>
        </svg>
      );

    case 'pixel-racer':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#1f2937" />
          <rect x="14" width="6" height="180" fill="#fbbf24" />
          <rect x="300" width="6" height="180" fill="#fbbf24" />
          <rect x="106" y="0" width="4" height="180" fill="#e5e7eb" />
          <rect x="210" y="0" width="4" height="180" fill="#e5e7eb" />
          <rect x="130" y="30" width="60" height="110" fill="#ef4444" stroke="#000" strokeWidth="2" />
          <rect x="80" y="90" width="52" height="96" fill="#f59e0b" stroke="#000" strokeWidth="2" />
          <rect x="175" y="10" width="42" height="60" fill="#facc15" stroke="#000" strokeWidth="2" />
          <rect x="10" y="10" width="100" height="24" fill="#000" opacity="0.8" />
          <text x="16" y="26" fill="#fca5a5" fontSize="11" fontFamily="monospace" fontWeight="bold">SCORE: 240</text>
        </svg>
      );

    case 'pixel-pong':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#020617" />
          <line x1="160" y1="0" x2="160" y2="180" stroke="#ffffff" strokeWidth="2" strokeDasharray="8 10" opacity="0.4" />
          <rect x="15" y="60" width="10" height="60" fill="#22d3ee" stroke="#fff" strokeWidth="1.5" />
          <rect x="295" y="80" width="10" height="60" fill="#f472b6" stroke="#fff" strokeWidth="1.5" />
          <circle cx="160" cy="95" r="9" fill="#facc15" stroke="#fff" strokeWidth="2" />
          <text x="80" y="45" fill="#fff" fontSize="26" fontFamily="monospace" fontWeight="bold" textAnchor="middle" opacity="0.4">3</text>
          <text x="240" y="45" fill="#fff" fontSize="26" fontFamily="monospace" fontWeight="bold" textAnchor="middle" opacity="0.4">1</text>
          <rect x="10" y="10" width="90" height="20" fill="#000" opacity="0.7" />
          <text x="14" y="24" fill="#5eead4" fontSize="10" fontFamily="monospace" fontWeight="bold">PIXEL PONG</text>
        </svg>
      );

    case 'pixel-mines':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#1c1917" />
          {Array.from({ length: 40 }).map((_, i) => {
            const x = (i % 8) * 40 + 5;
            const y = Math.floor(i / 8) * 30 + 8;
            const mine = i === 6 || i === 21 || i === 35;
            const flagged = i === 13;
            return (
              <g key={i}>
                <rect x={x} y={y} width="32" height="22" fill={mine ? '#450a0a' : '#52525b'} stroke="#000" strokeWidth="1.5" />
                {mine && <circle cx={x + 16} cy={y + 11} r="5" fill="#ef4444" />}
                {flagged && <text x={x + 16} y={y + 15} fill="#f43f5e" fontSize="12" textAnchor="middle">🚩</text>}
              </g>
            );
          })}
          <rect x="10" y="10" width="100" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#d4d4d8" fontSize="10" fontFamily="monospace" fontWeight="bold">CLEAR: 24</text>
        </svg>
      );

    case 'pixel-bowling':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#713f12" />
          {[110, 140, 170].map((x, i) => (
            <circle key={i} cx={x} cy={40} r="7" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
          ))}
          {[125, 155].map((x, i) => (
            <circle key={i} cx={x} cy={62} r="7" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
          ))}
          <circle cx="140" cy="84" r="7" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
          <circle cx="160" cy="150" r="11" fill="#ef4444" stroke="#7f1d1d" strokeWidth="3" />
          <line x1="8" y1="120" x2="312" y2="120" stroke="#facc15" strokeWidth="3" />
          <rect x="10" y="10" width="100" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#fcd34d" fontSize="10" fontFamily="monospace" fontWeight="bold">FRAME 3/10</text>
        </svg>
      );

    case 'word-scramble':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#064e3b" />
          <rect x="45" y="45" width="230" height="45" fill="#151525" stroke="#fff" strokeWidth="2" />
          {['A', 'R', 'C', 'D', 'E'].map((l, i) => (
            <text key={i} x={70 + i * 32} y="75" fill="#fff" fontSize="20" fontFamily="monospace" fontWeight="bold">{l}</text>
          ))}
          {['C', 'A', 'D', 'E', 'R'].map((l, i) => (
            <rect key={i} x={62 + i * 36} y={110} width="30" height="36" fill="#fbbf24" stroke="#000" strokeWidth="2" />
          ))}
          {['C', 'A', 'D', 'E', 'R'].map((l, i) => (
            <text key={i} x={77 + i * 36} y="134" fill="#000" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{l}</text>
          ))}
          <rect x="10" y="10" width="90" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#6ee7b7" fontSize="10" fontFamily="monospace" fontWeight="bold">SCORE: 120</text>
        </svg>
      );

    case 'pixel-dodge':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#0b0b1a" />
          {[40, 90, 150, 210, 270].map((x, i) => (
            <circle key={i} cx={x} cy={(i * 37 + 20) % 170} r={7 + (i % 3) * 4} fill={['#f87171', '#fb923c', '#a78bfa', '#f472b6', '#f87171'][i]} stroke="#000" strokeWidth="2" />
          ))}
          <polygon points="160,60 175,95 160,88 145,95" fill="#22d3ee" stroke="#fff" strokeWidth="2" />
          <rect x="10" y="10" width="100" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#c4b5fd" fontSize="10" fontFamily="monospace" fontWeight="bold">SURV: 18s</text>
        </svg>
      );

    case 'pixel-golf':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#166534" />
          <rect x="100" y="0" width="40" height="180" fill="rgba(255,255,255,0.05)" />
          <circle cx="250" cy="60" r="10" fill="#020617" stroke="#fef08a" strokeWidth="3" />
          <line x1="250" y1="60" x2="250" y2="38" stroke="#fef08a" strokeWidth="2" />
          <rect x="249" y="26" width="16" height="12" fill="#ef4444" />
          <circle cx="90" cy="130" r="9" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
          <line x1="90" y1="130" x2="170" y2="95" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeDasharray="6 6" />
          <rect x="10" y="10" width="100" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#bef264" fontSize="10" fontFamily="monospace" fontWeight="bold">HOLE 4/9</text>
        </svg>
      );

    case 'pixel-maze':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#1e1b4b" />
          {[
            'M30 0 h90 v50 h60 v60 h-40 v40 h-40 v30',
            'M120 0 v50 h80 v-50',
            'M260 0 v60 h30 v120 h-60 v-60 h-40',
            'M160 110 v40 h60 v30',
          ].map((d, i) => (
            <path key={i} d={d} stroke="#818cf8" strokeWidth="3" fill="none" />
          ))}
          <rect x="25" y="75" width="18" height="18" fill="#facc15" stroke="#000" strokeWidth="1.5" />
          <rect x="290" y="25" width="20" height="20" fill="#22d3ee" stroke="#000" strokeWidth="1.5" />
          <rect x="55" y="110" width="18" height="18" fill="#facc15" />
          <rect x="24" y="22" width="18" height="18" fill="#facc15" stroke="#000" strokeWidth="2" />
          <rect x="10" y="10" width="100" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#a5b4fc" fontSize="10" fontFamily="monospace" fontWeight="bold">KEYS 2/3</text>
        </svg>
      );

    case 'flappy-pixel':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#0c4a6e" />
          <circle cx="60" cy="90" r="40" fill="#fbbf24" />
          <rect x="120" y="60" width="80" height="14" fill="#16a34a" />
          <rect x="160" y="110" width="90" height="14" fill="#16a34a" />
          <rect x="80" y="55" width="45" height="30" fill="#fff7ed" />
          <polygon points="125,55 140,70 125,85" fill="#fdba74" />
          <circle cx="95" cy="67" r="3" fill="#0f172a" />
          <rect x="10" y="10" width="120" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#fef08a" fontSize="10" fontFamily="monospace" fontWeight="bold">FLAPPY</text>
        </svg>
      );

    case 'space-defender':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#020617" />
          <circle cx="290" cy="30" r="14" fill="#e2e8f0" />
          <polygon points="160,150 130,110 145,115 160,95 175,115 190,110" fill="#22d3ee" />
          <circle cx="160" cy="115" r="4" fill="#0f172a" />
          <rect x="205" y="35" width="36" height="26" fill="#f472b6" />
          <polygon points="199,35 223,20 247,35" fill="#f472b6" />
          <circle cx="213" cy="46" r="3" fill="#fff" />
          <circle cx="233" cy="46" r="3" fill="#fff" />
          <rect x="60" y="25" width="30" height="22" fill="#4ade80" />
          <polygon points="55,25 75,12 95,25" fill="#4ade80" />
          <rect x="120" y="55" width="30" height="22" fill="#a78bfa" />
          <polygon points="115,55 135,42 155,55" fill="#a78bfa" />
          <rect x="10" y="10" width="120" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#f472b6" fontSize="10" fontFamily="monospace" fontWeight="bold">WAVE 3</text>
        </svg>
      );

    case 'pixel-runner':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#7c2d12" />
          <rect y="150" width="320" height="30" fill="#292524" />
          <rect x="0" y="60" width="320" height="8" fill="#a8a29e" />
          <rect x="40" y="128" width="18" height="24" fill="#4ade80" />
          <rect x="90" y="132" width="16" height="18" fill="#4ade80" />
          <rect x="130" y="120" width="20" height="30" fill="#4ade80" />
          <rect x="30" y="96" width="45" height="42" fill="#0f172a" />
          <rect x="25" y="92" width="16" height="8" fill="#0f172a" />
          <circle cx="52" cy="88" r="3" fill="#facc15" />
          <rect x="10" y="10" width="120" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#fde68a" fontSize="10" fontFamily="monospace" fontWeight="bold">SCORE 1200</text>
        </svg>
      );

    case 'memory-match':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#134e4a" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={40 + c * 62}
                y={25 + r * 48}
                width="52"
                height="38"
                fill={r === 1 && (c === 0 || c === 3) ? '#22d3ee' : '#0f172a'}
                stroke="#f8fafc"
                strokeWidth="2"
              />
            ))
          )}
          <text x="120" y="118" fill="#22d3ee" fontSize="16" fontWeight="bold">♥</text>
          <text x="270" y="118" fill="#22d3ee" fontSize="16" fontWeight="bold">♥</text>
          <rect x="10" y="10" width="120" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#5eead4" fontSize="10" fontFamily="monospace" fontWeight="bold">PAIRS 2/8</text>
        </svg>
      );

    case 'pixel-jump':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#3b0764" />
          <circle cx="110" cy="140" r="30" fill="#38bdf8" />
          <rect y="160" width="320" height="20" fill="#1e293b" />
          <rect x="180" y="132" width="70" height="14" fill="#a78bfa" />
          <rect x="140" y="100" width="80" height="14" fill="#f472b6" />
          <rect x="60" y="110" width="32" height="32" fill="#fde047" stroke="#0f172a" strokeWidth="2" />
          <rect x="10" y="10" width="120" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#c4b5fd" fontSize="10" fontFamily="monospace" fontWeight="bold">LEVEL 5</text>
        </svg>
      );

    case 'whack-a-pixel':
      return (
        <svg viewBox="0 0 320 180" className="w-full h-full object-cover">
          <rect width="320" height="180" fill="#14532d" />
          <circle cx="80" cy="95" r="34" fill="#7c4a03" />
          <circle cx="160" cy="95" r="34" fill="#7c4a03" />
          <circle cx="240" cy="95" r="34" fill="#7c4a03" />
          <circle cx="160" cy="68" r="17" fill="#fb7185" stroke="#0f172a" strokeWidth="2" />
          <rect x="70" y="50" width="30" height="22" fill="#fb7185" stroke="#0f172a" strokeWidth="2" />
          <rect x="230" y="60" width="28" height="20" fill="#fb7185" stroke="#0f172a" strokeWidth="2" />
          <rect x="10" y="10" width="120" height="20" fill="#000" opacity="0.8" />
          <text x="14" y="24" fill="#86efac" fontSize="10" fontFamily="monospace" fontWeight="bold">SCORE 540</text>
        </svg>
      );

    default:
      return (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-4xl text-yellow-400">
          🎮
        </div>
      );
  }
};
