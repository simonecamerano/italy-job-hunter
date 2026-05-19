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
