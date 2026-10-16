import React, { useState, useEffect } from 'react';
import { Bike, Volume2, VolumeX, Eye, Download, Wifi } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playDispatchChime } from '../utils/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const MobileAppHeader: React.FC = () => {
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<WakeLockSentinel | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playDispatchChime();
    }
  };

  const toggleWakeLock = async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      alert("La fonction écran actif n'est pas supportée sur ce navigateur.");
      return;
    }

    try {
      if (wakeLockActive && wakeLockSentinel) {
        await wakeLockSentinel.release();
        setWakeLockSentinel(null);
        setWakeLockActive(false);
      } else {
        const sentinel = await navigator.wakeLock.request('screen');
        setWakeLockSentinel(sentinel);
        setWakeLockActive(true);
        sentinel.addEventListener('release', () => {
          setWakeLockActive(false);
          setWakeLockSentinel(null);
        });
      }
    } catch (err) {
      console.warn('Wake Lock request error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E4DC] px-4 py-2.5 transition-all">
      <div className="max-w-md md:max-w-5xl mx-auto flex items-center justify-between">
        {/* App Title & Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#1C1917]">Radar Moto</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900">
                0% com
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#78716C]">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{isOnline ? 'Connecté' : 'Hors-ligne'}</span>
            </div>
          </div>
        </div>

        {/* Quick Hardware Actions */}
        <div className="flex items-center gap-1.5">
          {/* Wake Lock Screen On */}
          <button
            type="button"
            onClick={toggleWakeLock}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
              wakeLockActive
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'border-[#E8E4DC] bg-[#FAF8F5] text-[#78716C] hover:text-[#1C1917]'
            }`}
            title="Garder l'écran allumé (guidage moto)"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Sound alert chime */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
              soundOn
                ? 'border-[#E8E4DC] bg-[#FAF8F5] text-amber-700'
                : 'border-[#E8E4DC] bg-[#FAF8F5] text-[#A8A29E]'
            }`}
            title="Bip sonore nouveau dispatch"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* PWA Install */}
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={install}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Installer l'app</span>
              <span className="sm:hidden">App</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              type="button"
              onClick={() => setShowIOSModal(true)}
              className="px-2.5 py-1.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5] text-xs font-semibold text-[#78716C]"
            >
              iOS
            </button>
          )}
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-[#E8E4DC]">
            <h3 className="text-base font-bold text-[#1C1917] mb-2">Installer comme application</h3>
            <p className="text-sm text-[#78716C] mb-5 leading-relaxed">
              1. Touchez le bouton Partager dans Safari.<br />
              2. Sélectionnez <strong>Sur l'écran d'accueil</strong>.<br />
              3. Profitez de l'application mobile en plein écran avec la barre en bas !
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
