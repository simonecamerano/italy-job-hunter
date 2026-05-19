import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analizzaPerCandidaturaSpontanea } from '../src/spontaneous_analyzer.js';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));
vi.mock('fs');

import fs from 'fs';

const mockAzienda = {
  name: 'SmartRetail Srl',
  url: 'https://smartretail.it',
  content: 'Software house specializzata in soluzioni per la GDO.',
};

describe('analizzaPerCandidaturaSpontanea', () => {
  beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = 'test-key';
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('# My CV');
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    vi.restoreAllMocks();
  });

  it('returns the pitch string on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Pitch content here' } }] }),
    }));
    const result = await analizzaPerCandidaturaSpontanea(mockAzienda);
    expect(result).toBe('Pitch content here');
  });

  it('returns error string when API key is missing', async () => {
    delete process.env.DEEPSEEK_API_KEY;
    const result = await analizzaPerCandidaturaSpontanea(mockAzienda);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns error string when choices is missing from response without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'quota exceeded' }),
    }));
    const result = await analizzaPerCandidaturaSpontanea(mockAzienda);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns error string on HTTP error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));
    const result = await analizzaPerCandidaturaSpontanea(mockAzienda);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
