# Portfolio-Ready Italy Job Hunter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing working prototype into a portfolio-ready project with bug fixes, a centralized config, deduplication cache, full Vitest test suite, English JSDoc comments, and an exhaustive README.

**Architecture:** Approach A (Fix + Polish) — keep the existing procedural pipeline intact, add `src/config.js` and `src/seen_store.js` as new modules, wire deduplication into `index.js`, export `convertiMarkdownInHtml` for testability, and cover all modules with offline Vitest tests.

**Tech Stack:** Node.js 18+ (ESM), Vitest, Tavily, Groq, DeepSeek, Telegram Bot API.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/config.js` | All project constants (queries, models, delays, limits) |
| Create | `src/seen_store.js` | Read/write `data/seen_urls.json` deduplication cache |
| Create | `vitest.config.js` | Vitest configuration for ESM |
| Create | `tests/config.test.js` | Smoke tests for config exports |
| Create | `tests/seen_store.test.js` | Unit tests for seen_store (real temp I/O) |
| Create | `tests/triage_filter.test.js` | Unit tests for eseguiTriage (mocked fetch) |
| Create | `tests/deepseek_analyzer.test.js` | Unit tests for analizzaConDeepSeek (mocked fetch + fs) |
| Create | `tests/spontaneous_analyzer.test.js` | Unit tests for analizzaPerCandidaturaSpontanea |
| Create | `tests/telegram_sender.test.js` | Unit tests for sender + convertiMarkdownInHtml |
| Create | `README.md` | Exhaustive English README |
| Modify | `.gitignore` | Add `node_modules/` and `data/seen_urls.json` |
| Modify | `package.json` | Fix main, add npm scripts, add vitest dev-dep |
| Modify | `src/search_engine.js` | Use config constants, EN comments |
| Modify | `src/triage_filter.js` | Use config constants, EN comments |
| Modify | `src/deepseek_analyzer.js` | Use config constants, EN comments |
| Modify | `src/spontaneous_analyzer.js` | Fix CV path, fix error handling, EN comments |
| Modify | `src/company_scouter.js` | Use config constants, EN comments |
| Modify | `src/telegram_sender.js` | Export `convertiMarkdownInHtml`, EN comments |
| Modify | `index.js` | Integrate seen_store, use config constants, EN comments |
| Modify | `scouting.js` | Use config constants, EN comments |
| Delete | `test_search.js` | Temporary debug file, superseded by test suite |

---

## Task 1: Project Scaffolding

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Create: `vitest.config.js`

- [ ] **Step 1: Fix .gitignore**

Replace the entire file content:

```
.env
node_modules/
data/seen_urls.json
```

- [ ] **Step 2: Fix package.json**

Replace the entire file content:

```json
{
  "name": "italy-job-hunter",
  "version": "1.0.0",
  "description": "AI-powered job hunting automation for the Italian tech market.",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "scout": "node scouting.js",
    "test": "vitest run"
  },
  "keywords": ["job-hunting", "ai", "nodejs", "automation", "telegram"],
  "author": "Simone Camerano",
  "license": "ISC",
  "type": "module",
  "dependencies": {
    "@tavily/core": "^0.7.3",
    "dotenv": "^17.4.2"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3: Install vitest**

```bash
npm install --save-dev vitest
```

Expected: vitest added to `node_modules/`, `package-lock.json` updated.

- [ ] **Step 4: Create vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore package.json package-lock.json vitest.config.js
git commit -m "chore: scaffold vitest, fix package.json and .gitignore"
```

---

## Task 2: src/config.js

**Files:**
- Create: `src/config.js`
- Create: `tests/config.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/config.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  SEARCH_QUERY,
  SEARCH_MAX_RESULTS,
  SCOUT_QUERY,
  SCOUT_MAX_RESULTS,
  TRIAGE_MODEL,
  ANALYSIS_MODEL,
  API_DELAY_MS,
  TELEGRAM_MAX_CHARS,
} from '../src/config.js';

