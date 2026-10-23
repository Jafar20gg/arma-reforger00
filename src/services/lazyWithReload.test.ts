import { describe, it, expect } from 'vitest';
import { isChunkError } from './lazyWithReload';

describe('stale-build detection', () => {
  it('recognises the messages browsers give when a screen file is gone', () => {
    expect(isChunkError(new Error('Failed to fetch dynamically imported module: https://x/assets/SettingsModal-abc.js'))).toBe(true);
    expect(isChunkError(new Error('error loading dynamically imported module'))).toBe(true);
    expect(isChunkError(new TypeError('Importing a module script failed.'))).toBe(true);
  });
  it('ignores ordinary errors', () => {
    expect(isChunkError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkError(null)).toBe(false);
    expect(isChunkError(undefined)).toBe(false);
  });
});
