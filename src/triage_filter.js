import dotenv from 'dotenv';
import { TRIAGE_MODEL } from './config.js';
dotenv.config();

/**
 * Runs a boolean triage on a single job listing using Groq.
 * Sends the listing to a fast LLM that responds only "SI" or "NO" based on whether
 * it matches the Italian market and the target tech stack.
 *
 * @param {{ title: string, content: string }} annuncio
 * @returns {Promise<boolean>} true if the listing passes the filter, false otherwise
 */
export async function eseguiTriage(annuncio) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: GROQ_API_KEY not configured in .env');
    return false;
  }

  const systemPrompt = `You are a ruthless boolean logic filter for job listings.
Your ONLY job is to respond "SI" or "NO". Do not add explanations, greetings, or punctuation.

Criteria to respond "SI":
1. The offer must be explicitly for the ITALIAN market (work in Italy or Full Remote open to Italian residents).
2. The tech stack must include JavaScript/TypeScript and at least one of: Node.js, Vue.js, or Nuxt.
3. It must be a real job offer (discard freelancer profiles, forum posts, social posts, or help requests).

Mandatory criteria to respond "NO":
- If the position is clearly abroad (Canada, India, USA, UK, etc.) and not open to Italy.
- If the listing is in English and contains no mention of Italy, Italian cities (Milano, Roma, Torino, Napoli, etc.), or explicit acceptance of Italian/European candidates.
- If it is a "Senior" role requiring more than 6-8 years of experience, or a Lead/Director role.
- If the stack focuses only on other languages (pure Java, pure PHP, C#) without Node/Vue/Nuxt.

If the listing is valid respond: SI
If the listing is NOT valid respond: NO`;

  const userContent = `Title: ${annuncio.title}\nJob listing text: ${annuncio.content}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TRIAGE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        // temperature 0 ensures deterministic boolean output
        temperature: 0.0,
        // Only "SI" or "NO" expected; 5 tokens is more than sufficient
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.error?.message || response.statusText;
      throw new Error(`Groq API Error: ${response.status} - ${detail}`);
    }

    const data = await response.json();
    const clean = data.choices[0].message.content.trim().toUpperCase();
    return clean.includes('SI');

  } catch (error) {
    console.error('❌ Error during Groq triage:', error.message);
    return false;
  }
}

/**
 * Checks whether a scouted company is based in Italy.
 * Rejects foreign companies before spending a DeepSeek call on them.
 *
 * @param {{ name: string, url: string, content: string }} azienda
 * @returns {Promise<boolean>} true if the company appears to be Italian, false otherwise
 */
export async function eseguiTriageAzienda(azienda) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: GROQ_API_KEY not configured in .env');
    return false;
  }

  const systemPrompt = `You are a boolean filter. Respond only "SI" or "NO". No explanations.

Respond "SI" if the company is based in Italy or operates primarily in the Italian market.
Respond "NO" if the company is foreign (USA, UK, India, etc.) with no clear Italian presence.`;

  const userContent = `Company: ${azienda.name}\nURL: ${azienda.url}\nDescription: ${azienda.content}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TRIAGE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.0,
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const clean = data.choices[0].message.content.trim().toUpperCase();
    return clean.includes('SI');

  } catch (error) {
    console.error('❌ Error during company triage:', error.message);
    return false;
  }
}