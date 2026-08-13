import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Lock, User, CheckCircle, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { sound } from '../../utils/sound';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalView,
    unverifiedEmail,
    authError,
    authLoading,
    closeAuthModal,
    openAuthModal,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resendVerificationEmail,
  } = useAuth();

  // Form States
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [resendSent, setResendSent] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    await loginWithEmail(emailOrUsername, loginPassword);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    await registerWithEmail(regUsername, regEmail, regPassword, regConfirmPassword);
  };

  const handleResend = async () => {
    sound.playClick();
    const success = await resendVerificationEmail();
    if (success) {
      setResendSent(true);
      setTimeout(() => setResendSent(false), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#18182c] border-4 border-black p-6 sm:p-8 shadow-[10px_10px_0_0_#000] text-white font-mono">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            closeAuthModal();
          }}
          className="absolute top-4 right-4 p-1.5 bg-rose-600 hover:bg-rose-500 text-white border-2 border-black cursor-pointer shadow-[2px_2px_0_0_#000]"
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-block p-2 bg-yellow-400 text-black font-pixel text-xl border-2 border-black mb-2 shadow-[3px_3px_0_0_#000]">
            🕹️
          </div>
          <h2 className="font-pixel text-xl sm:text-2xl text-yellow-400 uppercase tracking-wide">
            {authModalView === 'LOGIN' && 'LOGIN TO GAMEPLACE'}
            {authModalView === 'REGISTER' && 'CREATE ACCOUNT'}
            {authModalView === 'VERIFY_EMAIL' && 'CHECK YOUR EMAIL'}
          </h2>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-4 p-3 bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs flex items-start gap-2 shadow-[2px_2px_0_0_#000]">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* VIEW 1: LOGIN */}
        {authModalView === 'LOGIN' && (
          <div className="space-y-5">
            {/* Primary Google Login */}
            <button
              onClick={loginWithGoogle}
              disabled={authLoading}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 border-3 border-black py-3 px-4 font-pixel text-xs sm:text-sm flex items-center justify-center gap-3 cursor-pointer shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{authLoading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 border-t-2 border-white/20"></div>
              <span className="font-pixel text-[10px] text-white/50 uppercase">OR</span>
              <div className="flex-1 border-t-2 border-white/20"></div>
            </div>

            {/* Email / Username Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-pixel text-yellow-400 mb-1">
                  EMAIL / USERNAME
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="user@email.com or username"
                    className="w-full bg-slate-900 border-2 border-black pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0_0_#000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-pixel text-yellow-400 mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border-2 border-black pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0_0_#000]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-3 border-black py-2.5 font-pixel text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                <span>{authLoading ? 'SIGNING IN...' : 'LOGIN WITH EMAIL'}</span>
              </button>
            </form>

            <div className="text-center pt-2 border-t border-white/10">
              <span className="text-xs text-slate-400">Don't have an account? </span>
              <button
                onClick={() => {
                  sound.playClick();
                  openAuthModal('REGISTER');
                }}
                className="text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: REGISTER */}
        {authModalView === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-pixel text-yellow-400 mb-1">
                USERNAME
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. hanzen_pixel"
                  className="w-full bg-slate-900 border-2 border-black pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0_0_#000]"
                />
              </div>
              <span className="text-[10px] text-slate-400">3-20 characters (letters, numbers, _)</span>
            </div>

            <div>
              <label className="block text-xs font-pixel text-yellow-400 mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="user@email.com"
                  className="w-full bg-slate-900 border-2 border-black pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0_0_#000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-pixel text-yellow-400 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border-2 border-black pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0_0_#000]"
                />
              </div>
              <span className="text-[10px] text-slate-400">At least 8 chars (1 letter & 1 number)</span>
            </div>

            <div>
              <label className="block text-xs font-pixel text-yellow-400 mb-1">
                CONFIRM PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border-2 border-black pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-[2px_2px_0_0_#000]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-3 border-black py-2.5 font-pixel text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 mt-2"
            >
              <span>{authLoading ? 'CREATING ACCOUNT...' : 'REGISTER ACCOUNT'}</span>
            </button>

            <div className="text-center pt-2 border-t border-white/10">
              <span className="text-xs text-slate-400">Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  openAuthModal('LOGIN');
                }}
                className="text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: VERIFY EMAIL */}
        {authModalView === 'VERIFY_EMAIL' && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-amber-950/40 border-2 border-amber-500/60 rounded-none text-amber-300 text-xs leading-relaxed shadow-[3px_3px_0_0_#000]">
              <p className="mb-2 font-pixel text-yellow-400 text-sm">CHECK YOUR EMAIL</p>
              <p className="mb-2">We sent a verification link to:</p>
              <p className="font-bold text-cyan-300 bg-black/60 py-1.5 px-3 border border-amber-500/30 break-all mb-2">
                {unverifiedEmail || 'your email address'}
              </p>
              <p className="text-[11px] text-slate-300">
                Please verify your email before continuing to unlock full ranking & score saving features.
              </p>
            </div>

            {resendSent && (
              <div className="p-2 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Verification email sent! Check your inbox.</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleResend}
                disabled={authLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-3 border-black py-2.5 font-pixel text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${authLoading ? 'animate-spin' : ''}`} />
                <span>{authLoading ? 'SENDING...' : 'RESEND EMAIL'}</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  openAuthModal('LOGIN');
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white border-3 border-black py-2.5 font-pixel text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0_0_#000]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK TO LOGIN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
