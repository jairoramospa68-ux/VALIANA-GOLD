import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { FIREBASE_QUOTA_UPGRADE_URL } from '../firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isQuotaError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isQuotaError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const raw = error?.message || '';
    const isQuotaError =
      raw.includes('Quota exceeded') ||
      raw.includes("Free daily read units per project");
    return {
      hasError: true,
      message: raw,
      isQuotaError,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#D4AF37]/40 shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-gray-900">
              {this.state.isQuotaError
                ? 'Límite diario gratuito alcanzado'
                : 'Ocurrió un inconveniente temporal'}
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              {this.state.isQuotaError
                ? 'Se alcanzó el límite gratuito diario de lecturas en Firestore. La cuota se restablece mañana o puedes actualizar el plan en Firebase.'
                : 'Hubo un problema de conexión al cargar la información. Intenta recargar la página.'}
            </p>
            {this.state.isQuotaError && (
              <a
                href={FIREBASE_QUOTA_UPGRADE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-[#B8941F] font-semibold underline"
              >
                Ver estado de cuota en Firebase Console
              </a>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recargar tienda</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
