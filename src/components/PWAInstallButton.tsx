import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

interface PWAInstallButtonProps {
  translations: any;
  isRtl: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ translations, isRtl }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed or dismissed, do not render
  if (isInstalled || isDismissed) {
    return null;
  }

  // Render prompt bar if installable via beforeinstallprompt
  if (isInstallable) {
    return (
      <div className="bg-slate-900 border-b border-slate-800 text-white p-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-xl text-slate-950 flex-shrink-0 animate-pulse">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h4 className="font-bold text-sm text-slate-100">{translations.installApp}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{translations.installDesc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={install}
              className="flex items-center justify-center gap-2 bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs py-2 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 whitespace-nowrap w-full md:w-auto"
            >
              <Download className="w-4 h-4" />
              {translations.installApp}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render iOS guide button and modal
  if (isIOS) {
    return (
      <>
        <div className="bg-slate-900 border-b border-slate-800 text-white p-4 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2.5 rounded-xl text-slate-950 flex-shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <h4 className="font-bold text-sm text-slate-100">{translations.installApp}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{translations.installDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center justify-center gap-2 bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs py-2 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 whitespace-nowrap w-full md:w-auto"
              >
                <Download className="w-4 h-4" />
                {translations.installApp}
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-100">{translations.iosInstallTitle}</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className={`space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {translations.iosInstallGuide}
                </p>
                <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-center justify-center gap-3 text-xs text-amber-400">
                  <Smartphone className="w-5 h-5 flex-shrink-0 animate-bounce" />
                  <span>تطبيق ويب ذكي خفيف ومباشر</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-sm font-bold text-slate-100 transition-all transform active:scale-95"
              >
                {translations.close}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