describe('config', () => {
  it('exports SEARCH_QUERY as a non-empty string', () => {
    expect(typeof SEARCH_QUERY).toBe('string');
    expect(SEARCH_QUERY.length).toBeGreaterThan(0);
  });

  it('exports SEARCH_MAX_RESULTS as a positive number', () => {
    expect(typeof SEARCH_MAX_RESULTS).toBe('number');
    expect(SEARCH_MAX_RESULTS).toBeGreaterThan(0);
  });

  it('exports SCOUT_QUERY as a non-empty string', () => {
    expect(typeof SCOUT_QUERY).toBe('string');
    expect(SCOUT_QUERY.length).toBeGreaterThan(0);
  });

  it('exports SCOUT_MAX_RESULTS as a positive number', () => {
    expect(typeof SCOUT_MAX_RESULTS).toBe('number');
    expect(SCOUT_MAX_RESULTS).toBeGreaterThan(0);
  });

  it('exports TRIAGE_MODEL as a non-empty string', () => {
    expect(typeof TRIAGE_MODEL).toBe('string');
    expect(TRIAGE_MODEL.length).toBeGreaterThan(0);
  });

  it('exports ANALYSIS_MODEL as a non-empty string', () => {
    expect(typeof ANALYSIS_MODEL).toBe('string');
    expect(ANALYSIS_MODEL.length).toBeGreaterThan(0);
  });

  it('exports API_DELAY_MS as a positive number', () => {
    expect(typeof API_DELAY_MS).toBe('number');
    expect(API_DELAY_MS).toBeGreaterThan(0);
  });

  it('exports TELEGRAM_MAX_CHARS as a positive number', () => {
    expect(typeof TELEGRAM_MAX_CHARS).toBe('number');
    expect(TELEGRAM_MAX_CHARS).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/config.test.js
```

Expected: FAIL — `Cannot find module '../src/config.js'`

- [ ] **Step 3: Create src/config.js**

```js
/** Tavily search query for Full Stack job listings in Italy. */
export const SEARCH_QUERY =
  '"Full Stack Developer" (Vue.js OR Nuxt) Node.js (Italia OR remoto) ("offerte di lavoro" OR "assunzione" OR "candidati")';

/** Maximum number of raw results to fetch from Tavily per hunt run. */
export const SEARCH_MAX_RESULTS = 20;

/** Tavily search query for Retail-Tech companies in Italy. */
export const SCOUT_QUERY =
  '("software house" OR "tech company" OR "digital agency") (retail OR logistica OR "punti vendita" OR e-commerce) Italia';

/** Maximum number of companies to fetch per scouting run. */
export const SCOUT_MAX_RESULTS = 6;

/** Groq model used for the boolean triage filter. */
export const TRIAGE_MODEL = 'llama-3.1-8b-instant';

/** DeepSeek model used for CV match analysis and pitch generation. */
export const ANALYSIS_MODEL = 'deepseek-chat';

/**
 * Delay in milliseconds between consecutive API calls.
 * Prevents hitting rate limits on Groq and DeepSeek free/low-cost tiers.
 */
export const API_DELAY_MS = 2500;

/**
 * Maximum character count per Telegram message chunk.
 * Telegram's hard limit is 4096; this value gives a safety buffer.
 */
export const TELEGRAM_MAX_CHARS = 4000;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/config.test.js
```

Expected: PASS — 8 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/config.js tests/config.test.js
git commit -m "feat: add src/config.js with centralized constants"
```

---

## Task 3: src/seen_store.js

**Files:**
- Create: `src/seen_store.js`
- Create: `tests/seen_store.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/seen_store.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadSeen, saveSeen } from '../src/seen_store.js';

let tmpFile;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), `seen_test_${Date.now()}.json`);
});

afterEach(() => {
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

describe('loadSeen', () => {
  it('returns an empty Set when the file does not exist', () => {
    const result = loadSeen(tmpFile);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns a Set populated with the stored URLs', () => {
    fs.writeFileSync(tmpFile, JSON.stringify(['https://a.com', 'https://b.com']));
    const result = loadSeen(tmpFile);
    expect(result.has('https://a.com')).toBe(true);
    expect(result.has('https://b.com')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('returns an empty Set on malformed JSON without throwing', () => {
    fs.writeFileSync(tmpFile, 'not {{ valid json');
    expect(() => loadSeen(tmpFile)).not.toThrow();
    expect(loadSeen(tmpFile).size).toBe(0);
  });
});

describe('saveSeen', () => {
  it('persists URLs so they can be reloaded by loadSeen', () => {
    const set = new Set(['https://x.com', 'https://y.com']);
    saveSeen(set, tmpFile);
    const reloaded = loadSeen(tmpFile);
    expect(reloaded.has('https://x.com')).toBe(true);
    expect(reloaded.has('https://y.com')).toBe(true);
    expect(reloaded.size).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/seen_store.test.js
```

Expected: FAIL — `Cannot find module '../src/seen_store.js'`

- [ ] **Step 3: Create src/seen_store.js**

```js
import fs from 'fs';
import path from 'path';

const DEFAULT_PATH = path.join(process.cwd(), 'data', 'seen_urls.json');

/**
 * Loads the set of already-processed URLs from disk.
 * Returns an empty Set if the file does not exist or contains invalid JSON.
 *
 * @param {string} [filePath] - Path to the JSON cache file. Defaults to data/seen_urls.json.
 * @returns {Set<string>}
 */
export function loadSeen(filePath = DEFAULT_PATH) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

/**
 * Persists the set of processed URLs to disk as a JSON array.
 *
 * @param {Set<string>} set - The full set of seen URLs to save.
 * @param {string} [filePath] - Path to the JSON cache file. Defaults to data/seen_urls.json.
 */
export function saveSeen(set, filePath = DEFAULT_PATH) {
  fs.writeFileSync(filePath, JSON.stringify([...set], null, 2));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/seen_store.test.js
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/seen_store.js tests/seen_store.test.js
git commit -m "feat: add seen_store for run-to-run URL deduplication"
```

---

## Task 4: Fix and test telegram_sender.js

**Files:**
- Modify: `src/telegram_sender.js`
- Create: `tests/telegram_sender.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/telegram_sender.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inviaATelegram, convertiMarkdownInHtml } from '../src/telegram_sender.js';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

describe('convertiMarkdownInHtml', () => {
  it('converts **bold** to <b>bold</b>', () => {
    expect(convertiMarkdownInHtml('**hello**')).toBe('<b>hello</b>');
  });

  it('converts [text](url) to an HTML anchor', () => {
    expect(convertiMarkdownInHtml('[click here](https://example.com)')).toBe(
      '<a href="https://example.com">click here</a>'
    );
  });

  it('escapes & to &amp;', () => {
    expect(convertiMarkdownInHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes < to &lt;', () => {
    expect(convertiMarkdownInHtml('a < b')).toBe('a &lt; b');
  });

  it('escapes > to &gt;', () => {
    expect(convertiMarkdownInHtml('a > b')).toBe('a &gt; b');
  });
});

describe('inviaATelegram', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '12345';
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    vi.restoreAllMocks();
  });

  it('returns true on a successful send', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const result = await inviaATelegram('Hello!');
    expect(result).toBe(true);
  });

  it('returns false when bot token is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const result = await inviaATelegram('Hello!');
    expect(result).toBe(false);
  });

  it('returns false when chat ID is missing', async () => {
    delete process.env.TELEGRAM_CHAT_ID;
    const result = await inviaATelegram('Hello!');
    expect(result).toBe(false);
  });

  it('returns false when Telegram API returns an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ description: 'Bad Request' }),
    }));
    const result = await inviaATelegram('Hello!');
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/telegram_sender.test.js
```

Expected: FAIL — `convertiMarkdownInHtml is not exported`

- [ ] **Step 3: Rewrite src/telegram_sender.js**

```js
import dotenv from 'dotenv';
dotenv.config();

/**
 * Converts the main Markdown constructs to HTML for safe rendering in Telegram.
 * Exported for unit testing.
 *
 * @param {string} text
 * @returns {string}
 */
export function convertiMarkdownInHtml(text) {
  // Escape HTML special characters first to prevent conflicts with inserted tags
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert **bold** to <b>
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Convert [text](url) to <a href="url">
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  return html;
}

/**
 * Sends a formatted HTML message to the configured Telegram chat.
 * Converts Markdown to HTML before sending; HTML parse mode is more robust
 * than Markdown for AI-generated text.
 *
 * @param {string} testo - Message text (Markdown is converted to HTML automatically)
 * @returns {Promise<boolean>} true if the message was delivered successfully
 */
export async function inviaATelegram(testo) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim().replace(/['"]/g, '');
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim().replace(/['"]/g, '');

  if (!token || !chatId) {
    console.error('❌ Error: Telegram credentials missing from .env');
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const testoInHtml = convertiMarkdownInHtml(testo);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testoInHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Telegram API Error: ${response.status} - ${errData.description}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending to Telegram:', error.message);
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/telegram_sender.test.js
```

Expected: PASS — 9 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/telegram_sender.js tests/telegram_sender.test.js
git commit -m "fix: export convertiMarkdownInHtml, add EN comments, add tests"
```

---

## Task 5: Fix and test spontaneous_analyzer.js

**Files:**
- Modify: `src/spontaneous_analyzer.js`
- Create: `tests/spontaneous_analyzer.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/spontaneous_analyzer.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/spontaneous_analyzer.test.js
```

Expected: the "choices missing" test FAILS with `TypeError: Cannot read properties of undefined`

- [ ] **Step 3: Rewrite src/spontaneous_analyzer.js**

```js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ANALYSIS_MODEL } from './config.js';
dotenv.config();

/**
 * Generates a spontaneous application strategy and cold-outreach pitch for a target company.
 * Reads the local CV and uses DeepSeek to craft a tailored message.
 *
 * @param {{ name: string, url: string, content: string }} azienda
 * @returns {Promise<string>} formatted pitch report, or an error string on failure
 */
export async function analizzaPerCandidaturaSpontanea(azienda) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    console.error('❌ Error: DEEPSEEK_API_KEY not configured.');
    return 'Analysis unavailable.';
  }

  const cvPath = path.join(process.cwd(), 'data', 'cv.md');
  let cvContesto = '';

  if (fs.existsSync(cvPath)) {
    try {
      cvContesto = fs.readFileSync(cvPath, 'utf-8');
      console.log('📖 [OK] CV loaded from: "data/cv.md"');
    } catch {
      console.warn('⚠️ Warning: CV file found but could not be read. Analysis will be generic.');
    }
  } else {
    console.warn('⚠️ Warning: CV not found at data/cv.md. Analysis will be generic.');
  }

  const systemPrompt = `
    You are a Senior Headhunter and Business Development expert in the Italian tech market.
    Your task is to help Simone Camerano apply spontaneously to a target tech company.

    Here is Simone's real CV:
    ${cvContesto}

    Analyze the provided company description and generate a structured report exactly like this (use HTML tags for formatting):

    🚀 <b>WHY THIS COMPANY?</b>
    (Explain in two lines what this company does and why it is interesting for Simone's stack)

    🎯 <b>THE STRATEGIC HOOK (YOUR VALUE)</b>
    (Highlight the synergy between the company's products/services and Simone's 26 years of operational experience
    in retail management, team coordination, and commercial relationships. Explain how Simone deeply understands
    the business logic of their clients or software.)

    ✉️ <b>COLD OUTREACH PITCH (EMAIL / LINKEDIN)</b>
    (Write a short, sharp, professional cover letter ready to send to the CTO or HR Manager.
    Tone: confident, focused on solving business problems and Node.js/Vue.js development.)
  `;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Analyze this company for a spontaneous application:\nName/Site: ${azienda.name} (${azienda.url})\nContext: ${azienda.content}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'Analysis unavailable.';
  } catch (error) {
    console.error('❌ DeepSeek Spontaneous Error:', error.message);
    return 'Error generating pitch.';
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/spontaneous_analyzer.test.js
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/spontaneous_analyzer.js tests/spontaneous_analyzer.test.js
git commit -m "fix: simplify CV path, add optional chaining on choices, add tests"
```

---

## Task 6: Test and update triage_filter.js

**Files:**
- Modify: `src/triage_filter.js`
- Create: `tests/triage_filter.test.js`

- [ ] **Step 1: Write the tests**

Create `tests/triage_filter.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { eseguiTriage } from '../src/triage_filter.js';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

const mockAnnuncio = {
  title: 'Full Stack Developer Vue.js + Node.js',
  content: 'Offerta per il mercato italiano. Stack richiesto: Node.js, Vue.js.',
};

describe('eseguiTriage', () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
    vi.restoreAllMocks();
  });

  it('returns true when Groq responds with "SI"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'SI' } }] }),
    }));
    expect(await eseguiTriage(mockAnnuncio)).toBe(true);
  });

  it('returns false when Groq responds with "NO"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'NO' } }] }),
    }));
    expect(await eseguiTriage(mockAnnuncio)).toBe(false);
  });

  it('returns true when response contains "SI" with trailing text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'SI, è valido' } }] }),
    }));
    expect(await eseguiTriage(mockAnnuncio)).toBe(true);
  });

  it('returns false when GROQ_API_KEY is missing', async () => {
    delete process.env.GROQ_API_KEY;
    expect(await eseguiTriage(mockAnnuncio)).toBe(false);
  });

  it('returns false on network error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    await expect(eseguiTriage(mockAnnuncio)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run tests against the current file**

```bash
npx vitest run tests/triage_filter.test.js
```

Expected: most tests PASS already; note which fail (likely none on behavior, but the import of `TRIAGE_MODEL` is not there yet).

- [ ] **Step 3: Rewrite src/triage_filter.js**

```js
import dotenv from 'dotenv';
import { TRIAGE_MODEL } from './config.js';
dotenv.config();

/**
 * Runs a boolean triage on a single job listing using Groq.
 * Sends the listing to a fast LLM that responds only "SI" or "NO" based on whether
 * it matches the Italian market and the target tech stack.
 *
 * @param {{ title: string, content: string }} annuncio
 * @returns {Promise<boolean>} true if the listing passes the filter, false otherwise
 */
export async function eseguiTriage(annuncio) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: GROQ_API_KEY not configured in .env');
    return false;
  }

  const systemPrompt = `You are a ruthless boolean logic filter for job listings.
Your ONLY job is to respond "SI" or "NO". Do not add explanations, greetings, or punctuation.

Criteria to respond "SI":
1. The offer must be explicitly for the ITALIAN market (work in Italy or Full Remote open to Italian residents).
2. The tech stack must include JavaScript/TypeScript and at least one of: Node.js, Vue.js, or Nuxt.
3. It must be a real job offer (discard freelancer profiles, forum posts, social posts, or help requests).

Mandatory criteria to respond "NO":
- If the position is clearly abroad (Canada, India, USA, etc.) and not open to Italy.
- If it is a "Senior" role requiring more than 6-8 years of experience, or a Lead/Director role.
- If the stack focuses only on other languages (pure Java, pure PHP, C#) without Node/Vue/Nuxt.

If the listing is valid respond: SI
If the listing is NOT valid respond: NO`;

  const userContent = `Title: ${annuncio.title}\nJob listing text: ${annuncio.content}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TRIAGE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        // temperature 0 ensures deterministic boolean output
        temperature: 0.0,
        // Only "SI" or "NO" expected; 5 tokens is more than sufficient
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.error?.message || response.statusText;
      throw new Error(`Groq API Error: ${response.status} - ${detail}`);
    }

    const data = await response.json();
    const clean = data.choices[0].message.content.trim().toUpperCase();
    return clean.includes('SI');

  } catch (error) {
    console.error('❌ Error during Groq triage:', error.message);
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/triage_filter.test.js
```

Expected: PASS — 5 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/triage_filter.js tests/triage_filter.test.js
git commit -m "refactor: use config constants in triage_filter, add EN comments and tests"
```

---

## Task 7: Test and update deepseek_analyzer.js

**Files:**
- Modify: `src/deepseek_analyzer.js`
- Create: `tests/deepseek_analyzer.test.js`

- [ ] **Step 1: Write the tests**

Create `tests/deepseek_analyzer.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analizzaConDeepSeek } from '../src/deepseek_analyzer.js';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));
vi.mock('fs');

import fs from 'fs';

const mockAnnuncio = {
  title: 'Full Stack Developer',
  url: 'https://example.com/job/123',
  content: 'Node.js backend, Vue.js frontend, Italian market.',
};

describe('analizzaConDeepSeek', () => {
  beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = 'test-key';
    vi.mocked(fs.readFileSync).mockReturnValue('# My CV\n## Skills\nNode.js, Vue.js');
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    vi.restoreAllMocks();
  });

  it('returns the report string on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Match score: 85%' } }] }),
    }));
    const result = await analizzaConDeepSeek(mockAnnuncio);
    expect(result).toBe('Match score: 85%');
  });

  it('returns an error string when DEEPSEEK_API_KEY is missing', async () => {
    delete process.env.DEEPSEEK_API_KEY;
    const result = await analizzaConDeepSeek(mockAnnuncio);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns an error string when the CV file cannot be read', async () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });
    const result = await analizzaConDeepSeek(mockAnnuncio);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns an error string on HTTP error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    }));
    const result = await analizzaConDeepSeek(mockAnnuncio);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests against current file**

```bash
npx vitest run tests/deepseek_analyzer.test.js
```

Expected: tests run; verify results before modifying the source.

- [ ] **Step 3: Rewrite src/deepseek_analyzer.js**

```js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ANALYSIS_MODEL } from './config.js';
dotenv.config();

