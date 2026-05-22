import { describe, it, expect, vi, afterEach } from 'vitest';
import { callLLM } from '../src/llm_client.js';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

afterEach(() => vi.restoreAllMocks());

describe('callLLM', () => {
  it('returns the content string from the API response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Analysis result' } }] }),
      }),
    );
    const result = await callLLM('You are a helper.', 'Analyze this.');
    expect(result).toBe('Analysis result');
  });

  it('calls the configured base URL endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await callLLM('sys', 'user');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on non-OK HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(callLLM('sys', 'user')).rejects.toThrow('API Error: 500');
  });

  it('returns fallback string when choices is absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );
    const result = await callLLM('sys', 'user');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
