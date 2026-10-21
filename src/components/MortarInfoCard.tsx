import React from 'react';
import { WeaponConfig, AmmoConfig } from '../types';
import { MortarInformationSystem } from './MortarInformationSystem';

interface MortarInfoCardProps {
  weapon: WeaponConfig;
  selectedAmmo?: AmmoConfig;
  onSelectWeapon?: (weapon: WeaponConfig) => void;
  availableWeapons?: WeaponConfig[];
  lang: 'en' | 'ar';
}

export const MortarInfoCard: React.FC<MortarInfoCardProps> = ({
  weapon,
  onSelectWeapon,
  availableWeapons,
  lang,
}) => {
  return (
    <MortarInformationSystem
      currentWeapon={weapon}
      onSelectWeapon={onSelectWeapon}
      availableWeapons={availableWeapons}
      lang={lang}
      isCompact={true}
    />
  );
};