/**
 * Reads the local CV and asks DeepSeek for a detailed CV-vs-listing match analysis.
 * Returns a Telegram-optimized report with match score, gap analysis, and a recruiter hook.
 *
 * @param {{ title: string, url: string, content: string }} annuncio
 * @returns {Promise<string>} compatibility report, or an error string on failure
 */
export async function analizzaConDeepSeek(annuncio) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: DEEPSEEK_API_KEY not configured in .env');
    return 'API configuration error.';
  }

  try {
    const cvPath = path.join(process.cwd(), 'data', 'cv.md');
    const cvContent = fs.readFileSync(cvPath, 'utf-8');

    const systemPrompt = `You are a Senior Headhunter and Career Counselor expert in the Italian tech market.
Analyze a job listing and cross-reference it with the user's CV to assess real compatibility,
highlighting strategic strengths (soft skills, business/management background) and technical gaps.

Generate a report in ITALIAN, optimized for Telegram (bold for titles, scannable text, no walls of text).

Structure the response EXACTLY like this:
🎯 **MATCH SCORE TECNICO**: [Percentage based on required Node/Vue/Nuxt stack]
📈 **IL SUPERPOTERE (SINERGIA DI BACKGROUND)**: [How the user's 20+ years of operational/commercial experience adds value in this role]
⚠️ **ANALISI DEL GAP**: [What is missing or should be studied/mentioned in the interview]
📝 **GANCIO PER MESSAGGIO / COPERTINA**: [3-4 line text ready to use for a recruiter or LinkedIn message]`;

    const userContent = `### MY CV:\n${cvContent}\n\n### JOB LISTING:\nTitle: ${annuncio.title}\nLink: ${annuncio.url}\nText: ${annuncio.content}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        // balance between creative cover letter writing and precise match scoring
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('❌ Error during DeepSeek analysis:', error);
    return 'Unable to generate DeepSeek analysis for this listing.';
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/deepseek_analyzer.test.js
```

Expected: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/deepseek_analyzer.js tests/deepseek_analyzer.test.js
git commit -m "refactor: use config constants in deepseek_analyzer, add EN comments and tests"
```

---

## Task 8: Update search_engine.js and company_scouter.js

**Files:**
- Modify: `src/search_engine.js`
- Modify: `src/company_scouter.js`

No behavior change — both files just need to import from config and have comments updated to English.

- [ ] **Step 1: Rewrite src/search_engine.js**

```js
import { tavily } from '@tavily/core';
import dotenv from 'dotenv';
import { SEARCH_QUERY, SEARCH_MAX_RESULTS } from './config.js';
dotenv.config();

/**
 * Searches the web for Full Stack (Vue.js / Nuxt / Node.js) job listings in Italy.
 * Uses Tavily's advanced search mode to retrieve rich page content for downstream filtering.
 *
 * @returns {Promise<Array<{title: string, url: string, content: string}>>}
 */
export async function cercaLavoriItalia() {
  const apiKey = process.env.TAVILY_API_KEY?.trim();

  if (!apiKey) {
    console.error('❌ Error: TAVILY_API_KEY missing from .env');
    return [];
  }

  const tvly = tavily({ apiKey });

  try {
    const response = await tvly.search(SEARCH_QUERY, {
      // Advanced depth analyzes full page text rather than just metadata
      searchDepth: 'advanced',
      maxResults: SEARCH_MAX_RESULTS,
    });

    if (!response || !response.results) {
      return [];
    }

    return response.results.map(result => ({
      title: result.title || 'Title not available',
      url: result.url || '#',
      content: result.content || '',
    }));

  } catch (error) {
    console.error('❌ Error during Tavily search:', error.message);
    return [];
  }
}
```

- [ ] **Step 2: Rewrite src/company_scouter.js**

```js
import { tavily } from '@tavily/core';
import dotenv from 'dotenv';
import { SCOUT_QUERY, SCOUT_MAX_RESULTS } from './config.js';
dotenv.config();

/**
 * Searches for tech companies and software houses in the Italian Retail/Logistics sector.
 * Returns company metadata for downstream spontaneous application analysis.
 *
 * @returns {Promise<Array<{name: string, url: string, content: string}>>}
 */
export async function scoutAziendeRetailTech() {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    console.error('❌ Error: TAVILY_API_KEY missing from .env');
    return [];
  }

  const tvly = tavily({ apiKey });

  try {
    const response = await tvly.search(SCOUT_QUERY, {
      searchDepth: 'advanced',
      maxResults: SCOUT_MAX_RESULTS,
    });

    if (!response || !response.results) return [];

    return response.results.map(result => ({
      name: result.title || 'Target Company',
      url: result.url || '#',
      content: result.content || '',
    }));
  } catch (error) {
    console.error('❌ Error during Tavily company scouting:', error.message);
    return [];
  }
}
```

- [ ] **Step 3: Run the full test suite to make sure nothing broke**

```bash
npm test
```

Expected: all previously passing tests still pass

- [ ] **Step 4: Commit**

```bash
git add src/search_engine.js src/company_scouter.js
git commit -m "refactor: use config constants in search_engine and company_scouter, EN comments"
```

---

## Task 9: Update index.js with deduplication

**Files:**
- Modify: `index.js`

- [ ] **Step 1: Rewrite index.js**

```js
import { cercaLavoriItalia } from './src/search_engine.js';
import { eseguiTriage } from './src/triage_filter.js';
import { analizzaConDeepSeek } from './src/deepseek_analyzer.js';
import { inviaATelegram } from './src/telegram_sender.js';
import { loadSeen, saveSeen } from './src/seen_store.js';
import { API_DELAY_MS, TELEGRAM_MAX_CHARS } from './src/config.js';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runHunter() {
  console.log('=====================================================');
  console.log(`🚀 ITALY-JOB-HUNTER LIVE: ${new Date().toLocaleString('it-IT')}`);
  console.log('=====================================================');

  // Stage 1: web search
  console.log('🔍 [STAGE 1] Scanning the web with Tavily...');
  const rawListings = await cercaLavoriItalia();
  console.log(`📊 Found ${rawListings.length} raw listings.`);

  if (rawListings.length === 0) {
    console.log('🏁 No listings found. Ending run.');
    return;
  }

  // Skip URLs already processed in previous runs to avoid duplicate notifications
  const seen = loadSeen();
  const newListings = rawListings.filter(a => !seen.has(a.url));
  console.log(`🗂  ${newListings.length} new listings after deduplication (${rawListings.length - newListings.length} skipped).`);

  if (newListings.length === 0) {
    console.log('🏁 All listings already processed. Ending run.');
    return;
  }

  console.log('-----------------------------------------------------');
  console.log('🧠 [STAGE 2] Triage with Groq + DeepSeek analysis...');

  const approvedCards = [];

  for (const listing of newListings) {
    const passed = await eseguiTriage(listing);

    if (passed) {
      console.log(`🔥 [APPROVED] Match found: "${listing.title}"`);
      console.log('🤖 [STAGE 3] Generating analysis with DeepSeek-V3...');
      const report = await analizzaConDeepSeek(listing);

      const card = `💼 <b>${listing.title.toUpperCase()}</b>\n\n${report}\n\n🔗 <a href="${listing.url}">View original listing</a>`;
      approvedCards.push(card);
    } else {
      console.log(`❌ [REJECTED] "${listing.title}" does not match.`);
    }

    // Mark URL as seen and add courtesy delay to avoid hitting API rate limits
    seen.add(listing.url);
    await wait(API_DELAY_MS);
  }

  // Persist the updated seen set before sending notifications
  saveSeen(seen);

  // Stage 4: send accumulated report to Telegram
  console.log('-----------------------------------------------------');
  if (approvedCards.length === 0) {
    console.log('🏁 Zero matches today. No notification sent.');
    console.log('=====================================================');
    return;
  }

  console.log(`📬 Sending report for ${approvedCards.length} position(s)...`);

  let buffer = `🔔 <b>ITALY-JOB-HUNTER - OPPORTUNITY REPORT</b>\n\n`;
  buffer += `${approvedCards.length} match(es) found in the last 24 hours.\n\n`;
  buffer += `═`.repeat(15) + `\n\n`;

  let sentCount = 0;

  for (const card of approvedCards) {
    // Chunk messages to stay safely below Telegram's 4096-character hard limit
    if ((buffer + card).length > TELEGRAM_MAX_CHARS) {
      const sent = await inviaATelegram(buffer);
      if (sent) sentCount++;
      buffer = `📦 <b>OPPORTUNITY REPORT (Continued...)</b>\n\n`;
    }
    buffer += card + `\n\n` + `═`.repeat(15) + `\n\n`;
  }

  if (buffer.trim() !== '') {
    const sent = await inviaATelegram(buffer);
    if (sent) sentCount++;
  }

  console.log(`✅ Report delivered! Total messages sent: ${sentCount}`);
  console.log('=====================================================');
}

