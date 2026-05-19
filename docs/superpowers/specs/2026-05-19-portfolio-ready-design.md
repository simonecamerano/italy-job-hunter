# Design: Portfolio-Ready Italy Job Hunter

**Date:** 2026-05-19  
**Approach:** A — Fix + Polish  
**Status:** Approved

---

## Goal

Transform the existing working prototype into a portfolio-ready project by:
- Fixing 6 identified bugs/issues
- Adding English JSDoc comments where non-obvious
- Adding a deduplication cache
- Extracting a `src/config.js` for all hardcoded constants
- Adding a full Vitest test suite
- Writing an exhaustive English README

---

## Final File Structure

```
italy-job-hunter/
├── data/
│   ├── cv.md                      (unchanged)
│   └── seen_urls.json             (NEW — deduplication cache, gitignored)
├── src/
│   ├── config.js                  (NEW — all project constants)
│   ├── seen_store.js              (NEW — read/write seen_urls.json)
│   ├── search_engine.js           (fix + EN comments)
│   ├── triage_filter.js           (fix + EN comments)
│   ├── deepseek_analyzer.js       (fix + EN comments)
│   ├── spontaneous_analyzer.js    (fix error handling + EN comments)
│   ├── company_scouter.js         (fix + EN comments)
│   └── telegram_sender.js         (fix + EN comments)
├── tests/
│   ├── config.test.js
│   ├── seen_store.test.js
│   ├── triage_filter.test.js
│   ├── deepseek_analyzer.test.js
│   ├── spontaneous_analyzer.test.js
│   └── telegram_sender.test.js
├── index.js                       (integrate deduplication + EN comments)
├── scouting.js                    (EN comments)
├── .gitignore                     (fix: add node_modules/, data/seen_urls.json)
├── package.json                   (fix: main→index.js, add start/scout/test scripts)
├── vitest.config.js               (NEW)
├── .env.example                   (unchanged)
└── README.md                      (NEW — exhaustive, in English)
```

`test_search.js` is deleted — it was a temporary debug file superseded by the formal test suite.

---

## New Modules

### `src/config.js`

Centralizes all hardcoded constants. Exports:
- `SEARCH_QUERY` — Tavily job search query string
- `SEARCH_MAX_RESULTS` — max results from Tavily (default: 20)
- `SCOUT_QUERY` — Tavily company scouting query string
- `SCOUT_MAX_RESULTS` — max results for scouting (default: 6)
- `TRIAGE_MODEL` — Groq model ID (default: `llama-3.1-8b-instant`)
- `ANALYSIS_MODEL` — DeepSeek model ID (default: `deepseek-chat`)
- `API_DELAY_MS` — anti-rate-limit delay between calls (default: 2500)
- `TELEGRAM_MAX_CHARS` — chunking threshold for Telegram messages (default: 4000)

### `src/seen_store.js`

Manages the deduplication cache at `data/seen_urls.json`.

- `loadSeen(): Set<string>` — reads the file, returns a Set of known URLs. Returns empty Set if file doesn't exist or is malformed.
- `saveSeen(set: Set<string>): void` — serializes the Set to JSON and writes to disk.

`data/seen_urls.json` is added to `.gitignore` — it contains personal run data and should not be committed.

---

## Bug Fixes

| # | File | Fix |
|---|------|-----|
| 1 | `.gitignore` | Add `node_modules/` and `data/seen_urls.json` |
| 2 | `package.json` | Set `"main": "index.js"`, add `start`, `scout`, `test` npm scripts |
| 3 | `spontaneous_analyzer.js` | Add `data.choices?.[0]` guard before property access (mirrors `deepseek_analyzer.js`) |
| 4 | `spontaneous_analyzer.js` | Replace multi-path CV search with `path.join(process.cwd(), 'data', 'cv.md')` — same pattern as `deepseek_analyzer.js`. Log warning and return error string if not found. |
| 5 | `index.js` | Integrate `seen_store`: filter already-seen URLs before triage; save new URLs after successful processing |
| 6 | `test_search.js` | Delete |

---

## Comments Strategy

English-only. Minimal but purposeful:
- **JSDoc header** on every exported function (params, return type, one-line description)
- **Inline comments** only where the *why* is non-obvious:
  - `temperature: 0.0` in triage (deterministic boolean output)
  - `max_tokens: 5` in triage (only "SI" or "NO" expected)
  - 4000-char chunking threshold (Telegram hard limit is 4096, buffer for safety)
  - `API_DELAY_MS` delay (anti-rate-limit courtesy pause)
- No comments on self-explanatory code

---

## Testing Strategy

**Framework:** Vitest (native ESM, zero config for `"type": "module"` projects)

All tests run fully offline — all `fetch` calls and filesystem I/O are mocked via `vi.fn()` / `vi.mock()`.

### Test files and cases

**`config.test.js`**
- All exported values are defined and of the correct type

**`seen_store.test.js`** (real temp file I/O)
- `loadSeen()` returns empty Set when file doesn't exist
- `loadSeen()` returns correct Set from existing file
- `saveSeen()` persists URLs correctly
- `loadSeen()` does not throw on malformed JSON

**`triage_filter.test.js`** (mocks `fetch`)
- "SI" response → returns `true`
- "NO" response → returns `false`
- "SI, perché..." (extra text) → returns `true`
- Missing API key → returns `false` without throwing
- Network error → returns `false` without throwing

**`deepseek_analyzer.test.js`** (mocks `fetch` and `fs`)
- Returns report string on success
- Missing API key → returns error string, no throw
- CV file not found → returns error string, no throw
- DeepSeek HTTP error → returns error string, no throw

**`spontaneous_analyzer.test.js`** (mocks `fetch` and `fs`)
- Returns pitch string on success
- Missing `data.choices` in response → returns error string, no throw

**`telegram_sender.test.js`** (mocks `fetch`)
- Note: `convertiMarkdownInHtml` must be exported (currently private) to be unit-tested directly
- `convertiMarkdownInHtml`: converts `**bold**` → `<b>bold</b>`
- `convertiMarkdownInHtml`: converts `[text](url)` → `<a href="url">text</a>`
- `convertiMarkdownInHtml`: escapes `&`, `<`, `>`
- Successful send → returns `true`
- Missing credentials → returns `false`
- Telegram API error → returns `false`

**Expected coverage:** ~90% of source lines. `index.js` and `scouting.js` (orchestrators) are not directly tested — all their components are covered.

---

## README Structure (English)

```
# Italy Job Hunter
One-line description + badges (Node.js, license)

## Overview
What it does, why it exists, ASCII pipeline diagram

## Pipeline
Tavily → Groq triage → DeepSeek analysis → Telegram notification

## Prerequisites
Node.js 18+, required API keys

## Installation
git clone → npm install → cp .env.example .env → fill keys

## Configuration
Table of all env vars + explanation of src/config.js constants

## Usage
npm start          # job hunt mode
npm run scout      # company scouting mode
npm test           # run test suite

## Project Structure
File tree with one-line description per entry

## Tech Stack
Tavily / Groq / DeepSeek / Telegram — with links and rationale for each choice

## Author
Simone Camerano — GitHub, LinkedIn, website links
```

---

## Out of Scope

- CLI interface (commander.js) — deferred, not needed for portfolio goals
- OOP refactor — current procedural pattern is idiomatic for Node.js scripts
- SQLite or external DB for deduplication — JSON file is sufficient
- Scheduling / cron — not part of this iteration
