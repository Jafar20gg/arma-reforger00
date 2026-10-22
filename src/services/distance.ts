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

export interface PathMeasure {
  total: number; // sum of the straight segments (m)
  segments: number[]; // length of each segment (m)
  straight: number; // first point -> last point (m)
  azimuthDeg: number; // first -> last, clockwise from north
  azimuthMils: number; // first -> last, in the given mil circle
}

/** Ruler maths: every length comes from game meters only, never from pixels or zoom. */
export function measurePath(points: Array<{ x: number; z: number }>, milsPerCircle: number): PathMeasure | null {
  if (points.length < 2) return null;
  const segments: number[] = [];
  for (let i = 1; i < points.length; i++) {
    segments.push(Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z));
  }
  const overall = distanceBreakdown(points[0], points[points.length - 1], milsPerCircle);
  return {
    total: segments.reduce((a, b) => a + b, 0),
    segments,
    straight: overall.horizontal,
    azimuthDeg: overall.azimuthDeg,
    azimuthMils: overall.azimuthMils,
  };
}

/**
 * Adjust-fire maths: move the target by an observer correction given in the firing-line frame.
 * addDropM   : + adds range (target moves AWAY from the gun), - drops range (TOWARD the gun), in meters.
 * deflectionMils : lateral correction in the weapon's mil circle; + = shift RIGHT of the gun→target line.
 * The lateral offset in meters is range * tan(angle), exact for any angle.
 */
export function offsetTarget(
  gun: { x: number; z: number },
  target: { x: number; z: number; alt?: number },
  addDropM: number,
  deflectionMils: number,
  milsPerCircle: number
): { x: number; z: number; alt: number } {
  const d = distanceBreakdown(gun, target, milsPerCircle);
  const az = (d.azimuthDeg * Math.PI) / 180;
  // Unit vectors in game meters: x = East, z = North
  const fwd = { x: Math.sin(az), z: Math.cos(az) }; // toward the target
  const right = { x: Math.sin(az + Math.PI / 2), z: Math.cos(az + Math.PI / 2) }; // 90° to the right
  const lateralM = d.horizontal > 0 ? d.horizontal * Math.tan((deflectionMils / milsPerCircle) * 2 * Math.PI) : 0;
  const x = target.x + fwd.x * addDropM + right.x * lateralM;
  const z = target.z + fwd.z * addDropM + right.z * lateralM;
  return { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, alt: target.alt ?? 0 };
}
