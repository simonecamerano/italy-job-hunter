import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeSpontaneousApplication } from '../src/spontaneous_analyzer.js';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));
vi.mock('fs');

import fs from 'fs';

const mockCompany = {
  name: 'SmartRetail Srl',
  url: 'https://smartretail.it',
  content: 'Software house specializzata in soluzioni per la GDO.',
};

describe('analyzeSpontaneousApplication', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('# My CV');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the pitch string on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Pitch content here' } }],
        }),
      }),
    );
    const result = await analyzeSpontaneousApplication(mockCompany);
    expect(result).toBe('Pitch content here');
  });

  it('calls the Ollama local endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await analyzeSpontaneousApplication(mockCompany);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns error string when choices is missing from response without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'quota exceeded' }),
      }),
    );
    const result = await analyzeSpontaneousApplication(mockCompany);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns error string on HTTP error without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );
    const result = await analyzeSpontaneousApplication(mockCompany);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
