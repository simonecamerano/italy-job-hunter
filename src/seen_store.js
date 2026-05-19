import fs from 'fs';
import path from 'path';

const DEFAULT_PATH = path.join(process.cwd(), 'data', 'seen_urls.json');

/**
 * Loads the set of already-processed URLs from disk.
 * Returns an empty Set if the file does not exist or contains invalid JSON.
 *
 * @param {string} [filePath] - Path to the JSON cache file. Defaults to data/seen_urls.json.
 * @returns {Set<string>}
 */
export function loadSeen(filePath = DEFAULT_PATH) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

/**
 * Persists the set of processed URLs to disk as a JSON array.
 *
 * @param {Set<string>} set - The full set of seen URLs to save.
 * @param {string} [filePath] - Path to the JSON cache file. Defaults to data/seen_urls.json.
 */
export function saveSeen(set, filePath = DEFAULT_PATH) {
  fs.writeFileSync(filePath, JSON.stringify([...set], null, 2));
}
