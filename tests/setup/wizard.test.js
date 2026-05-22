import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseKeywords } from '../../src/setup/wizard.js';

describe('parseKeywords', () => {
  it('splits a comma-separated string into trimmed keywords', () => {
    expect(parseKeywords('Vue.js, Node.js, TypeScript')).toEqual([
      'Vue.js',
      'Node.js',
      'TypeScript',
    ]);
  });

  it('trims extra whitespace from each keyword', () => {
    expect(parseKeywords('  Full Stack Developer ,  Backend Developer  ')).toEqual([
      'Full Stack Developer',
      'Backend Developer',
    ]);
  });

  it('filters out empty tokens from trailing commas', () => {
    expect(parseKeywords('React,,Node.js,')).toEqual(['React', 'Node.js']);
  });

  it('returns a single-element array when no comma is present', () => {
    expect(parseKeywords('Frontend Developer')).toEqual(['Frontend Developer']);
  });
});

// ── Module mocks (hoisted before dynamic imports) ──────────────────────────
vi.mock('fs');
vi.mock('path', () => ({ default: { join: (...parts) => parts.join('/') } }));
vi.mock('@clack/prompts');
vi.mock('../../src/setup/env-writer.js', () => ({
  readEnvKey: vi.fn().mockReturnValue('mock-key'),
  writeEnvKey: vi.fn(),
}));
vi.mock('../../src/setup/ollama-client.js', () => ({
  listOllamaModels: vi.fn().mockResolvedValue(['qwen3.5:latest']),
  OLLAMA_DEFAULT_BASE_URL: 'http://localhost:11434',
}));

import fs from 'fs';
import * as p from '@clack/prompts';
import { ensureSetup } from '../../src/setup/wizard.js';

afterEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(process.stdin, 'isTTY', { value: undefined, configurable: true });
});

// ── Existing config flow ───────────────────────────────────────────────────
describe('ensureSetup — existing config', () => {
  it('shows reconfigure prompt then asks which script when user declines', async () => {
    // Simulate TTY so the non-interactive early-return guard does not fire
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (String(filePath).endsWith('user-config.json')) {
        return JSON.stringify({
          search: {
            roles: ['Backend Developer'],
            stack: ['Node.js'],
            location: 'remoto',
            keywords: ['lavoro'],
          },
          scout: {
            companyTypes: ['startup'],
            location: 'Italia',
            workMode: ['remote'],
            contract: ['full-time'],
          },
          analysis: {
            provider: 'ollama',
            model: 'qwen3.5:latest',
            baseUrl: 'http://localhost:11434/v1',
          },
        });
      }
      return '';
    });
    vi.mocked(p.isCancel).mockReturnValue(false);
    vi.mocked(p.note).mockImplementation(() => {});
    vi.mocked(p.intro).mockImplementation(() => {});
    vi.mocked(p.outro).mockImplementation(() => {});
    vi.mocked(p.confirm).mockResolvedValue(false); // decline reconfigure
    vi.mocked(p.select).mockResolvedValueOnce('hunter'); // which script?

    const result = await ensureSetup();

    expect(p.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Reconfigure'),
      }),
    );
    expect(result).toBe('hunter');
  });
});

// ── Post-setup: returns chosen script ─────────────────────────────────────
describe('ensureSetup — script choice after first setup', () => {
  it('returns the chosen script after completing wizard', async () => {
    vi.mocked(fs.existsSync).mockImplementation((filePath) => String(filePath) === '/fake/cv.md');
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    vi.mocked(fs.mkdirSync).mockImplementation(() => {});
    vi.mocked(fs.copyFileSync).mockImplementation(() => {});
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(p.isCancel).mockReturnValue(false);
    vi.mocked(p.intro).mockImplementation(() => {});
    vi.mocked(p.outro).mockImplementation(() => {});
    vi.mocked(p.note).mockImplementation(() => {});
    vi.mocked(p.log.success).mockImplementation(() => {});
    vi.mocked(p.spinner).mockReturnValue({ start: vi.fn(), stop: vi.fn() });

    const textAnswers = ['Backend Developer', 'Node.js', 'startup', '/fake/cv.md'];
    let textCallCount = 0;
    vi.mocked(p.text).mockImplementation(() => Promise.resolve(textAnswers[textCallCount++]));
    // select: 1) provider, 2) model, 3) which script
    vi.mocked(p.select)
      .mockResolvedValueOnce('ollama')
      .mockResolvedValueOnce('qwen3.5:latest')
      .mockResolvedValueOnce('scout');

    const result = await ensureSetup();

    expect(result).toBe('scout');
    expect(p.outro).toHaveBeenCalledWith(expect.stringContaining('scout'));
  });
});

