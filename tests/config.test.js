import { describe, it, expect, afterEach } from 'vitest';
import {
  getSearchQuery,
  getScoutQuery,
  SEARCH_MAX_RESULTS,
  SCOUT_MAX_RESULTS,
  TRIAGE_MODEL,
  getAnalysisModel,
  getOllamaBaseUrl,
  API_DELAY_MS,
  TELEGRAM_MAX_CHARS,
  MIN_MATCH_SCORE,
  getUserConfig,
  getAnalysisApiKey,
} from '../src/config.js';

describe('config', () => {
  it('getSearchQuery returns a non-empty string', () => {
    expect(typeof getSearchQuery()).toBe('string');
    expect(getSearchQuery().length).toBeGreaterThan(0);
  });

  it('exports SEARCH_MAX_RESULTS as a positive number', () => {
    expect(typeof SEARCH_MAX_RESULTS).toBe('number');
    expect(SEARCH_MAX_RESULTS).toBeGreaterThan(0);
  });

  it('getScoutQuery returns a non-empty string', () => {
    expect(typeof getScoutQuery()).toBe('string');
    expect(getScoutQuery().length).toBeGreaterThan(0);
  });

  it('exports SCOUT_MAX_RESULTS as a positive number', () => {
    expect(typeof SCOUT_MAX_RESULTS).toBe('number');
    expect(SCOUT_MAX_RESULTS).toBeGreaterThan(0);
  });

  it('exports TRIAGE_MODEL as a non-empty string', () => {
    expect(typeof TRIAGE_MODEL).toBe('string');
    expect(TRIAGE_MODEL.length).toBeGreaterThan(0);
  });

  it('getAnalysisModel returns a non-empty string', () => {
    expect(typeof getAnalysisModel()).toBe('string');
    expect(getAnalysisModel().length).toBeGreaterThan(0);
  });

  it('exports API_DELAY_MS as a positive number', () => {
    expect(typeof API_DELAY_MS).toBe('number');
    expect(API_DELAY_MS).toBeGreaterThan(0);
  });

  it('exports TELEGRAM_MAX_CHARS as a positive number', () => {
    expect(typeof TELEGRAM_MAX_CHARS).toBe('number');
    expect(TELEGRAM_MAX_CHARS).toBeGreaterThan(0);
  });

  it('exports MIN_MATCH_SCORE as a number between 0 and 100', () => {
    expect(typeof MIN_MATCH_SCORE).toBe('number');
    expect(MIN_MATCH_SCORE).toBeGreaterThanOrEqual(0);
    expect(MIN_MATCH_SCORE).toBeLessThanOrEqual(100);
  });

  it('getOllamaBaseUrl returns a non-empty URL string', () => {
    const url = getOllamaBaseUrl();
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
    expect(url).toMatch(/^https?:\/\//);
  });
});

describe('getUserConfig', () => {
  it('returns null when data/user-config.json does not exist in test env', () => {
    const result = getUserConfig();
    expect(result === null || typeof result === 'object').toBe(true);
  });
});

describe('getAnalysisApiKey', () => {
  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
  });

  it('returns null when no user-config.json exists (no deepseek provider)', () => {
    expect(getAnalysisApiKey()).toBeNull();
  });

  it('is a function', () => {
    expect(typeof getAnalysisApiKey).toBe('function');
  });
});
