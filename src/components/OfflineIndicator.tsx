import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  translations: any;
  isRtl: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ translations, isRtl }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:right-auto z-50 flex items-center gap-3 rounded-2xl bg-amber-500 border border-amber-600 px-4 py-3 text-slate-950 font-bold text-xs shadow-2xl transition-all duration-300 animate-bounce ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
      </span>
      <WifiOff className="w-5 h-5 flex-shrink-0" />
      <span>{translations.offlineMode}</span>
    </div>
  );
};
