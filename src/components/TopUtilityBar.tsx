import React, { useState, useEffect } from 'react';
import { isSoundEnabled, setSoundEnabled, playDispatchChime } from '../utils/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Bike, Utensils, Navigation, Ticket, Volume2, VolumeX, Eye, Download, Wifi } from 'lucide-react';

export type AppTab = '01_RESTAU' | '02_LIVREUR' | '03_GPS' | '04_ADMIN';

interface TopUtilityBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  waitingOrdersCount: number;
  riderPassActive: boolean;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = ({
  activeTab,
  onTabChange,
  waitingOrdersCount,
  riderPassActive,
}) => {
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

  const tabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      id: '01_RESTAU',
      label: 'Restaurant',
      icon: <Utensils className="w-4 h-4" />,
      badge: waitingOrdersCount > 0 ? (
        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
          {waitingOrdersCount}
        </span>
      ) : null,
    },
    {
      id: '02_LIVREUR',
      label: 'Radar Livreur',
      icon: <Bike className="w-4 h-4" />,
      badge: (
        <span
          className={`ml-1.5 w-2 h-2 rounded-full ${
            riderPassActive ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-rose-500'
          }`}
        />
      ),
    },
    {
      id: '03_GPS',
      label: 'Lien GPS Client',
      icon: <Navigation className="w-4 h-4" />,
    },
    {
      id: '04_ADMIN',
      label: 'Forfaits & Pass',
      icon: <Ticket className="w-4 h-4" />,
    },
  ];

  return (
    <header className="w-full bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E8E4DC] sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Brand & Mobile Actions */}
        <div className="w-full md:w-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[#1C1917]">Radar Moto</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  0% com
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] -mt-0.5">Dispatch immédiat</p>
            </div>
          </div>

          {/* Quick controls on mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={toggleWakeLock}
              className={`p-2 rounded-lg border text-xs transition-colors ${
                wakeLockActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-[#E8E4DC] text-[#78716C]'
              }`}
              title="Écran actif"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-lg border text-xs transition-colors ${
                soundOn ? 'border-[#E8E4DC] text-[#1C1917]' : 'border-[#E8E4DC] text-[#A8A29E]'
              }`}
              title="Sonnerie radar"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={install}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold"
              >
                Installer
              </button>
            )}
          </div>
        </div>

        {/* Minimal Rounded Role Tabs */}
        <nav className="w-full md:w-auto grid grid-cols-4 sm:flex items-center p-1 bg-[#F5F2EB] rounded-xl gap-1">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#1C1917] shadow-xs font-semibold'
                    : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white/50'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(' ')[0]}</span>
                {t.badge}
              </button>
            );
          })}
        </nav>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-2">
          {/* Online pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F2EB] text-[11px] font-medium text-[#78716C]">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
          </div>

          {/* Wake Lock */}
          <button
            type="button"
            onClick={toggleWakeLock}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              wakeLockActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'border-[#E8E4DC] text-[#78716C] hover:bg-[#F5F2EB] hover:text-[#1C1917]'
            }`}
            title="Garder l'écran allumé pendant la conduite"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{wakeLockActive ? 'Écran actif' : 'Veille auto'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              soundOn
                ? 'border-[#E8E4DC] text-[#1C1917] hover:bg-[#F5F2EB]'
                : 'border-[#E8E4DC] text-[#A8A29E] hover:bg-[#F5F2EB]'
            }`}
            title="Activer ou couper les alertes sonores"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-amber-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{soundOn ? 'Sonnerie ON' : 'Muet'}</span>
          </button>

          {/* PWA Install */}
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Installer</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              type="button"
              onClick={() => setShowIOSModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E8E4DC] text-xs font-medium text-[#78716C] hover:bg-[#F5F2EB]"
            >
              iOS App
            </button>
          )}
        </div>
      </div>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#E8E4DC]">
            <h3 className="text-base font-bold text-[#1C1917] mb-2">Installer sur iPhone / Safari</h3>
            <p className="text-sm text-[#78716C] mb-5 leading-relaxed">
              1. Touchez le bouton de partage en bas de Safari.<br />
              2. Choisissez <strong>Sur l'écran d'accueil</strong>.<br />
              3. L'application fonctionnera en plein écran comme une app native.
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
