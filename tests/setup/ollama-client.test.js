import { describe, it, expect, vi, afterEach } from 'vitest';
import { listOllamaModels, OLLAMA_DEFAULT_BASE_URL } from '../../src/setup/ollama-client.js';

afterEach(() => vi.restoreAllMocks());

describe('listOllamaModels', () => {
  it('returns model names from a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: 'llama3.2' }, { name: 'qwen3.5:latest' }],
        }),
      }),
    );
    const models = await listOllamaModels();
    expect(models).toEqual(['llama3.2', 'qwen3.5:latest']);
  });

  it('returns an empty array when Ollama is not running', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    const models = await listOllamaModels();
    expect(models).toEqual([]);
  });

  it('returns an empty array on a non-200 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const models = await listOllamaModels();
    expect(models).toEqual([]);
  });

  it('uses the default base URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await listOllamaModels();
    expect(mockFetch).toHaveBeenCalledWith(`${OLLAMA_DEFAULT_BASE_URL}/api/tags`);
  });

  it('accepts a custom base URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await listOllamaModels('http://my-server:11434');
    expect(mockFetch).toHaveBeenCalledWith('http://my-server:11434/api/tags');
  });
});
