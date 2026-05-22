import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runTriage } from '../src/triage_filter.js';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

const mockListing = {
  title: 'Full Stack Developer Vue.js + Node.js',
  content: 'Offerta per il mercato italiano. Stack richiesto: Node.js, Vue.js.',
};

describe('runTriage', () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
    vi.restoreAllMocks();
  });

  it('returns true when Groq responds with "SI"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'SI' } }] }),
      }),
    );
    expect(await runTriage(mockListing)).toBe(true);
  });

  it('returns false when Groq responds with "NO"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'NO' } }] }),
      }),
    );
    expect(await runTriage(mockListing)).toBe(false);
  });

  it('returns true when response contains "SI" with trailing text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'SI, è valido' } }],
        }),
      }),
    );
    expect(await runTriage(mockListing)).toBe(true);
  });

  it('returns false when GROQ_API_KEY is missing', async () => {
    delete process.env.GROQ_API_KEY;
    expect(await runTriage(mockListing)).toBe(false);
  });

  it('returns false on network error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    await expect(runTriage(mockListing)).resolves.toBe(false);
  });
});
