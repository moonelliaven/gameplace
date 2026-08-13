import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  total_points: number;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameScoreRecord {
  id?: string;
  user_id: string;
  username: string;
  avatar_url: string;
  game_id: string;
  score: number;
  played_at: string;
}

// Default pixel avatars for users without Google profile picture
export const DEFAULT_PIXEL_AVATARS = [
  '👾', '🤖', '🎮', '🕹️', '🐱', '🦊', '🐸', '🐼', '🐯', '🚀', '⭐', '🔥'
];

export function getRandomPixelAvatar(): string {
  const index = Math.floor(Math.random() * DEFAULT_PIXEL_AVATARS.length);
  return DEFAULT_PIXEL_AVATARS[index];
}

// Generate or fetch user profile from Firestore
export async function syncUserProfile(user: FirebaseUser, customUsername?: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const fallbackUsername = customUsername || user.displayName?.replace(/\s+/g, '_').toLowerCase() || `player_${user.uid.substring(0, 6)}`;
  const fallbackDisplayName = user.displayName || customUsername || 'Pixel Player';
  const avatarUrl = user.photoURL || getRandomPixelAvatar();

  if (userSnap.exists()) {
    const data = userSnap.data() as UserProfile;
    // Update verification status & photo if changed
    const updatedData: Partial<UserProfile> = {
      email_verified: user.emailVerified || data.email_verified,
      updated_at: new Date().toISOString()
    };
    if (user.photoURL && !data.avatar_url.startsWith('http')) {
      updatedData.avatar_url = user.photoURL;
    }
    await setDoc(userRef, updatedData, { merge: true });
    return { ...data, ...updatedData, id: user.uid };
  } else {
    // Create new profile
    const newProfile: UserProfile = {
      id: user.uid,
      username: fallbackUsername,
      display_name: fallbackDisplayName,
      email: user.email || '',
      avatar_url: avatarUrl,
      total_points: 0,
      email_verified: user.emailVerified || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

// Check if username is already taken
export async function isUsernameTaken(username: string): Promise<boolean> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username.trim().toLowerCase()));
  const snap = await getDocs(q);
  return !snap.empty;
}

// Save game score & update total points
export async function saveGameScoreToDb(
  user: UserProfile, 
  gameId: string, 
  score: number
): Promise<{ newTotalPoints: number; isPersonalBest: boolean }> {
  if (score <= 0) return { newTotalPoints: user.total_points, isPersonalBest: false };

  const playedAt = new Date().toISOString();

  // 1. Add score record
  await addDoc(collection(db, 'game_scores'), {
    user_id: user.id,
    username: user.display_name || user.username,
    avatar_url: user.avatar_url,
    game_id: gameId,
    score: score,
    played_at: playedAt
  });

  // 2. Fetch all scores for this user to calculate accurate best scores & total points
  const scoresQuery = query(collection(db, 'game_scores'), where('user_id', '==', user.id));
  const scoresSnap = await getDocs(scoresQuery);

  const bestPerGame: Record<string, number> = {};
  scoresSnap.forEach((docSnap) => {
    const data = docSnap.data() as GameScoreRecord;
    if (!bestPerGame[data.game_id] || data.score > bestPerGame[data.game_id]) {
      bestPerGame[data.game_id] = data.score;
    }
  });

  // Calculate total points = sum of highest scores across all games
  let calculatedTotalPoints = 0;
  Object.values(bestPerGame).forEach((s) => {
    calculatedTotalPoints += s;
  });

  const isPersonalBest = (bestPerGame[gameId] || 0) === score;

  // 3. Update user profile total_points
  const userRef = doc(db, 'users', user.id);
  await setDoc(userRef, {
    total_points: calculatedTotalPoints,
    updated_at: new Date().toISOString()
  }, { merge: true });

  return {
    newTotalPoints: calculatedTotalPoints,
    isPersonalBest
  };
}

// Fetch Global Leaderboard (sorted by total_points DESC)
export async function getGlobalLeaderboard(limitCount = 50): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('total_points', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const list: UserProfile[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
    });
    return list;
  } catch (err) {
    console.error('Error fetching global leaderboard:', err);
    return [];
  }
}

// Fetch Game-Specific Leaderboard (highest score per user for that game)
export async function getGameLeaderboard(gameId: string, limitCount = 50): Promise<{
  user_id: string;
  username: string;
  avatar_url: string;
  score: number;
  played_at: string;
}[]> {
  try {
    const scoresRef = collection(db, 'game_scores');
    const q = query(
      scoresRef, 
      where('game_id', '==', gameId),
      orderBy('score', 'desc'), 
      limit(100)
    );
    const snap = await getDocs(q);
    
    // Group by user_id to get top score per player
    const userBestMap = new Map<string, { user_id: string; username: string; avatar_url: string; score: number; played_at: string }>();
    
    snap.forEach((docSnap) => {
      const data = docSnap.data() as GameScoreRecord;
      if (!userBestMap.has(data.user_id) || (userBestMap.get(data.user_id)?.score || 0) < data.score) {
        userBestMap.set(data.user_id, {
          user_id: data.user_id,
          username: data.username || 'Player',
          avatar_url: data.avatar_url || '🎮',
          score: data.score,
          played_at: data.played_at
        });
      }
    });

    const result = Array.from(userBestMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount);

    return result;
  } catch (err) {
    console.error(`Error fetching leaderboard for ${gameId}:`, err);
    return [];
  }
}

// Fetch user's individual game statistics
export async function getUserGameStats(userId: string): Promise<Record<string, { bestScore: number; gamesPlayed: number }>> {
  try {
    const scoresRef = collection(db, 'game_scores');
    const q = query(scoresRef, where('user_id', '==', userId));
    const snap = await getDocs(q);

    const stats: Record<string, { bestScore: number; gamesPlayed: number }> = {};

    snap.forEach((docSnap) => {
      const data = docSnap.data() as GameScoreRecord;
      if (!stats[data.game_id]) {
        stats[data.game_id] = { bestScore: data.score, gamesPlayed: 1 };
      } else {
        stats[data.game_id].gamesPlayed += 1;
        if (data.score > stats[data.game_id].bestScore) {
          stats[data.game_id].bestScore = data.score;
        }
      }
    });

    return stats;
  } catch (err) {
    console.error('Error fetching user game stats:', err);
    return {};
  }
}
