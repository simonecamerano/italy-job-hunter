import { describe, it, expect, vi } from 'vitest';
import { wait, deduplicateByUrl, parseMatchScore } from '../src/utils.js';

describe('wait', () => {
  it('resolves after the given delay', async () => {
    vi.useFakeTimers();
    const promise = wait(100);
    vi.advanceTimersByTime(100);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});

describe('deduplicateByUrl', () => {
  it('removes duplicate URLs keeping first occurrence', () => {
    const listings = [
      { url: 'https://a.com', title: 'A' },
      { url: 'https://b.com', title: 'B' },
      { url: 'https://a.com', title: 'A2' },
    ];
    const result = deduplicateByUrl(listings);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('A');
    expect(result[1].title).toBe('B');
  });

  it('returns empty array when input is empty', () => {
    expect(deduplicateByUrl([])).toEqual([]);
  });

  it('returns all items when no duplicates exist', () => {
    const listings = [{ url: 'https://a.com' }, { url: 'https://b.com' }];
    expect(deduplicateByUrl(listings)).toHaveLength(2);
  });
});

describe('parseMatchScore', () => {
  it('extracts numeric score from standard Ollama report format', () => {
    expect(parseMatchScore('🎯 MATCH SCORE TECNICO: 85%')).toBe(85);
  });

  it('extracts score case-insensitively', () => {
    expect(parseMatchScore('match score: 70%')).toBe(70);
  });

  it('returns null when no score pattern is found', () => {
    expect(parseMatchScore('No score here')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseMatchScore('')).toBeNull();
  });
});
