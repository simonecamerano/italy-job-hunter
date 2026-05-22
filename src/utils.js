/** Delays execution by the given number of milliseconds. */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Deduplicates an array of listings/results by their `url` field, keeping first occurrence. */
export function deduplicateByUrl(listings) {
  const seen = new Set();
  return listings.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

/** Extracts the numeric match score from an LLM report string. Returns null if not found. */
export function parseMatchScore(report) {
  const match = report.match(/MATCH SCORE[^:]*:\s*(\d+)%/i);
  return match ? parseInt(match[1], 10) : null;
}
