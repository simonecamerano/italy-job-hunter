import { tavily } from '@tavily/core';
import { getSearchQuery, SEARCH_MAX_RESULTS } from './config.js';
import { getCareerDomains } from './career_companies.js';

export async function searchCareerListings() {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) return [];

  const domains = await getCareerDomains();
  if (domains.length === 0) return [];

  const tavilyClient = tavily({ apiKey });

  try {
    const response = await tavilyClient.search(getSearchQuery(), {
      searchDepth: 'advanced',
      maxResults: SEARCH_MAX_RESULTS,
      includeDomains: domains,
    });

    if (!response?.results) return [];

    return response.results.map((result) => ({
      title: result.title || 'Title not available',
      url: result.url || '#',
      content: result.content || '',
    }));
  } catch (error) {
    console.error('❌ Error during career page search:', error.message);
    return [];
  }
}
