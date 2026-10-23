import type { BallisticSolution, WeaponConfig } from '../types';
import { formatGridCoord } from '../data/ballistics';

/** Builds the standardized squad radio callout for a firing solution (same text for copy & mission log). */
export function buildFireMissionCallout(opts: {
  terrainName: string;
  weapon: WeaponConfig;
  ammoLabel: string;
  solution: BallisticSolution;
  gunPos: { x: number; z: number };
  targetPos: { x: number; z: number };
}): string {
  const { terrainName, weapon, ammoLabel, solution, gunPos, targetPos } = opts;
  const soviet = weapon.milSystem === 'SOVIET';
  const fmt = (m: number) =>
    soviet
      ? `${String(Math.floor(m / 100)).padStart(2, '0')}-${String(m % 100).padStart(2, '0')}`
      : `${m}`;
  const azMilStr = fmt(solution.azimuthMils);
  const elevMilStr = solution.elevationMils !== null ? fmt(solution.elevationMils) : 'OUT OF RANGE';
  const ysStr = solution.peakAlt ? ` | Ys: ${solution.peakAlt}m` : '';
  const dhwStr = solution.dElevPer100m ? ` | ΔHw: ${solution.dElevPer100m}` : '';
  return `[FIRE MISSION - ${terrainName.toUpperCase()}] ${weapon.name} [${ammoLabel}] | RING: ${solution.charge} | AZ: ${azMilStr} mils (${solution.azimuthDeg}°) | EL: ${elevMilStr} mils (${solution.elevationDeg !== null ? `${solution.elevationDeg.toFixed(1)}°` : '--'}) | RNG: ${solution.horizontalDistance}m (ΔH: ${solution.heightDifference >= 0 ? '+' : ''}${solution.heightDifference}m) | TOF: ${solution.timeOfFlight || 0}s${ysStr}${dhwStr} | GUN: ${formatGridCoord(gunPos.x, gunPos.z, 6)} | TGT: ${formatGridCoord(targetPos.x, targetPos.z, 6)}`;
}