runHunter();
```

- [ ] **Step 2: Run the full test suite to make sure nothing broke**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add index.js
git commit -m "feat: integrate seen_store deduplication into hunt pipeline, EN comments"
```

---

## Task 10: Update scouting.js

**Files:**
- Modify: `scouting.js`

- [ ] **Step 1: Rewrite scouting.js**

```js
import { scoutAziendeRetailTech } from './src/company_scouter.js';
import { analizzaPerCandidaturaSpontanea } from './src/spontaneous_analyzer.js';
import { inviaATelegram } from './src/telegram_sender.js';
import { API_DELAY_MS, TELEGRAM_MAX_CHARS } from './src/config.js';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runScouting() {
  console.log('=====================================================');
  console.log(`🔍 COMPANY MAPPING STARTED: ${new Date().toLocaleString('it-IT')}`);
  console.log('=====================================================');

  console.log('📡 Scanning the web for Retail-Tech companies in Italy...');
  const companies = await scoutAziendeRetailTech();
  console.log(`📊 Found ${companies.length} potential target companies.`);

  if (companies.length === 0) {
    console.log('🏁 No companies found in this session.');
    return;
  }

  const pitchCards = [];

  for (const company of companies) {
    console.log(`\n🏢 Analyzing positioning for: "${company.name}"...`);
    const report = await analizzaPerCandidaturaSpontanea(company);

    const card = `🏢 <b>COMPANY: ${company.name.toUpperCase()}</b>\n🌐 <a href="${company.url}">Visit website</a>\n\n${report}`;
    pitchCards.push(card);

    // Courtesy delay to avoid hitting API rate limits
    await wait(API_DELAY_MS);
  }

  console.log('\n-----------------------------------------------------');
  console.log('📬 Assembling and sending Spontaneous Applications Dossier...');

  let buffer = `🚀 <b>SPONTANEOUS APPLICATIONS DOSSIER</b>\n`;
  buffer += `Target companies identified today with their strategic pitches.\n\n`;
  buffer += `═`.repeat(15) + `\n\n`;

  let sentCount = 0;

  for (const card of pitchCards) {
    // Chunk messages to stay safely below Telegram's 4096-character hard limit
    if ((buffer + card).length > TELEGRAM_MAX_CHARS) {
      await inviaATelegram(buffer);
      sentCount++;
      buffer = `📦 <b>SPONTANEOUS DOSSIER (Continued...)</b>\n\n`;
    }
    buffer += card + `\n\n` + `═`.repeat(15) + `\n\n`;
  }

  if (buffer.trim() !== '') {
    await inviaATelegram(buffer);
    sentCount++;
  }

  console.log(`✅ Dossier sent to Telegram! Total messages: ${sentCount}`);
  console.log('=====================================================');
}

runScouting();
```

