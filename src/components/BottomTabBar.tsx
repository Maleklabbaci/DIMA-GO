import React from 'react';
import { AppTab } from './TopUtilityBar';
import { Utensils, Bike, Navigation, Ticket } from 'lucide-react';

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  waitingOrdersCount: number;
  riderPassActive: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  waitingOrdersCount,
  riderPassActive,
}) => {
  const tabs: {
    id: AppTab;
    label: string;
    icon: (isActive: boolean) => React.ReactNode;
    badge?: React.ReactNode;
  }[] = [
    {
      id: '01_RESTAU',
      label: 'Restaurant',
      icon: (isActive) => (
        <Utensils
          className={`w-5 h-5 transition-transform ${
            isActive ? 'scale-110 text-amber-600 stroke-[2.5]' : 'text-[#78716C] stroke-[1.8]'
          }`}
        />
      ),
      badge:
        waitingOrdersCount > 0 ? (
          <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
            {waitingOrdersCount}
          </span>
        ) : null,
    },
    {
      id: '02_LIVREUR',
      label: 'Radar',
      icon: (isActive) => (
        <Bike
          className={`w-5 h-5 transition-transform ${
            isActive ? 'scale-110 text-amber-600 stroke-[2.5]' : 'text-[#78716C] stroke-[1.8]'
          }`}
        />
      ),
      badge: (
        <span
          className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
            riderPassActive ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
      ),
    },
    {
      id: '03_GPS',
      label: 'GPS Client',
      icon: (isActive) => (
        <Navigation
          className={`w-5 h-5 transition-transform ${
            isActive ? 'scale-110 text-amber-600 stroke-[2.5]' : 'text-[#78716C] stroke-[1.8]'
          }`}
        />
      ),
    },
    {
      id: '04_ADMIN',
      label: 'Pass & Abos',
      icon: (isActive) => (
        <Ticket
          className={`w-5 h-5 transition-transform ${
            isActive ? 'scale-110 text-amber-600 stroke-[2.5]' : 'text-[#78716C] stroke-[1.8]'
          }`}
        />
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E8E4DC] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[max(env(safe-area-inset-bottom),8px)] pt-1"
      aria-label="Navigation mobile principale"
    >
      <div className="max-w-md md:max-w-xl mx-auto px-4 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer relative group ${
                isActive ? 'text-[#1C1917]' : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <div className="relative flex items-center justify-center py-1">
                {tab.icon(isActive)}
                {tab.badge}
              </div>
              <span
                className={`text-[11px] tracking-tight transition-all ${
                  isActive ? 'font-bold text-[#1C1917]' : 'font-medium text-[#78716C]'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
