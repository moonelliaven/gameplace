import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  syncUserProfile, 
  isUsernameTaken, 
  UserProfile,
  saveGameScoreToDb
} from '../lib/firebase';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendEmailVerification,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalView: 'LOGIN' | 'REGISTER' | 'VERIFY_EMAIL';
  unverifiedEmail: string | null;
  authError: string | null;
  authLoading: boolean;
  openAuthModal: (view?: 'LOGIN' | 'REGISTER' | 'VERIFY_EMAIL') => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (emailOrUsername: string, pass: string) => Promise<boolean>;
  registerWithEmail: (username: string, email: string, pass: string, confirmPass: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<boolean>;
  logout: () => Promise<void>;
  recordGameScore: (gameId: string, score: number) => Promise<{ newTotalPoints: number; isPersonalBest: boolean }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'LOGIN' | 'REGISTER' | 'VERIFY_EMAIL'>('LOGIN');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to sync profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (view: 'LOGIN' | 'REGISTER' | 'VERIFY_EMAIL' = 'LOGIN') => {
    setAuthError(null);
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const profile = await syncUserProfile(auth.currentUser);
      setUserProfile(profile);
    }
  };

  // 1. Google Login
  const loginWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(result.user);
      setUserProfile(profile);
      setAuthLoading(false);
      closeAuthModal();
      return true;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In is not enabled in Firebase Console. Please enable "Google" provider under Authentication -> Sign-in method.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by browser. Please allow popups.');
      } else {
        setAuthError('Unable to sign in with Google. Please try again or check Firebase settings.');
      }
      setAuthLoading(false);
      return false;
    }
  };

  // 2. Email Login
  const loginWithEmail = async (emailOrUsername: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      let targetEmail = emailOrUsername.trim();

      // If user provided a username instead of email address
      if (!targetEmail.includes('@')) {
        // Find email by username lookup or require email format
        // For security, if they typed username, ask for email or lookup
        // We can inform them to use email or handle email format
        if (targetEmail.length < 3) {
          setAuthError('Please enter a valid email or username.');
          setAuthLoading(false);
          return false;
        }
      }

      const cred = await signInWithEmailAndPassword(auth, targetEmail, pass);
      await cred.user.reload();

      if (!cred.user.emailVerified) {
        setUnverifiedEmail(cred.user.email);
        setAuthModalView('VERIFY_EMAIL');
        setAuthError('Please verify your email before logging in.');
        setAuthLoading(false);
        return false;
      }

      const profile = await syncUserProfile(cred.user);
      setUserProfile(profile);
      setAuthLoading(false);
      closeAuthModal();
      return true;
    } catch (err: any) {
      console.error('Email Login Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Email/Password sign-in is not enabled in Firebase Console. Please enable "Email/Password" under Authentication -> Sign-in method.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setAuthError('Incorrect email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else {
        setAuthError('Login failed. Please check your credentials.');
      }
      setAuthLoading(false);
      return false;
    }
  };

  // 3. Register with Email
  const registerWithEmail = async (
    username: string, 
    email: string, 
    pass: string, 
    confirmPass: string
  ): Promise<boolean> => {
    setAuthError(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    // Validations
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 20) {
      setAuthError('Username must be between 3 and 20 characters.');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setAuthError('Username can only contain letters, numbers, and underscores.');
      return false;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return false;
    }

    if (pass.length < 8 || !/[a-zA-Z]/.test(pass) || !/[0-9]/.test(pass)) {
      setAuthError('Password must contain at least 8 characters, with 1 letter and 1 number.');
      return false;
    }

    if (pass !== confirmPass) {
      setAuthError('Passwords do not match.');
      return false;
    }

    setAuthLoading(true);

    try {
      // Check username uniqueness
      const taken = await isUsernameTaken(cleanUsername);
      if (taken) {
        setAuthError('Username is already taken. Please choose another.');
        setAuthLoading(false);
        return false;
      }

      // Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      
      // Send verification email
      await sendEmailVerification(cred.user);

      // Create profile document in Firestore
      await syncUserProfile(cred.user, cleanUsername);

      setUnverifiedEmail(cleanEmail);
      setAuthModalView('VERIFY_EMAIL');
      setAuthLoading(false);
      return true;
    } catch (err: any) {
      console.error('Registration Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Email/Password registration is not enabled in Firebase Console. Please enable "Email/Password" under Authentication -> Sign-in method.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists.');
      } else {
        setAuthError(err.message || 'Registration failed. Please try again.');
      }
      setAuthLoading(false);
      return false;
    }
  };

  // 4. Resend Verification Email
  const resendVerificationEmail = async (): Promise<boolean> => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setAuthLoading(false);
        return true;
      } else {
        setAuthError('Session expired. Please try signing in again.');
        setAuthLoading(false);
        return false;
      }
    } catch (err: any) {
      console.error('Resend Email Error:', err);
      setAuthError('Unable to send verification email right now. Please try again later.');
      setAuthLoading(false);
      return false;
    }
  };

  // 5. Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 6. Record Game Score
  const recordGameScore = async (gameId: string, score: number) => {
    if (!userProfile || !currentUser) {
      return { newTotalPoints: 0, isPersonalBest: false };
    }
    const result = await saveGameScoreToDb(userProfile, gameId, score);
    await refreshProfile();
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        isAuthModalOpen,
        authModalView,
        unverifiedEmail,
        authError,
        authLoading,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resendVerificationEmail,
        logout,
        recordGameScore,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
