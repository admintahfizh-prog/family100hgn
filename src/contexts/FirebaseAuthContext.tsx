import React, { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

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
  isAuthReady: true,
  isSigningIn: false,
  authError: null,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FirebaseAuthContext.Provider
      value={{
        user: null,
        isAuthReady: true,
        isSigningIn: false,
        authError: null,
        signInWithGoogle: async () => {},
        signOutUser: async () => {},
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}

export const AuthGate: React.FC<{
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ children }) => {
  return <>{children}</>;
};
