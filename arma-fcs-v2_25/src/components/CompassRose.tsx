import React from 'react';
import { CARDINALS_EN } from '../services/compass';

const AR_SHORT = ['ش', 'ش.ق', 'ق', 'ج.ق', 'ج', 'ج.غ', 'غ', 'ش.غ'];

/** Fixed compass rose. The map is always north-up (game z axis = north), so N points to the top. */
export const CompassRose: React.FC<{ lang: 'en' | 'ar' }> = ({ lang }) => {
  const labels = lang === 'ar' ? AR_SHORT : [...CARDINALS_EN];
  return (
    <svg width="76" height="76" viewBox="-38 -38 76 76" className="drop-shadow-lg" aria-label={lang === 'ar' ? 'بوصلة' : 'Compass'}>
      <circle r="35" fill="rgba(11,15,20,0.78)" stroke="#38bdf8" strokeOpacity="0.6" />
      <polygon points="0,-26 5,0 -5,0" fill="#ef4444" />
      <polygon points="0,26 5,0 -5,0" fill="#94a3b8" />
      {labels.map((l, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const r = i % 2 === 0 ? 29 : 27;
        return (
          <text
            key={i}
            x={Math.sin(a) * r}
            y={-Math.cos(a) * r + 3}
            textAnchor="middle"
            fontSize={i % 2 === 0 ? 9 : 6}
            fontWeight={i % 2 === 0 ? 700 : 500}
            fill={i === 0 ? '#ef4444' : '#e2e8f0'}
            fontFamily="monospace"
          >
            {l}
          </text>
        );
      })}
    </svg>
  );
};
