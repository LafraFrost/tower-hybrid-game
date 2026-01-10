import React from 'react';

interface GoblinAttackBannerProps {
  isActive: boolean;
}

export const GoblinAttackBanner: React.FC<GoblinAttackBannerProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-12 bg-red-600 flex items-center justify-center z-[100] pointer-events-none">
      <div className="text-white font-black text-lg animate-pulse">
        🚨 VILLAGGIO SOTTO ATTACCO! CLICCA SULLE SPADE PER DIFENDERE 🚨
      </div>
    </div>
  );
};
