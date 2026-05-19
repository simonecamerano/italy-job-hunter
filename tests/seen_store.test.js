import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadSeen, saveSeen } from '../src/seen_store.js';

let tmpFile;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), `seen_test_${Date.now()}.json`);
});

afterEach(() => {
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

describe('loadSeen', () => {
  it('returns an empty Set when the file does not exist', () => {
    const result = loadSeen(tmpFile);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns a Set populated with the stored URLs', () => {
    fs.writeFileSync(tmpFile, JSON.stringify(['https://a.com', 'https://b.com']));
    const result = loadSeen(tmpFile);
    expect(result.has('https://a.com')).toBe(true);
    expect(result.has('https://b.com')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('returns an empty Set on malformed JSON without throwing', () => {
    fs.writeFileSync(tmpFile, 'not {{ valid json');
    expect(() => loadSeen(tmpFile)).not.toThrow();
    expect(loadSeen(tmpFile).size).toBe(0);
  });
});

describe('saveSeen', () => {
  it('persists URLs so they can be reloaded by loadSeen', () => {
    const set = new Set(['https://x.com', 'https://y.com']);
    saveSeen(set, tmpFile);
    const reloaded = loadSeen(tmpFile);
    expect(reloaded.has('https://x.com')).toBe(true);
    expect(reloaded.has('https://y.com')).toBe(true);
    expect(reloaded.size).toBe(2);
  });
});
