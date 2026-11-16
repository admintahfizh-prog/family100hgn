import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, firebaseConfig } from '../firebase.ts';
import { ShieldCheck, LogIn, AlertTriangle, Cloud } from 'lucide-react';

interface FirebaseAuthContextValue {
  user: User | null;
  isAuthReady: boolean;
  isSigningIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue>({
  user: null,
  isAuthReady: false,
  isSigningIn: false,
  authError: null,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthReady(true);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan Google.';
      if (msg.includes('popup-closed-by-user')) {
        setAuthError('Popup login ditutup sebelum selesai. Silakan coba lagi.');
      } else if (msg.includes('unauthorized-domain')) {
        setAuthError(
          'Domain belum diizinkan di Firebase Authentication -> Authorized domains. Tambahkan domain Vercel Anda di Firebase Console.'
        );
      } else {
        setAuthError(msg);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        isAuthReady,
        isSigningIn,
        authError,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}

interface AuthGateProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ title, subtitle, children }) => {
  const { user, isAuthReady, isSigningIn, authError, signInWithGoogle, signOutUser } =
    useFirebaseAuth();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3 p-6">
        <div className="h-10 w-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-400">
          Menghubungkan autentikasi Firebase...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-400/70 shadow-[0_0_60px_rgba(245,158,11,0.2)] p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3">
            <Cloud className="w-3.5 h-3.5" />
            <span>Sinkronisasi Firebase + Vercel</span>
          </div>

          <h1 className="font-condensed font-black text-3xl text-amber-300 tracking-wide uppercase mb-1">
            {title}
          </h1>
          <p className="text-sm text-slate-400 mb-6">{subtitle}</p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSigningIn ? 'Membuka Login Google...' : 'Masuk dengan Akun Google'}</span>
          </button>

          <p className="mt-5 text-[11px] text-slate-500 leading-relaxed">
            Gunakan akun Google yang sama di Layar IFP dan Laptop MC agar papan survei, skor tim,
            dan soundboard tersinkronisasi real-time via Firestore (Project:{' '}
            <span className="text-slate-400 font-mono">{firebaseConfig.projectId}</span>).
          </p>
        </div>
      </div>
    );
  }

  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/60 p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Email Google Belum Terverifikasi</h2>
          <p className="text-xs text-slate-400">
            Aturan keamanan Firestore mewajibkan akun Google yang terverifikasi untuk membuka panggung lomba.
          </p>
          <button
            type="button"
            onClick={signOutUser}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Ganti Akun Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
