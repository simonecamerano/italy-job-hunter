/** Tavily search query for Full Stack, Frontend, and Backend job listings (remote only). */
export const SEARCH_QUERY =
  '("Full Stack Developer" OR "Frontend Developer" OR "Backend Developer") (Node.js OR TypeScript OR React OR Vue.js OR Nuxt OR Next.js OR "C#" OR ".NET" OR dotnet) remoto ("offerte di lavoro" OR "assunzione" OR "candidati")';

/** Maximum number of raw results to fetch from Tavily per hunt run. */
export const SEARCH_MAX_RESULTS = 20;

/** Tavily search query for Italian tech companies: software houses, startups, 100+ employees, hiring remote. */
export const SCOUT_QUERY =
  '("software house" OR "tech company" OR "startup" OR "scaleup" OR "scale-up") Italia ("remote" OR "lavoro remoto" OR "full remote" OR "da remoto") ("full-time" OR "tempo pieno" OR "indeterminato")';

/** Maximum number of companies to fetch per scouting run. */
export const SCOUT_MAX_RESULTS = 6;

/** Groq model used for the boolean triage filter. */
export const TRIAGE_MODEL = "llama-3.1-8b-instant";

/** Ollama model used for CV match analysis and pitch generation. */
export const ANALYSIS_MODEL = "qwen3.5:latest";

/** Base URL of the local Ollama OpenAI-compatible API. */
export const OLLAMA_BASE_URL = "http://localhost:11434/v1";

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

/**
 * Minimum match score (0–100) required to include a listing in the Telegram report.
 * Listings analysed by DeepSeek but scoring below this threshold are silently dropped.
 */
export const MIN_MATCH_SCORE = 65;