- [ ] **Step 2: Commit**

```bash
git add scouting.js
git commit -m "refactor: use config constants in scouting.js, EN comments"
```

---

## Task 11: Write README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# Italy Job Hunter

> An AI-powered job hunting automation tool that scans the Italian web for Full Stack Developer positions, filters them with a multi-stage AI pipeline, and delivers personalized match reports straight to your Telegram.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## Overview

Italy Job Hunter runs two independent pipelines:

**Hunt mode** — searches for active job listings targeting the Italian market and the Vue.js / Nuxt / Node.js stack, filters them with a fast AI triage, analyzes each one against your CV, and sends a formatted report to Telegram.

**Scout mode** — discovers Retail-Tech companies in Italy and generates a personalized cold-outreach pitch for each one, ready to send to a CTO or HR Manager.

```
Tavily (web search)
       │
       ▼
Groq / llama-3.1-8b-instant
(boolean triage — SI / NO)
       │ YES
       ▼
DeepSeek-V3
(CV match analysis + recruiter hook)
       │
       ▼
Telegram Bot
(formatted report)
```

---

## Prerequisites

- **Node.js 18** or higher
- API keys for the following services:

| Service | Purpose | Free tier? |
|---------|---------|------------|
| [Tavily](https://tavily.com) | Web search | Yes (limited) |
| [Groq](https://console.groq.com) | Triage filter (llama-3.1-8b-instant) | Yes |
| [DeepSeek](https://platform.deepseek.com) | CV match analysis | Pay-as-you-go, very cheap |
| [Telegram Bot](https://core.telegram.org/bots#botfather) | Push notifications | Free |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/Galdrial/italy-job-hunter.git
cd italy-job-hunter

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and fill in your API keys

# 4. Add your CV
# Replace data/cv.md with your own CV in Markdown format
```

---

## Configuration

### Environment variables (`.env`)

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from [@BotFather](https://t.me/botfather) |
| `TELEGRAM_CHAT_ID` | Your personal chat ID (use [@userinfobot](https://t.me/userinfobot) to find it) |
| `TAVILY_API_KEY` | Tavily API key |
| `GROQ_API_KEY` | Groq API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |

### Search constants (`src/config.js`)

All search queries, model names, and tuning parameters live in `src/config.js`. Edit this file to customize the tool without touching the pipeline logic.

| Constant | Default | Description |
|----------|---------|-------------|
| `SEARCH_QUERY` | *(see file)* | Tavily query for job listings |
| `SEARCH_MAX_RESULTS` | `20` | Max raw results per hunt run |
| `SCOUT_QUERY` | *(see file)* | Tavily query for company scouting |
| `SCOUT_MAX_RESULTS` | `6` | Max companies per scouting session |
| `TRIAGE_MODEL` | `llama-3.1-8b-instant` | Groq model for boolean filtering |
| `ANALYSIS_MODEL` | `deepseek-chat` | DeepSeek model for CV analysis |
| `API_DELAY_MS` | `2500` | Delay between calls (anti-rate-limit) |
| `TELEGRAM_MAX_CHARS` | `4000` | Message chunk size (Telegram limit: 4096) |

### CV (`data/cv.md`)

Replace `data/cv.md` with your own CV in Markdown format. The analyzer reads it at runtime to generate personalized match reports and cold-outreach pitches.

---

## Usage

```bash
# Find job listings and send match reports to Telegram
npm start

# Find Retail-Tech companies and generate cold-outreach pitches
npm run scout

# Run the test suite
npm test
```

---

## Project Structure

```
italy-job-hunter/
├── data/
│   └── cv.md                     Your CV in Markdown format
├── src/
│   ├── config.js                 Centralized constants (queries, models, limits)
│   ├── seen_store.js             Deduplication cache — tracks already-processed URLs
│   ├── search_engine.js          Stage 1: web search via Tavily API
│   ├── triage_filter.js          Stage 2: boolean AI filter via Groq
│   ├── deepseek_analyzer.js      Stage 3: CV match analysis via DeepSeek
│   ├── telegram_sender.js        Stage 4: formatted report delivery via Telegram
│   ├── company_scouter.js        Scouting: finds Retail-Tech companies via Tavily
│   └── spontaneous_analyzer.js   Scouting: generates cold-outreach pitches via DeepSeek
├── tests/                        Vitest test suite (runs fully offline, no API calls)
├── index.js                      Hunt mode orchestrator
├── scouting.js                   Scout mode orchestrator
├── .env.example                  Environment variable template
└── README.md                     This file
```

---

## Tech Stack

| Tool | Purpose | Why |
|------|---------|-----|
| [Tavily](https://tavily.com) | Web search | Purpose-built for AI agents; returns clean, structured page content |
| [Groq](https://console.groq.com) | Triage filter | Extremely fast inference at near-zero cost — ideal for simple boolean classification |
| [DeepSeek-V3](https://platform.deepseek.com) | CV analysis | High reasoning quality at a fraction of GPT-4 pricing |
| [Telegram Bot API](https://core.telegram.org/bots/api) | Notifications | Instant, formatted push notifications with zero UI to build |
| [Vitest](https://vitest.dev) | Testing | Native ESM support, zero config, excellent developer experience |

---

## Author

**Simone Camerano** — Full Stack Developer (Node.js / Vue.js / Nuxt 3)

26 years of operational and commercial experience in Italian retail (GDO), now applied to software development. I build tools that solve real business problems.

- 🌐 [simonecamerano.dev](https://simonecamerano.dev)
- 💼 [linkedin.com/in/simone-camerano](https://linkedin.com/in/simone-camerano)
- 🐙 [github.com/Galdrial](https://github.com/Galdrial)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add exhaustive English README"
```

---

## Task 12: Cleanup and final verification

**Files:**
- Delete: `test_search.js`

- [ ] **Step 1: Delete test_search.js**

```bash
rm test_search.js
```

- [ ] **Step 2: Run the complete test suite**

```bash
npm test
```

Expected output: all tests pass with a summary like:
```
 ✓ tests/config.test.js (8)
 ✓ tests/seen_store.test.js (4)
 ✓ tests/triage_filter.test.js (5)
 ✓ tests/deepseek_analyzer.test.js (4)
 ✓ tests/spontaneous_analyzer.test.js (4)
 ✓ tests/telegram_sender.test.js (9)

 Test Files  6 passed (6)
 Tests       34 passed (34)
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: remove test_search.js debug file"
```
