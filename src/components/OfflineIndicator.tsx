import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#161616] border border-[#D4AF37]/60 px-3 py-2 text-xs font-medium text-[#F4E8C1] shadow-xl">
      <WifiOff className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
      <span>Sin conexión — Mostrando catálogo guardado</span>
    </div>
  );
};
