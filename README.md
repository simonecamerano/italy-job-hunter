# Italy Job Hunter

> An AI pipeline that automates the entire job hunting workflow for the Italian tech market — from web search to personalized CV analysis — and delivers results directly to Telegram.

Built because manually scanning job boards every day is a solved problem. This tool runs unattended, filters noise with a fast LLM, and only surfaces opportunities that actually match your profile.

---

## How It Works

Two independent pipelines, both running fully automated:

**Hunt mode** — finds active job listings targeting the Italian market, runs a fast boolean AI triage, analyzes each match against your CV, and delivers a formatted report to Telegram.

**Scout mode** — discovers target companies in Italy and generates a personalized cold-outreach pitch for each one, ready to send to a CTO or HR Manager.

```
Tavily (web search)
       │
       ▼
Groq / llama-3.1-8b-instant
(boolean triage — YES / NO)
       │ YES
       ▼
DeepSeek-V3
(CV match analysis + recruiter hook)
       │
       ▼
Telegram Bot
(formatted report)
```

Each model is assigned the task it handles best: Groq for fast, cheap boolean classification — DeepSeek for deep reasoning and personalization. No single model does everything.

---

## Why Multi-Model

A single LLM for the entire pipeline is expensive and slow. This architecture uses:

- **Groq/llama-3.1-8b-instant** for triage — inference in milliseconds, near-zero cost, perfect for a binary yes/no filter
- **DeepSeek-V3** for analysis — high reasoning quality at a fraction of GPT-4 pricing, handles nuanced CV matching

The result: processing 20 job listings costs less than a cent and completes in under 30 seconds.

---

## Prerequisites

- **Node.js 18** or higher
- API keys for the following services (all have free or very cheap tiers):

| Service | Purpose | Cost |
|---|---|---|
| [Tavily](https://tavily.com) | Web search | Free tier available |
| [Groq](https://console.groq.com) | Boolean triage | Free |
| [DeepSeek](https://platform.deepseek.com) | CV analysis | Pay-as-you-go, very cheap |
| [Telegram Bot](https://core.telegram.org/bots#botfather) | Delivery | Free |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/simonecamerano/italy-job-hunter.git
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

## Usage

```bash
# Find job listings and send match reports to Telegram
npm start

# Find target companies and generate cold-outreach pitches
npm run scout

# Run the test suite
npm test
```

---

## Configuration

### Environment variables (`.env`)

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Your bot token from [@BotFather](https://t.me/botfather) |
| `TELEGRAM_CHAT_ID` | Your personal chat ID (use [@userinfobot](https://t.me/userinfobot)) |
| `TAVILY_API_KEY` | Tavily API key |
| `GROQ_API_KEY` | Groq API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |

### Search constants (`src/config.js`)

All search queries, model names, and tuning parameters live in `src/config.js`. Edit this file to adapt the tool to any stack or market without touching the pipeline logic.

| Constant | Default | Description |
|---|---|---|
| `SEARCH_QUERY` | *(see file)* | Tavily query for job listings |
| `SEARCH_MAX_RESULTS` | `20` | Max raw results per hunt run |
| `SCOUT_QUERY` | *(see file)* | Tavily query for company scouting |
| `SCOUT_MAX_RESULTS` | `6` | Max companies per scouting session |
| `TRIAGE_MODEL` | `llama-3.1-8b-instant` | Groq model for boolean filtering |
| `ANALYSIS_MODEL` | `deepseek-chat` | DeepSeek model for CV analysis |
| `API_DELAY_MS` | `2500` | Delay between calls (rate limit safety) |
| `TELEGRAM_MAX_CHARS` | `4000` | Message chunk size (Telegram limit: 4096) |

### CV (`data/cv.md`)

Replace `data/cv.md` with your own CV in Markdown format. The analyzer reads it at runtime to generate personalized match reports and cold-outreach pitches. The quality of the output scales directly with the quality of your CV file.

---

## Project Structure

```
italy-job-hunter/
├── data/
│   └── cv.md                     Your CV in Markdown format
├── src/
│   ├── config.js                 Centralized constants — queries, models, limits
│   ├── seen_store.js             Deduplication cache — no duplicate results
│   ├── search_engine.js          Stage 1: web search via Tavily
│   ├── triage_filter.js          Stage 2: boolean AI filter via Groq
│   ├── deepseek_analyzer.js      Stage 3: CV match analysis via DeepSeek
│   ├── telegram_sender.js        Stage 4: formatted delivery via Telegram
│   ├── company_scouter.js        Scout: finds target companies via Tavily
│   └── spontaneous_analyzer.js   Scout: generates cold-outreach pitches via DeepSeek
├── tests/                        Vitest test suite — runs fully offline, no API calls
├── index.js                      Hunt mode orchestrator
├── scouting.js                   Scout mode orchestrator
└── .env.example                  Environment variable template
```

---

## Tech Stack

| Tool | Purpose | Why |
|---|---|---|
| [Tavily](https://tavily.com) | Web search | Purpose-built for AI agents; returns clean, structured content |
| [Groq](https://console.groq.com) | Triage filter | Fastest inference available — ideal for high-volume boolean classification |
| [DeepSeek-V3](https://platform.deepseek.com) | CV analysis | High reasoning quality at a fraction of GPT-4 pricing |
| [Telegram Bot API](https://core.telegram.org/bots/api) | Delivery | Instant push notifications, zero UI to build or maintain |
| [Vitest](https://vitest.dev) | Testing | Native ESM support, zero config |

---

## Adapting to Your Stack

The pipeline is not Italy-specific. To use it for a different market or tech stack:

1. Edit `SEARCH_QUERY` and `SCOUT_QUERY` in `src/config.js`
2. Replace `data/cv.md` with your own CV
3. Swap model names if you prefer different providers — the interfaces are modular

The core pipeline logic does not need to change.

---

## Author

**Simone Camerano** — AI workflow engineer and full stack developer.

I build systems that automate complex, multi-step processes. This tool came out of a real problem: the Italian tech job market is fragmented and noisy. Manual searching wastes time that could be automated.

- 🌐 [simonecamerano.dev](https://simonecamerano.dev)
- 💼 [linkedin.com/in/simone-camerano](https://linkedin.com/in/simone-camerano)
- 🐙 [github.com/simonecamerano](https://github.com/simonecamerano)

---

## License

ISC
