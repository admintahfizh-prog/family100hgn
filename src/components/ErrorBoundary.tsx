import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Terjadi gangguan saat memuat aplikasi.',
    };
  }

  override render() {
    if (this.state.hasError) {
      let friendlyMessage =
        'Terjadi kendala koneksi atau izin akses Firebase Firestore. Silakan muat ulang halaman.';
      if (this.state.message.includes('Missing or insufficient permissions')) {
        friendlyMessage =
          'Akses Firestore ditolak oleh aturan keamanan. Pastikan akun Google sudah terverifikasi dan memiliki izin ke stage ini.';
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/60 p-6 text-center space-y-4 shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Gangguan Aplikasi</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{friendlyMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
