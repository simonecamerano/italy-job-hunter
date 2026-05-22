import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeJobListing } from '../src/job_analyzer.js';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));
vi.mock('fs');

import fs from 'fs';

const mockListing = {
  title: 'Full Stack Developer',
  url: 'https://example.com/job/123',
  content: 'Node.js backend, Vue.js frontend, Italian market.',
};

describe('analyzeJobListing', () => {
  beforeEach(() => {
    vi.mocked(fs.readFileSync).mockReturnValue('# My CV\n## Skills\nNode.js, Vue.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the report string on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Match score: 85%' } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);
    const result = await analyzeJobListing(mockListing);
    expect(result).toBe('Match score: 85%');
  });

  it('calls the Ollama local endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await analyzeJobListing(mockListing);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns an error string when the CV file cannot be read', async () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });
    const result = await analyzeJobListing(mockListing);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns an error string on HTTP error without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      }),
    );
    const result = await analyzeJobListing(mockListing);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