// ── Dry-run ────────────────────────────────────────────────────────────────
describe('ensureSetup — dry-run', () => {
  it('returns hunter immediately without prompts when config exists and dryRun is true', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
      if (String(filePath).endsWith('user-config.json')) {
        return JSON.stringify({
          search: {
            roles: ['Dev'],
            stack: ['Node.js'],
            location: 'remoto',
            keywords: ['lavoro'],
          },
          scout: {
            companyTypes: ['startup'],
            location: 'Italia',
            workMode: ['remote'],
            contract: ['full-time'],
          },
          analysis: {
            provider: 'ollama',
            model: 'qwen3.5:latest',
            baseUrl: 'http://localhost:11434/v1',
          },
        });
      }
      return '';
    });

    const result = await ensureSetup({ dryRun: true });

    expect(result).toBe('hunter');
    expect(p.intro).not.toHaveBeenCalled();
    expect(p.select).not.toHaveBeenCalled();
  });

  it('runs the full wizard when dryRun is true but no config exists', async () => {
    vi.mocked(fs.existsSync).mockImplementation((filePath) => String(filePath) === '/fake/cv.md');
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    vi.mocked(fs.mkdirSync).mockImplementation(() => {});
    vi.mocked(fs.copyFileSync).mockImplementation(() => {});
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(p.isCancel).mockReturnValue(false);
    vi.mocked(p.intro).mockImplementation(() => {});
    vi.mocked(p.outro).mockImplementation(() => {});
    vi.mocked(p.note).mockImplementation(() => {});
    vi.mocked(p.log.success).mockImplementation(() => {});
    vi.mocked(p.spinner).mockReturnValue({ start: vi.fn(), stop: vi.fn() });

    const textAnswers = ['Backend Developer', 'Node.js', 'startup', '/fake/cv.md'];
    let idx = 0;
    vi.mocked(p.text).mockImplementation(() => Promise.resolve(textAnswers[idx++]));
    vi.mocked(p.select)
      .mockResolvedValueOnce('ollama')
      .mockResolvedValueOnce('qwen3.5:latest')
      .mockResolvedValueOnce('hunter');

    const result = await ensureSetup({ dryRun: true });

    expect(p.intro).toHaveBeenCalled();
    expect(result).toBe('hunter');
  });
});

// ── Ollama config written correctly ───────────────────────────────────────
describe('ensureSetup — Ollama config is written correctly', () => {
  it('writes provider=ollama with the selected model and correct baseUrl', async () => {
    vi.mocked(fs.existsSync).mockImplementation((filePath) => String(filePath) === '/fake/cv.md');
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    vi.mocked(fs.mkdirSync).mockImplementation(() => {});
    vi.mocked(fs.copyFileSync).mockImplementation(() => {});

    let writtenConfig = null;
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      if (String(filePath).endsWith('user-config.json')) {
        writtenConfig = JSON.parse(content);
      }
    });

    vi.mocked(p.isCancel).mockReturnValue(false);
    vi.mocked(p.intro).mockImplementation(() => {});
    vi.mocked(p.outro).mockImplementation(() => {});
    vi.mocked(p.note).mockImplementation(() => {});
    vi.mocked(p.log.success).mockImplementation(() => {});
    vi.mocked(p.spinner).mockReturnValue({ start: vi.fn(), stop: vi.fn() });

    const textAnswers = [
      'Full Stack Developer',
      'Vue.js, Node.js',
      'startup, software house',
      '/fake/cv.md',
    ];
    let idx = 0;
    vi.mocked(p.text).mockImplementation(() => Promise.resolve(textAnswers[idx++]));
    // select: 1) remoteOnly, 2) provider, 3) model, 4) which script
    vi.mocked(p.select)
      .mockResolvedValueOnce(true) // remoteOnly
      .mockResolvedValueOnce('ollama')
      .mockResolvedValueOnce('llama3.2:latest')
      .mockResolvedValueOnce('hunter');

    await ensureSetup();

    expect(writtenConfig.analysis.provider).toBe('ollama');
    expect(writtenConfig.analysis.model).toBe('llama3.2:latest');
    expect(writtenConfig.analysis.baseUrl).toBe('http://localhost:11434/v1');
    expect(writtenConfig.search.roles).toEqual(['Full Stack Developer']);
    expect(writtenConfig.search.stack).toEqual(['Vue.js', 'Node.js']);
    expect(writtenConfig.scout.companyTypes).toEqual(['startup', 'software house']);
  });
});
