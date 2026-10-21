/**
 * Exact map mathematics (no pixels, no zoom): game coordinates are in metres,
 * x = East, z = North, alt = height. Everything the mortar needs follows from these formulas.
 */
export interface Pos {
  x: number;
  z: number;
  alt?: number;
}

export interface DistanceBreakdown {
  dx: number; // East offset (m)
  dz: number; // North offset (m)
  horizontal: number; // sqrt(dx^2 + dz^2)
  heightDifference: number; // target alt - gun alt
  slant: number; // sqrt(horizontal^2 + dh^2)
  azimuthDeg: number; // clockwise from true north, 0..360
  azimuthMils: number; // in the weapon's own mil circle (6400 US / 6000 RU)
}

export function distanceBreakdown(gun: Pos, target: Pos, milsPerCircle: number): DistanceBreakdown {
  const dx = target.x - gun.x;
  const dz = target.z - gun.z;
  const horizontal = Math.hypot(dx, dz);
  const dh = (target.alt ?? 0) - (gun.alt ?? 0);
  const az = ((Math.atan2(dx, dz) * 180) / Math.PI + 360) % 360;
  return {
    dx,
    dz,
    horizontal,
    heightDifference: dh,
    slant: Math.hypot(horizontal, dh),
    azimuthDeg: az,
    azimuthMils: (az / 360) * milsPerCircle,
  };
}
