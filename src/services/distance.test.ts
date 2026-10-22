import { describe, it, expect } from 'vitest';
import { distanceBreakdown } from './distance';
import { parseAdvisorJson } from './aiAdvisor';

describe('exact distance maths', () => {
  it('3-4-5 triangle, bearing and mils', () => {
    const d = distanceBreakdown({ x: 1000, z: 1000, alt: 10 }, { x: 1300, z: 1400, alt: 30 }, 6400);
    expect(d.horizontal).toBe(500);
    expect(d.heightDifference).toBe(20);
    expect(d.azimuthDeg).toBeCloseTo(36.8699, 3);
    expect(d.azimuthMils).toBeCloseTo((36.8699 / 360) * 6400, 2);
  });
  it('north, east, south, west', () => {
    const o = { x: 0, z: 0 };
    expect(distanceBreakdown(o, { x: 0, z: 10 }, 6000).azimuthMils).toBeCloseTo(0, 6);
    expect(distanceBreakdown(o, { x: 10, z: 0 }, 6000).azimuthMils).toBeCloseTo(1500, 6);
    expect(distanceBreakdown(o, { x: 0, z: -10 }, 6000).azimuthMils).toBeCloseTo(3000, 6);
    expect(distanceBreakdown(o, { x: -10, z: 0 }, 6000).azimuthMils).toBeCloseTo(4500, 6);
  });
});

describe('AI reply parsing', () => {
  it('reads JSON even inside a code fence and rejects garbage', () => {
    const r = parseAdvisorJson('```json\n{"distance_m": 500, "azimuth_mils": 655.1, "notes": ["ok", 3]}\n```');
    expect(r).toEqual({ distance_m: 500, azimuth_mils: 655.1, notes: ['ok'] });
    expect(parseAdvisorJson('no json here')).toBeNull();
  });
});
