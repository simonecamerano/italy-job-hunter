import { TRIAGE_MODEL, getUserConfig } from './config.js';

/**
 * Sends a boolean (SI/NO) query to Groq and returns the parsed boolean result.
 * Private helper shared by runTriage and runCompanyTriage.
 *
 * @param {string} systemPrompt
 * @param {string} userContent
 * @returns {Promise<boolean>}
 */
async function groqBoolean(systemPrompt, userContent) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GROQ_API_KEY not configured in .env');
    return false;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TRIAGE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.0,
        // Only "SI" or "NO" expected; 5 tokens is sufficient
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.error?.message || response.statusText;
      throw new Error(`Groq API Error: ${response.status} - ${detail}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim().toUpperCase().includes('SI');
  } catch (error) {
    console.error('❌ Error during Groq triage:', error.message);
    return false;
  }
}

/**
 * Runs a boolean triage on a single job listing using Groq.
 * Returns true only if the listing matches the Italian market and the target tech stack.
 *
 * @param {{ title: string, content: string }} listing
 * @returns {Promise<boolean>}
 */
export async function runTriage(listing) {
  const config = getUserConfig();
  const stack = config?.search?.stack ?? ['Node.js', 'Vue.js', 'Nuxt', 'Typescript', 'React'];
  const roles = config?.search?.roles ?? ['Frontend Developer', 'Full Stack Engineer'];
  const stackList = stack.join(', ');
  const rolesList = roles.join(', ');

  const systemPrompt = `You are a ruthless boolean logic filter for job listings.
Your ONLY job is to respond "SI" or "NO". Do not add explanations, greetings, or punctuation.

Criteria to respond "SI":
1. The offer must be explicitly for the ITALIAN market (work in Italy or Full Remote open to Italian residents).
2. The tech stack must include at least one of: ${stackList}.
3. The role must match or be closely related to: ${rolesList}.
4. It must be a real job offer (discard freelancer profiles, forum posts, social posts, or help requests).

Mandatory criteria to respond "NO":
- If the position is clearly abroad (Canada, India, USA, UK, etc.) and not open to Italy.
- If the listing is in English and contains no mention of Italy, Italian cities (Milano, Roma, Torino, Napoli, etc.), or explicit acceptance of Italian/European candidates.
- If it is a "Senior" role requiring more than 6-8 years of experience, or a Lead/Director role.
- If the stack does not include any of: ${stackList}.

If the listing is valid respond: SI
If the listing is NOT valid respond: NO`;

  return groqBoolean(systemPrompt, `Title: ${listing.title}\nJob listing text: ${listing.content}`);
}

/**
 * Checks whether a scouted company is based in Italy.
 * Rejects foreign companies before the LLM analysis step.
 *
 * @param {{ name: string, url: string, content: string }} company
 * @returns {Promise<boolean>}
 */
export async function runCompanyTriage(company) {
  const systemPrompt = `You are a boolean filter. Respond only "SI" or "NO". No explanations.

Respond "SI" if the company is based in Italy or operates primarily in the Italian market.
Respond "NO" if the company is foreign (USA, UK, India, etc.) with no clear Italian presence.`;

  return groqBoolean(
    systemPrompt,
    `Company: ${company.name}\nURL: ${company.url}\nDescription: ${company.content}`,
  );
}
