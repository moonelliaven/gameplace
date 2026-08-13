import { GameInfo } from '../types';

export const GAMES_LIST: GameInfo[] = [
  {
    id: 'pixel-aim',
    name: 'PIXEL AIM',
    description: 'Quickly click random pixel targets before they vanish. Keep the combo streak alive!',
    category: 'ARCADE',
    difficulty: 'Medium',
    color: 'border-rose-500 bg-rose-950/40 text-rose-400',
    bgColor: 'from-rose-900/60 to-purple-900/60',
    iconName: 'Crosshair'
  },
  {
    id: 'clean-room',
    name: 'CLEAN ROOM',
    description: 'Clean as many messy pixel rooms as possible within 30 seconds! Drag or tap items fast.',
    category: 'CASUAL',
    difficulty: 'Easy',
    color: 'border-emerald-500 bg-emerald-950/40 text-emerald-400',
    bgColor: 'from-emerald-900/60 to-teal-900/60',
    iconName: 'Sparkles'
  },
  {
    id: 'catch-it',
    name: 'CATCH IT!',
    description: 'Move your pixel basket left and right to catch fruits and stars. Watch out for bombs!',
    category: 'ARCADE',
    difficulty: 'Medium',
    color: 'border-amber-500 bg-amber-950/40 text-amber-400',
    bgColor: 'from-amber-900/60 to-orange-900/60',
    iconName: 'ShoppingBag'
  },
  {
    id: 'light-up',
    name: 'LIGHT UP',
    description: 'Memorize the flashing sequence of pixel bulbs and repeat it correctly across 10 levels.',
    category: 'PUZZLE',
    difficulty: 'Medium',
    color: 'border-yellow-500 bg-yellow-950/40 text-yellow-400',
    bgColor: 'from-yellow-900/60 to-amber-900/60',
    iconName: 'Lightbulb'
  },
  {
    id: 'pixel-pop',
    name: 'PIXEL POP',
    description: 'Pop floating pixel balloons! Catch golden balloons for big points and dodge bomb balloons.',
    category: 'ARCADE',
    difficulty: 'Easy',
    color: 'border-pink-500 bg-pink-950/40 text-pink-400',
    bgColor: 'from-pink-900/60 to-fuchsia-900/60',
    iconName: 'PartyPopper'
  },
  {
    id: 'fast-food',
    name: 'FAST FOOD',
    description: 'Serve pixel customers their food orders accurately before time runs out. Speed cashier!',
    category: 'REACTION',
    difficulty: 'Hard',
    color: 'border-orange-500 bg-orange-950/40 text-orange-400',
    bgColor: 'from-orange-900/60 to-red-900/60',
    iconName: 'Utensils'
  },
  {
    id: 'pixel-break',
    name: 'PIXEL BREAK',
    description: 'Break pixel blocks in the arcade room! Hit golden blocks for extra points and avoid bombs.',
    category: 'ARCADE',
    difficulty: 'Easy',
    color: 'border-purple-500 bg-purple-950/40 text-purple-400',
    bgColor: 'from-purple-900/60 to-indigo-900/60',
    iconName: 'Zap'
  },
  {
    id: 'pixel-snake',
    name: 'PIXEL SNAKE',
    description: 'The timeless classic! Guide your pixel snake to eat apples and golden stars without hitting walls or yourself.',
    category: 'ARCADE',
    difficulty: 'Medium',
    color: 'border-lime-500 bg-lime-950/40 text-lime-400',
    bgColor: 'from-lime-900/60 to-green-900/60',
    iconName: 'SquareDot'
  },
  // 20 NEW GAMES BELOW
  {
    id: 'flappy-pixel',
    name: 'FLAPPY PIXEL',
    description: 'Tap or press space to flap wings and steer your pixel bird safely between pipe obstacles!',
    category: 'ARCADE',
    difficulty: 'Medium',
    color: 'border-yellow-400 bg-yellow-950/40 text-yellow-300',
    bgColor: 'from-yellow-900/60 to-amber-900/60',
    iconName: 'Bird'
  },
  {
    id: 'space-defender',
    name: 'SPACE DEFENDER',
    description: 'Command your starship! Blast waves of invading pixel aliens and dodge their laser fire.',
    category: 'ARCADE',
    difficulty: 'Hard',
    color: 'border-indigo-400 bg-indigo-950/40 text-indigo-300',
    bgColor: 'from-indigo-900/60 to-purple-900/60',
    iconName: 'Rocket'
  },
  {
    id: 'pixel-runner',
    name: 'PIXEL RUNNER',
    description: 'Infinite side-runner! Jump over cacti hazards and duck under flying pixel birds.',
    category: 'ARCADE',
    difficulty: 'Easy',
    color: 'border-green-400 bg-green-950/40 text-green-300',
    bgColor: 'from-green-900/60 to-emerald-900/60',
    iconName: 'Footprints'
  },
  {
    id: 'memory-match',
    name: 'MEMORY MATCH',
    description: 'Test your brain power! Flip and match all pairs of 8-bit arcade icons before time expires.',
    category: 'PUZZLE',
    difficulty: 'Easy',
    color: 'border-sky-400 bg-sky-950/40 text-sky-300',
    bgColor: 'from-sky-900/60 to-blue-900/60',
    iconName: 'Brain'
  },
  {
    id: 'pixel-jump',
    name: 'PIXEL JUMP',
    description: 'Bounce skyward on pixel platforms! Collect stars and avoid crumbling cloud steps.',
    category: 'ARCADE',
    difficulty: 'Medium',
    color: 'border-cyan-400 bg-cyan-950/40 text-cyan-300',
    bgColor: 'from-cyan-900/60 to-teal-900/60',
    iconName: 'ArrowUp'
  },
  {
    id: 'whack-a-pixel',
    name: 'WHACK A PIXEL',
    description: 'Speed reflexes! Whack pixel monsters popping out of grid holes before they retreat.',
    category: 'REACTION',
    difficulty: 'Medium',
    color: 'border-rose-400 bg-rose-950/40 text-rose-300',
    bgColor: 'from-rose-900/60 to-pink-900/60',
    iconName: 'Hammer'
  },
  {
    id: 'pixel-stack',
    name: 'PIXEL STACK',
    description: 'Tower block builder! Time your taps to stack sliding blocks perfectly on top of each other.',
    category: 'CASUAL',
    difficulty: 'Easy',
    color: 'border-violet-400 bg-violet-950/40 text-violet-300',
    bgColor: 'from-violet-900/60 to-purple-900/60',
    iconName: 'Layers'
  },
  {
    id: 'math-dash',
    name: 'MATH DASH',
    description: 'Rapid-fire speed math! Solve math equations within 3 seconds: tap TRUE or FALSE.',
    category: 'PUZZLE',
    difficulty: 'Medium',
    color: 'border-fuchsia-400 bg-fuchsia-950/40 text-fuchsia-300',
    bgColor: 'from-fuchsia-900/60 to-pink-900/60',
    iconName: 'Calculator'
  },
  {
    id: 'pixel-racer',
    name: 'PIXEL RACER',
    description: 'Retro top-down highway speed racing! Steer across 3 lanes to dodge oncoming traffic.',
    category: 'ARCADE',
    difficulty: 'Hard',
    color: 'border-red-400 bg-red-950/40 text-red-300',
    bgColor: 'from-red-900/60 to-orange-900/60',
    iconName: 'Car'
  },
  {
    id: 'color-switch',
    name: 'COLOR SWITCH',
    description: 'Bounce your color pixel ball up through rotating obstacles matching your current color!',
    category: 'REACTION',
    difficulty: 'Hard',
    color: 'border-amber-400 bg-amber-950/40 text-amber-300',
    bgColor: 'from-amber-900/60 to-yellow-900/60',
    iconName: 'Palette'
  },
  {
    id: 'pixel-pong',
    name: 'PIXEL PONG',
    description: 'Classic arcade ping-pong! Control your paddle and rally the pixel ball past the AI.',
    category: 'ARCADE',
    difficulty: 'Medium',
    color: 'border-teal-400 bg-teal-950/40 text-teal-300',
    bgColor: 'from-teal-900/60 to-emerald-900/60',
    iconName: 'Disc'
  },
  {
    id: 'simon-says',
    name: 'SIMON SAYS',
    description: 'Repeat the pattern! Watch the sequence of glowing arcade pads and replay it in order.',
    category: 'PUZZLE',
    difficulty: 'Easy',
    color: 'border-blue-400 bg-blue-950/40 text-blue-300',
    bgColor: 'from-blue-900/60 to-indigo-900/60',
    iconName: 'Grid'
  },
  {
    id: 'pixel-mines',
    name: 'PIXEL MINES',
    description: 'Retro minefield sweeper! Uncover safe grid squares without detonating hidden pixel mines.',
    category: 'PUZZLE',
    difficulty: 'Hard',
    color: 'border-zinc-400 bg-zinc-950/40 text-zinc-300',
    bgColor: 'from-zinc-900/60 to-stone-900/60',
    iconName: 'Bomb'
  },
  {
    id: 'bubble-shooter',
    name: 'BUBBLE SHOOTER',
    description: 'Aim & launch colored bubbles! Match 3 or more of the same color to pop the grid.',
    category: 'CASUAL',
    difficulty: 'Medium',
    color: 'border-pink-400 bg-pink-950/40 text-pink-300',
    bgColor: 'from-pink-900/60 to-rose-900/60',
    iconName: 'CircleDot'
  },
  {
    id: 'pixel-bowling',
    name: 'PIXEL BOWLING',
    description: 'Arcade bowling! Adjust your lane position, aim angle, and power gauge for a STRIKE!',
    category: 'CASUAL',
    difficulty: 'Easy',
    color: 'border-amber-400 bg-amber-950/40 text-amber-300',
    bgColor: 'from-amber-900/60 to-orange-900/60',
    iconName: 'Target'
  },
  {
    id: 'word-scramble',
    name: 'WORD SCRAMBLE',
    description: '8-bit retro word puzzle! Unscramble arcade gaming terms before the fuse burns out.',
    category: 'PUZZLE',
    difficulty: 'Medium',
    color: 'border-emerald-400 bg-emerald-950/40 text-emerald-300',
    bgColor: 'from-emerald-900/60 to-green-900/60',
    iconName: 'Type'
  },
  {
    id: 'pixel-dodge',
    name: 'PIXEL DODGE',
    description: '360° survival dodgeball! Pilot your ship in open space to dodge incoming meteor swarms.',
    category: 'REACTION',
    difficulty: 'Hard',
    color: 'border-purple-400 bg-purple-950/40 text-purple-300',
    bgColor: 'from-purple-900/60 to-pink-900/60',
    iconName: 'ShieldAlert'
  },
  {
    id: 'pixel-slicer',
    name: 'PIXEL SLICER',
    description: 'Slice flying pixel fruits! Swipe or drag across the screen and avoid slicing explosive bombs.',
    category: 'REACTION',
    difficulty: 'Medium',
    color: 'border-orange-400 bg-orange-950/40 text-orange-300',
    bgColor: 'from-orange-900/60 to-amber-900/60',
    iconName: 'Scissors'
  },
  {
    id: 'pixel-golf',
    name: 'PIXEL GOLF',
    description: 'Mini-golf challenge! Aim direction & stroke power to sink the pixel ball in minimal shots.',
    category: 'CASUAL',
    difficulty: 'Medium',
    color: 'border-lime-400 bg-lime-950/40 text-lime-300',
    bgColor: 'from-lime-900/60 to-emerald-900/60',
    iconName: 'Flag'
  },
  {
    id: 'pixel-maze',
    name: 'PIXEL MAZE',
    description: 'Explore pixel dungeons! Collect all golden keys and reach the exit portal before time expires.',
    category: 'PUZZLE',
    difficulty: 'Hard',
    color: 'border-indigo-400 bg-indigo-950/40 text-indigo-300',
    bgColor: 'from-indigo-900/60 to-cyan-900/60',
    iconName: 'Compass'
  }
];
