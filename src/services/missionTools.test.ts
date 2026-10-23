// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { offsetTarget, distanceBreakdown } from './distance';
import { encodeMissionLink, decodeMissionLink } from './missionLink';
import { sanitizeMissions } from './storageService';

describe('offsetTarget (adjust fire)', () => {
  const gun = { x: 1000, z: 1000 };
  const target = { x: 1000, z: 2000 }; // exactly 1000 m due north of the gun

  it('add moves the target away from the gun, drop moves it closer', () => {
    const added = offsetTarget(gun, target, 100, 0, 6400);
    expect(added.x).toBeCloseTo(1000, 5);
    expect(added.z).toBeCloseTo(2100, 5);
    const dropped = offsetTarget(gun, target, -100, 0, 6400);
    expect(dropped.z).toBeCloseTo(1900, 5);
  });

  it('deflection + moves right of the firing line, - moves left', () => {
    // firing line points north -> right is +x (east)
    const right = offsetTarget(gun, target, 0, 100, 6400); // 100 mils at 1000 m ~ 1000*tan(2pi*100/6400) = 98.2 m
    expect(right.x).toBeCloseTo(1000 + 1000 * Math.tan((100 / 6400) * 2 * Math.PI), 1); // result rounded to 0.1 m
    expect(right.z).toBeCloseTo(2000, 5);
    const left = offsetTarget(gun, target, 0, -100, 6400);
    expect(left.x).toBeLessThan(1000);
  });

  it('respects the weapon mil circle: 100 mils at 6000 covers more ground than at 6400', () => {
    const ru = offsetTarget(gun, target, 0, 100, 6000);
    const us = offsetTarget(gun, target, 0, 100, 6400);
    expect(ru.x - 1000).toBeGreaterThan(us.x - 1000);
  });

  it('rotates with the firing direction (target east of gun: right = south)', () => {
    const tgtE = { x: 2000, z: 1000, alt: 50 };
    const moved = offsetTarget(gun, tgtE, 50, 50, 6400);
    // add 50 -> further east; right of an eastward line is -z (south)
    expect(moved.x).toBeGreaterThan(2000);
    expect(moved.z).toBeLessThan(1000);
    expect(moved.alt).toBe(50); // altitude is kept
  });

  it('a combined correction lands on the correct grid via distanceBreakdown', () => {
    const moved = offsetTarget(gun, target, 200, 0, 6400);
    const d = distanceBreakdown(gun, moved, 6400);
    expect(d.horizontal).toBeCloseTo(1200, 3);
    expect(d.azimuthDeg).toBeCloseTo(0, 3);
  });
});

describe('missionLink (share by URL)', () => {
  const mission = {
    terrainId: 'everon' as const,
    weaponId: 'm252_mortar',
    ammoId: 'M821_HE',
    ring: 4,
    gun: { x: 4820, z: 7150, alt: 65 },
    target: { x: 5700.5, z: 6980.25, alt: 72 },
  };

  it('encode -> decode is an exact round trip', () => {
    const hash = encodeMissionLink(mission);
    expect(hash.startsWith('#m=')).toBe(true);
    expect(hash.slice(3)).toMatch(/^[A-Za-z0-9\-_]+$/); // URL-safe alphabet in the payload
    const back = decodeMissionLink(hash);
    expect(back).toEqual(mission);
  });

  it('decodes from a full location.hash string', () => {
    const hash = encodeMissionLink(mission);
    expect(decodeMissionLink(`#${hash.slice(1)}`)).toEqual(mission);
  });

  it('rejects garbage without throwing', () => {
    expect(decodeMissionLink('#m=!!!')).toBeNull();
    expect(decodeMissionLink('#m=' + btoa('{"t":"mars","w":"x","g":[1,2,3],"h":[4,5,6]}'))).toBeNull();
    expect(decodeMissionLink('')).toBeNull();
    expect(decodeMissionLink('#other=1')).toBeNull();
  });
});

describe('sanitizeMissions (mission log storage)', () => {
  const valid = {
    id: 'm1',
    createdAt: new Date().toISOString(),
    terrainId: 'arland',
    weaponId: 'w',
    weaponName: 'M252',
    ring: 4,
    gun: { x: 100, z: 200, alt: 50 },
    target: { x: 900, z: 1600, alt: 72 },
    azimuthMils: 1234,
    elevationMils: 1100,
    rangeM: 1500,
    tofS: 25.9,
    callout: '[FIRE MISSION]',
  };

  it('keeps valid rows and drops corrupt ones', () => {
    const out = sanitizeMissions([valid, { junk: true }, { gun: valid.gun, target: { x: 'bad', z: 1 } }, null]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('m1');
    expect(out[0].terrainId).toBe('arland');
  });

  it('falls back to defaults for bad scalars and rejects unknown terrain', () => {
    const out = sanitizeMissions([{ ...valid, terrainId: 'mars', ring: 99, azimuthMils: -50 }]);
    expect(out[0].terrainId).toBe('everon');
    expect(out[0].ring).toBe(10);
    expect(out[0].azimuthMils).toBe(0);
  });

  it('accepts null elevation/TOF (out-of-range saves) and caps the log at 100 rows', () => {
    const many = Array.from({ length: 130 }, (_, i) => ({ ...valid, id: `m${i}`, elevationMils: null, tofS: null }));
    const out = sanitizeMissions(many);
    expect(out).toHaveLength(100);
    expect(out[0].elevationMils).toBeNull();
  });

  it('returns [] for non-arrays', () => {
    expect(sanitizeMissions(undefined)).toEqual([]);
    expect(sanitizeMissions('nope')).toEqual([]);
    expect(sanitizeMissions(42)).toEqual([]);
  });
});
