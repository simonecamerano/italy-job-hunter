import {
  getAnalysisModel,
  getAnalysisBaseUrl,
  getAnalysisApiKey,
  getAnalysisProvider,
} from './config.js';

/**
 * Sends a chat completion request to the configured OpenAI-compatible endpoint.
 * Supports both local Ollama and cloud providers (DeepSeek, etc.) via config.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>} the assistant's response content
 * @throws {Error} if the HTTP response is not OK
 */
export async function callLLM(systemPrompt, userMessage) {
  const apiKey = getAnalysisApiKey();
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const response = await fetch(`${getAnalysisBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: getAnalysisModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    throw new Error(`${getAnalysisProvider()} API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? 'Unable to generate analysis.';
}
