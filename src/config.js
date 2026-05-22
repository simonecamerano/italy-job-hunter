import fs from 'fs';
import path from 'path';
import { buildSearchQuery, buildScoutQuery } from './setup/config-builder.js';

const USER_CONFIG_PATH = path.join(process.cwd(), 'data', 'user-config.json');

export function getUserConfig() {
  if (!fs.existsSync(USER_CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

export function getAnalysisApiKey() {
  const config = getUserConfig();
  if (config?.analysis?.provider !== 'deepseek') return null;
  return process.env.DEEPSEEK_API_KEY ?? null;
}

const DEFAULT_SEARCH_QUERY =
  '("Full Stack Developer" OR "Frontend Developer" OR "Backend Developer") (Node.js OR TypeScript OR React OR Vue.js OR Nuxt OR Next.js OR "C#" OR ".NET" OR dotnet) remoto ("offerte di lavoro" OR "assunzione" OR "candidati")';

const DEFAULT_SCOUT_QUERY =
  '("software house" OR "tech company" OR "startup" OR "scaleup" OR "scale-up") Italia ("remote" OR "lavoro remoto" OR "full remote" OR "da remoto") ("full-time" OR "tempo pieno" OR "indeterminato")';

export function getSearchQuery() {
  const cfg = getUserConfig();
  return cfg?.search ? buildSearchQuery(cfg.search) : DEFAULT_SEARCH_QUERY;
}

export function getScoutQuery() {
  const cfg = getUserConfig();
  return cfg?.scout ? buildScoutQuery(cfg.scout) : DEFAULT_SCOUT_QUERY;
}

export function getAnalysisModel() {
  return getUserConfig()?.analysis?.model ?? 'qwen3.5:latest';
}

export function getAnalysisProvider() {
  return getUserConfig()?.analysis?.provider ?? 'ollama';
}

export function getAnalysisBaseUrl() {
  return getUserConfig()?.analysis?.baseUrl ?? 'http://localhost:11434/v1';
}

/** @deprecated use getAnalysisBaseUrl */
export const getOllamaBaseUrl = getAnalysisBaseUrl;

export const SEARCH_MAX_RESULTS = 20;
export const SCOUT_MAX_RESULTS = 6;
export const TRIAGE_MODEL = 'llama-3.1-8b-instant';
export const API_DELAY_MS = 2500;
export const TELEGRAM_MAX_CHARS = 4000;
export const MIN_MATCH_SCORE = 65;
