import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Share, MoreVertical, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isIOS: boolean;
  onTriggerNativeInstall: () => Promise<boolean>;
}

const InstallGuideModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isIOS,
  onTriggerNativeInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white text-gray-900 border border-[#D4AF37]/40 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#161616] text-white px-5 py-4 flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-serif text-lg font-bold tracking-wide">
              Instalar VALIANA GOLD
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            aria-label="Cerrar guía"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col items-center text-center">
            <img
              src="/assets/aistudio/Logotipo_de_lujo_Valiana_Gold_6646a32e.webp"
              alt="VALIANA GOLD"
              className="w-24 h-24 object-contain rounded-xl border border-[#D4AF37]/30 bg-white p-1.5 shadow-sm mb-2.5"
            />
            <p className="text-xs text-gray-600 leading-relaxed">
              Agrega nuestro catálogo como acceso directo en la pantalla principal de tu celular para ver nuevos diseños y hacer pedidos al instante.
            </p>
          </div>

          {isInstallable ? (
            <button
              type="button"
              onClick={async () => {
                const ok = await onTriggerNativeInstall();
                if (ok) {
                  onClose();
                }
              }}
              className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#B8941F] text-black font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Instalar en mi Celular</span>
            </button>
          ) : isIOS ? (
            <div className="bg-[#FAF8F5] rounded-xl border border-[#ECE5D8] p-3.5 space-y-2 text-xs text-gray-800">
              <p className="font-bold text-gray-900">En iPhone o iPad (Safari):</p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#D4AF37]/20 text-[#8B6D16] font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span>
                  Si abriste desde WhatsApp, toca el ícono de brújula para <strong>Abrir en Safari</strong>.
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#D4AF37]/20 text-[#8B6D16] font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span>
                  Toca <strong>Compartir</strong> <Share className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" /> abajo y elige <strong>Agregar a inicio</strong>.
                </span>
              </p>
            </div>
          ) : (
            <div className="bg-[#FAF8F5] rounded-xl border border-[#ECE5D8] p-3.5 space-y-2 text-xs text-gray-800">
              <p className="font-bold text-gray-900">En celular Android (Chrome):</p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#D4AF37]/20 text-[#8B6D16] font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span>
                  Si abriste desde WhatsApp, toca <strong>⋮</strong> <MoreVertical className="inline w-3.5 h-3.5 text-gray-600" /> y elige <strong>Abrir en Chrome</strong>.
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#D4AF37]/20 text-[#8B6D16] font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span>
                  Toca el menú <strong>⋮</strong> arriba y selecciona <strong>Instalar aplicación</strong> o <strong>Agregar a la pantalla principal</strong>.
                </span>
              </p>
            </div>
          )}

          {!isInstallable && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs transition-colors"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (!isInstallable && !isMobile) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border border-[#D4AF37]/60 bg-[#202020] hover:bg-[#D4AF37] text-[#F4E8C1] hover:text-black text-xs font-semibold transition-all shadow-xs"
        title="Instalar App en la pantalla principal"
        aria-label="Instalar App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      <InstallGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        isInstallable={isInstallable}
        isIOS={isIOS}
        onTriggerNativeInstall={install}
      />
    </>
  );
};

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('valiana_install_banner_dismissed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#instalar' && !isInstalled) {
        setShowGuide(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [isInstalled]);

  if (isInstalled) {
    return null;
  }

  const handleBannerAction = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuide(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('valiana_install_banner_dismissed', '1');
    } catch {
      // Ignore storage failures
    }
  };

  return (
    <>
      {!dismissed && (isInstallable || isMobile) && (
        <div className="bg-[#1A1A1A] text-white border-b border-[#D4AF37]/30 px-3 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/assets/aistudio/Logotipo_de_lujo_Valiana_Gold_6646a32e.webp"
                alt="VALIANA GOLD"
                className="w-9 h-9 rounded-lg bg-white object-contain p-0.5 border border-[#D4AF37] flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#F4E8C1] truncate">
                  Guarda VALIANA GOLD en tu celular
                </p>
                <p className="text-[10px] text-gray-300 truncate">
                  Acceso directo en tu pantalla principal con un toque
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleBannerAction}
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#B8941F] text-black text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-md text-gray-400 hover:text-white"
                aria-label="Ocultar aviso de instalación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <InstallGuideModal
        isOpen={showGuide}
        onClose={() => {
          setShowGuide(false);
          if (window.location.hash === '#instalar') {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        isInstallable={isInstallable}
        isIOS={isIOS}
        onTriggerNativeInstall={install}
      />
    </>
  );
};
