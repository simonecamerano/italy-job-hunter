import { tavily } from '@tavily/core';
import { getScoutQuery, SCOUT_MAX_RESULTS } from './config.js';

/**
 * Searches for tech companies and software houses in the Italian Retail/Logistics sector.
 * Returns company metadata for downstream spontaneous application analysis.
 *
 * @returns {Promise<Array<{name: string, url: string, content: string}>>}
 */
export async function scoutRetailTechCompanies() {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    console.error('❌ Error: TAVILY_API_KEY missing from .env');
    return [];
  }

  const tavilyClient = tavily({ apiKey });

  try {
    const response = await tavilyClient.search(getScoutQuery(), {
      searchDepth: 'advanced',
      maxResults: SCOUT_MAX_RESULTS,
    });

    if (!response || !response.results) return [];

    return response.results.map((result) => ({
      name: result.title || 'Target Company',
      url: result.url || '#',
      content: result.content || '',
    }));
  } catch (error) {
    console.error('❌ Error during Tavily company scouting:', error.message);
    return [];
  }
}
