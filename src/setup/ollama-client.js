export const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434';

export async function listOllamaModels(baseUrl = OLLAMA_DEFAULT_BASE_URL) {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}
