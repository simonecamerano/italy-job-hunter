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

/**
 * Minimum match score (0–100) required to include a listing in the Telegram report.
 * Listings analysed by DeepSeek but scoring below this threshold are silently dropped.
 */
export const MIN_MATCH_SCORE = 65;
