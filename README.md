# Italy Job Hunter

> AI-powered job hunting automation for the Italian tech market. Scans the web, filters listings through a multi-stage AI pipeline, and delivers personalized match reports to your Telegram — or prints them to the terminal.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## Features

- **Hunt mode** — searches active job listings targeting Italy, runs them through a fast boolean triage, deep-analyzes each match against your CV, and delivers a formatted report via Telegram or terminal.
- **Scout mode** — discovers Italian tech companies and generates a ready-to-send cold-outreach pitch for each one, personalized to your background.
- **Interactive setup wizard** — one-time CLI wizard configures everything (API keys, CV, roles, stack, AI engine). No manual `.env` editing required.
- **Deduplication** — already-processed URLs are cached so you never see the same listing twice.
- **Flexible AI backend** — run analysis locally with Ollama (free, private) or in the cloud with DeepSeek (pay-per-use).
- **Telegram bot** — optional persistent bot mode that responds to `/hunt`, `/scout`, and `/status` commands 24/7.
- **Docker-ready** — ship the bot to any VPS or Raspberry Pi with a single `docker compose up -d`.

---

## Setup

### Prerequisites

- Node.js 18 or higher
- API keys — the setup wizard asks for them on first run

| Service                                                  | Purpose            | Required       | Free?               |
| -------------------------------------------------------- | ------------------ | -------------- | ------------------- |
| [Tavily](https://tavily.com)                             | Web search         | Yes            | Limited free tier   |
| [Groq](https://console.groq.com)                         | Fast triage filter | Yes            | Free                |
| [Telegram Bot](https://core.telegram.org/bots#botfather) | Push notifications | No             | Free                |
| [Ollama](https://ollama.com)                             | Local CV analysis  | Only if chosen | Free (runs locally) |
| [DeepSeek](https://platform.deepseek.com)                | Cloud CV analysis  | Only if chosen | ~$0.001/call        |

### Obtaining API Keys

#### Tavily (required — web search)

1. Go to [app.tavily.com](https://app.tavily.com) and create a free account.
2. In the dashboard, copy the **API Key** shown on the home screen.
3. Free tier includes 1,000 searches/month — enough for daily runs.

#### Groq (required — triage filter)

1. Go to [console.groq.com](https://console.groq.com) and sign up for free.
2. Navigate to **API Keys** in the left sidebar.
3. Click **Create API Key**, give it a name, and copy the generated key.
4. The free tier is sufficient — triage requests use `max_tokens: 5`.

#### Telegram Bot Token and Chat ID (optional — push notifications)

**Bot token:**

1. Open Telegram and search for **@BotFather**.
2. Send `/newbot` and follow the prompts (pick a name and username).
3. BotFather replies with a token in the format `123456789:ABCdef...` — copy it.

**Chat ID:**

1. Search for **@userinfobot** on Telegram.
2. Send it any message (e.g. `/start`).
3. It replies with your numeric chat ID — copy it.

> The bot only responds to messages from this exact chat ID. All other senders are silently ignored.

#### Ollama (optional — local AI analysis, no API key required)

1. Install Ollama from [ollama.com/download](https://ollama.com/download).
2. Start the server: `ollama serve`
3. Pull a model — the setup wizard detects installed models automatically:

```bash
ollama pull qwen3:latest      # recommended — good balance of speed and quality
ollama pull llama3.2:latest   # alternative
```

4. No API key needed. The wizard connects to `http://localhost:11434` by default.

#### DeepSeek (optional — cloud AI analysis)

1. Go to [platform.deepseek.com](https://platform.deepseek.com) and create an account.
2. Navigate to **API Keys** and click **Create new secret key**.
3. Copy the key — it is shown only once.
4. Top up a small credit (e.g. $2) — each analysis call costs roughly $0.001.

### Install

```bash
git clone https://github.com/simone98dm/italy-job-hunter.git

cd italy-job-hunter

npm install

npm start
```

On first run the wizard launches automatically and walks through every configuration step. Subsequent runs skip straight to the pipeline.

### What the wizard configures

**1. Search preferences** — target roles and tech stack as comma-separated keywords.

**2. Company types** — for scout mode (e.g. `startup, software house, tech company`).

**3. Your CV** — paste the full path to a `.md` file; the wizard copies it to `data/cv.md`.

**4. API keys** — only asks for keys that are missing from `.env`.

**5. Telegram (optional)** — skip this to print results to the terminal instead. No functionality is lost.

**6. AI engine** — choose Ollama (local) or DeepSeek (cloud). If Ollama is selected, the wizard detects all installed models and lets you pick one.

All choices are saved to `data/user-config.json`. Re-run the wizard any time by answering **Yes** when prompted, or delete `data/user-config.json` and restart.

---

## Usage

```bash
# Job hunt — find listings, analyze against CV, deliver report
npm start

# Skip setup prompts and run immediately with existing config
npm start -- --dry-run

# Company scout — find Italian companies, generate cold-outreach pitches
npm run scout

# Scout with dry-run
npm run scout -- --dry-run

# Persistent Telegram bot — listens for commands 24/7
npm run bot

# Run the test suite (fully offline, no API calls)
npm test
```

### Telegram bot commands

| Command   | Action                                      |
| --------- | ------------------------------------------- |
| `/hunt`   | Trigger a job-listing run                   |
| `/scout`  | Trigger a company-scouting run              |
| `/status` | Check whether a pipeline is already running |

Only messages from the configured `TELEGRAM_CHAT_ID` are processed.

### Docker (persistent bot)

Complete the wizard locally at least once so `data/user-config.json` and `data/cv.md` exist, then:

```bash
docker compose up -d   # build and start
docker compose logs -f # stream logs
docker compose down    # stop
```

---

## How Analysis Works

Each run executes a four-stage pipeline. Every stage is a gate — a listing must pass to advance.

```
┌─────────────────────────────────────────────────────────────────┐
│                        HUNT PIPELINE                            │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐
  │  Tavily Web  │     │ Career Pages │   ← user-defined roles + stack
  │   Search     │     │   Search     │
  └──────┬───────┘     └──────┬───────┘
         └──────────┬─────────┘
                    │ merge + deduplicate by URL
                    ▼
         ┌──────────────────────┐
         │  Deduplication store │  ← seen_urls.json
         │  (skip known URLs)   │
         └──────────┬───────────┘
                    │ new listings only
                    ▼
         ┌──────────────────────┐
         │   STAGE 2 — TRIAGE   │  ← Groq / llama-3.1-8b-instant
         │   Boolean SI / NO    │     temperature: 0.0, max_tokens: 5
         └──────────┬───────────┘
              SI    │    NO
         ┌──────────┘    └──────────────────────────────────────┐
         ▼                                                       ▼
┌─────────────────────┐                                  ❌ rejected
│  STAGE 3 — ANALYSIS │  ← Ollama (local) or DeepSeek
│  CV vs listing      │     temperature: 0.3
│  match report       │     Reads: data/cv.md
└──────────┬──────────┘
           │
   score ≥ MIN_MATCH_SCORE (65%)?
           │ YES                  NO → 📉 filtered
           ▼
  ┌──────────────────────┐
  │   STAGE 4 — REPORT   │
  │   Telegram or        │
  │   terminal output    │
  └──────────────────────┘
```

### Scout pipeline

```
  ┌──────────────────────┐
  │  Tavily — company    │  ← user-defined company types + location
  │  search              │
  └──────────┬───────────┘
             │
             ▼
  ┌──────────────────────┐
  │  Company triage      │  ← Groq: "Is this an Italian company? SI / NO"
  └──────────┬───────────┘
        SI   │   NO → ❌ rejected
             ▼
  ┌──────────────────────┐
  │  Cold-outreach pitch │  ← Ollama / DeepSeek + CV
  │  generator           │
  └──────────┬───────────┘
             ▼
  ┌──────────────────────┐
  │  Telegram / terminal │
  └──────────────────────┘
```

### Triage decision criteria

The Groq triage answers **SI** only when all of the following are true:

| Check          | Rule                                                       |
| -------------- | ---------------------------------------------------------- |
| Italian market | Work in Italy or full-remote open to Italian residents     |
| Tech stack     | At least one of user's configured stack keywords present   |
| Role match     | Role matches or closely relates to user's configured roles |
| Real offer     | Not a freelancer profile, forum post, or social post       |

Hard **NO** triggers:

| Trigger          | Rule                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| Abroad           | Position clearly in Canada, India, USA, UK, etc. with no Italian opening |
| Foreign language | Listing in English with no mention of Italy or Italian cities            |
| Seniority        | "Senior" with > 6–8 years required, or Lead / Director roles             |
| Stack mismatch   | None of the user's stack keywords appear                                 |

### Static values used in the workflow

| Constant                 | Default                | Source                 | Role                                       |
| ------------------------ | ---------------------- | ---------------------- | ------------------------------------------ |
| `SEARCH_MAX_RESULTS`     | `20`                   | `src/config.js`        | Max raw listings fetched per run           |
| `SCOUT_MAX_RESULTS`      | `6`                    | `src/config.js`        | Max companies fetched per scout run        |
| `TRIAGE_MODEL`           | `llama-3.1-8b-instant` | `src/config.js`        | Groq model for boolean triage              |
| `API_DELAY_MS`           | `2500`                 | `src/config.js`        | Delay between API calls (rate-limit guard) |
| `MIN_MATCH_SCORE`        | `65`                   | `src/config.js`        | Minimum CV match % to include in report    |
| `temperature` (triage)   | `0.0`                  | `src/triage_filter.js` | Deterministic boolean output               |
| `temperature` (analysis) | `0.3`                  | `src/job_analyzer.js`  | Controlled but expressive analysis         |
| `max_tokens` (triage)    | `5`                    | `src/triage_filter.js` | Only "SI" or "NO" expected                 |
| `max_tokens` (analysis)  | `8000`                 | `src/job_analyzer.js`  | Full structured report                     |

### Analysis report structure

The deep analysis always returns a Telegram-formatted Italian report with four sections:

| Section                 | Content                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| 🎯 Match Score          | % technical compatibility with the listing's required stack          |
| 📈 Il Superpotere       | How the candidate's unique background creates value for this company |
| ⚠️ Analisi del Gap      | What is missing or should be addressed in the interview              |
| 📝 Gancio per Messaggio | 3–4 lines ready to paste into a recruiter message or LinkedIn note   |

---

## Configuration Reference

### `data/user-config.json`

Generated by the wizard. Edit at any time.

```json
{
  "search": {
    "roles": ["Full Stack Developer", "Frontend Developer"],
    "stack": ["Vue.js", "Node.js", "TypeScript"],
    "location": "remoto",
    "keywords": ["offerte di lavoro", "assunzione", "candidati"]
  },
  "scout": {
    "companyTypes": ["software house", "startup", "scaleup"],
    "location": "Italia",
    "workMode": ["remote", "lavoro remoto", "full remote"],
    "contract": ["full-time", "tempo pieno", "indeterminato"]
  },
  "analysis": {
    "provider": "ollama",
    "model": "qwen3.5:latest",
    "baseUrl": "http://localhost:11434/v1"
  }
}
```

To switch to DeepSeek, change the `analysis` block and add `DEEPSEEK_API_KEY` to `.env`:

```json
"analysis": {
  "provider": "deepseek",
  "model": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com/v1"
}
```

### Environment variables (`.env`)

| Variable             | Required               | Description                     |
| -------------------- | ---------------------- | ------------------------------- |
| `TAVILY_API_KEY`     | Yes                    | Tavily API key                  |
| `GROQ_API_KEY`       | Yes                    | Groq API key                    |
| `TELEGRAM_BOT_TOKEN` | No                     | Bot token from @BotFather       |
| `TELEGRAM_CHAT_ID`   | No                     | Your chat ID (use @userinfobot) |
| `DEEPSEEK_API_KEY`   | Only if using DeepSeek | DeepSeek API key                |

Copy `.env.example` to `.env` as a starting point, or let the wizard populate it.

---

## Project Structure

```
italy-job-hunter/
├── data/
│   ├── cv.md                     Your CV (copied here by the setup wizard)
│   ├── user-config.json          Search preferences (written by the setup wizard)
│   └── seen_urls.json            Deduplication cache (auto-created on first run)
├── src/
│   ├── setup/
│   │   ├── wizard.js             First-run interactive setup wizard
│   │   ├── config-builder.js     Converts structured config → Tavily query strings
│   │   ├── env-writer.js         Reads and writes .env key-value pairs
│   │   └── ollama-client.js      Lists locally installed Ollama models
│   ├── config.js                 Loads user-config.json, exports all runtime constants
│   ├── seen_store.js             Deduplication — tracks already-processed URLs
│   ├── utils.js                  Shared primitives: wait, deduplicateByUrl, parseMatchScore
│   ├── llm_client.js             Shared OpenAI-compat HTTP wrapper used by both analyzers
│   ├── search_engine.js          Stage 1: web search via Tavily
│   ├── triage_filter.js          Stage 2: boolean AI filter via Groq
│   ├── job_analyzer.js           Stage 3: CV match analysis (Ollama or DeepSeek)
│   ├── telegram_sender.js        Stage 4: report delivery via Telegram or terminal
│   ├── career_companies.js       Fetches and filters curated company domain list
│   ├── career_search.js          Stage 1b: searches curated company career pages
│   ├── company_scouter.js        Scouting: finds target companies via Tavily
│   └── spontaneous_analyzer.js   Scouting: generates cold-outreach pitches
├── tests/                        Vitest test suite (fully offline, no API calls)
├── index.js                      Hunt mode entry point
├── scouting.js                   Scout mode entry point
├── bot.js                        Telegram bot — listens for /hunt, /scout, /status
├── Dockerfile                    Container image (node:20-alpine)
├── docker-compose.yml            Compose file for persistent bot deployment
├── .env.example                  Environment variable template
└── README.md                     This file
```

---

## Tech Stack

| Tool                                                     | Purpose           | Why                                                            |
| -------------------------------------------------------- | ----------------- | -------------------------------------------------------------- |
| [Tavily](https://tavily.com)                             | Web search        | Purpose-built for AI agents; returns clean, structured content |
| [Groq](https://console.groq.com)                         | Triage filter     | Extremely fast inference at near-zero cost                     |
| [Ollama](https://ollama.com)                             | Local CV analysis | Zero cost, no API key, full privacy                            |
| [DeepSeek](https://platform.deepseek.com)                | Cloud CV analysis | High reasoning quality, fraction of GPT-4 cost                 |
| [@clack/prompts](https://github.com/bombshell-dev/clack) | Setup wizard CLI  | Beautiful interactive prompts, zero config                     |
| [Telegram Bot API](https://core.telegram.org/bots/api)   | Notifications     | Instant push notifications with no UI to build                 |
| [Vitest](https://vitest.dev)                             | Testing           | Native ESM support, zero config                                |

---

## Credits

**Author — Simone Camerano**
Full Stack Developer

- [github.com/Galdrial](https://github.com/Galdrial)

**Contributor — simone98dm**
Software engineer contributing to the Ollama integration, setup wizard, and pipeline improvements.

- [github.com/simone98dm](https://github.com/simone98dm)
