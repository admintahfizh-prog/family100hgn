/**
 * FAMILY 100 – SPECIAL HARI GURU NASIONAL (HGN)
 * Multi-Device Architecture (Vercel + Firebase Firestore):
 *  - `/`   -> Pure IFP Display (Soal, Hasil Survei, Kelompok — tanpa kode MC)
 *  - `/mc` -> Secret PIN-protected MC Control Dashboard
 */

import { useEffect, useState } from 'react';
import { FirebaseProvider, AuthGate } from './contexts/FirebaseAuthContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { IfpDisplayPage } from './pages/IfpDisplayPage.tsx';
import { McControlPage } from './pages/McControlPage.tsx';

function getRouteInfo(): { mode: 'ifp' | 'mc'; pin?: string; stage?: string } {
  if (typeof window === 'undefined') return { mode: 'ifp' };
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const pinParam = params.get('pin') || undefined;
  const stageParam = params.get('stage') || undefined;

  if (path.startsWith('/mc') || params.get('mode') === 'mc') {
    return { mode: 'mc', pin: pinParam, stage: stageParam };
  }
  return { mode: 'ifp', pin: pinParam, stage: stageParam };
}

export default function App() {
  const [route, setRoute] = useState(getRouteInfo);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRouteInfo());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToIfp = () => {
    const stageQuery = route.stage ? `?stage=${encodeURIComponent(route.stage)}` : '';
    window.history.pushState({}, '', `/${stageQuery}`);
    setRoute((prev) => ({ mode: 'ifp', stage: prev.stage }));
  };

  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AuthGate
          title={route.mode === 'mc' ? 'Kontrol MC Family 100 HGN' : 'Family 100 – Special HGN'}
          subtitle={
            route.mode === 'mc'
              ? 'Masuk dengan akun Google untuk menghubungkan dashboard MC secara real-time dengan layar IFP melalui Firebase.'
              : 'Masuk dengan akun Google untuk menghubungkan layar IFP ke Firebase Firestore dan sinkronisasi dengan perangkat MC.'
          }
        >
          {route.mode === 'mc' ? (
            <McControlPage
              initialPinFromUrl={route.pin}
              initialStageFromUrl={route.stage}
              onNavigateToIfp={navigateToIfp}
            />
          ) : (
            <IfpDisplayPage initialStageFromUrl={route.stage} />
          )}
        </AuthGate>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
