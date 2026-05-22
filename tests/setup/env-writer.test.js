import { describe, it, expect, afterEach, vi } from 'vitest';

vi.mock('fs');
vi.mock('path', () => ({
  default: { join: (...parts) => parts.join('/') },
}));

import fs from 'fs';
import { readEnvKey, writeEnvKey } from '../../src/setup/env-writer.js';

describe('readEnvKey', () => {
  it('returns the value for an existing key', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('TAVILY_API_KEY=abc123\nGROQ_API_KEY=xyz\n');
    expect(readEnvKey('TAVILY_API_KEY')).toBe('abc123');
  });

  it('returns undefined when the key is not present', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('OTHER_KEY=value\n');
    expect(readEnvKey('MISSING_KEY')).toBeUndefined();
  });

  it('returns undefined when .env does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(readEnvKey('ANY_KEY')).toBeUndefined();
  });
});

describe('writeEnvKey', () => {
  afterEach(() => vi.restoreAllMocks());

  it('appends a new key to an empty .env', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const written = [];
    vi.mocked(fs.writeFileSync).mockImplementation((_, content) => written.push(content));
    writeEnvKey('NEW_KEY', 'new_value');
    expect(written[0]).toContain('NEW_KEY=new_value');
  });

  it('updates an existing key without duplicating it', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('TAVILY_API_KEY=old\nGROQ_API_KEY=groq\n');
    const written = [];
    vi.mocked(fs.writeFileSync).mockImplementation((_, content) => written.push(content));
    writeEnvKey('TAVILY_API_KEY', 'new');
    expect(written[0]).toContain('TAVILY_API_KEY=new');
    expect(written[0]).not.toContain('TAVILY_API_KEY=old');
    expect(written[0]).toContain('GROQ_API_KEY=groq');
  });
});
