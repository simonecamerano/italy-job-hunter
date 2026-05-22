import { describe, it, expect } from 'vitest';
import { buildSearchQuery, buildScoutQuery } from '../../src/setup/config-builder.js';

describe('buildSearchQuery', () => {
  it('wraps roles in double quotes and joins with OR', () => {
    const result = buildSearchQuery({
      roles: ['Full Stack Developer', 'Frontend Developer'],
      stack: ['Vue.js', 'Node.js'],
      remoteOnly: true,
      keywords: ['offerte di lavoro'],
    });
    expect(result).toBe(
      '("Full Stack Developer" OR "Frontend Developer") (Vue.js OR Node.js) remoto ("offerte di lavoro")',
    );
  });

  it('handles a single role with no OR', () => {
    const result = buildSearchQuery({
      roles: ['Backend Developer'],
      stack: ['TypeScript'],
      location: 'Italia',
      keywords: ['assunzione', 'candidati'],
    });
    expect(result).toBe('("Backend Developer") (TypeScript) Italia ("assunzione" OR "candidati")');
  });

  it('wraps stack items that contain spaces in double quotes', () => {
    const result = buildSearchQuery({
      roles: ['Developer'],
      stack: ['C#', '.NET'],
      location: 'remoto',
      keywords: ['lavoro'],
    });
    expect(result).toContain('("C#" OR ".NET")');
  });
});

describe('buildScoutQuery', () => {
  it('builds a well-formed scout query', () => {
    const result = buildScoutQuery({
      companyTypes: ['startup', 'software house'],
      location: 'Italia',
      workMode: ['remote', 'lavoro remoto'],
      contract: ['full-time'],
    });
    expect(result).toBe(
      '("startup" OR "software house") Italia ("remote" OR "lavoro remoto") ("full-time")',
    );
  });

  it('handles a single company type', () => {
    const result = buildScoutQuery({
      companyTypes: ['tech company'],
      location: 'Italia',
      workMode: ['remote'],
      contract: ['full-time', 'indeterminato'],
    });
    expect(result).toContain('("tech company")');
    expect(result).toContain('("full-time" OR "indeterminato")');
  });
});
