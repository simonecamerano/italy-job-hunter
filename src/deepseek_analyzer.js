import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ANALYSIS_MODEL, OLLAMA_BASE_URL } from './config.js';
dotenv.config();

/**
 * Reads the local CV and asks Ollama for a detailed CV-vs-listing match analysis.
 * Returns a Telegram-optimized report with match score, gap analysis, and a recruiter hook.
 *
 * @param {{ title: string, url: string, content: string }} annuncio
 * @returns {Promise<string>} compatibility report, or an error string on failure
 */
export async function analizzaConDeepSeek(annuncio) {
  try {
    const cvPath = path.join(process.cwd(), 'data', 'cv.md');
    const cvContent = fs.readFileSync(cvPath, 'utf-8');

    const systemPrompt = `You are a Senior Headhunter and Career Counselor expert in the Italian tech market.
Analyze a job listing and cross-reference it with the user's CV to assess real compatibility,
highlighting strategic strengths (soft skills, business/management background) and technical gaps.

Generate a report in ITALIAN, optimized for Telegram. Use HTML tags for formatting (not Markdown).
Keep it scannable — no walls of text.

Structure the response EXACTLY like this:
🎯 <b>MATCH SCORE TECNICO</b>: [Percentage based on required Node/Vue/Nuxt stack]
📈 <b>IL SUPERPOTERE (SINERGIA DI BACKGROUND)</b>: [How the user's 20+ years of operational/commercial experience adds value in this role]
⚠️ <b>ANALISI DEL GAP</b>: [What is missing or should be studied/mentioned in the interview]
📝 <b>GANCIO PER MESSAGGIO / COPERTINA</b>: [3-4 line text ready to use for a recruiter or LinkedIn message]`;

    const userContent = `### MY CV:\n${cvContent}\n\n### JOB LISTING:\nTitle: ${annuncio.title}\nLink: ${annuncio.url}\nText: ${annuncio.content}`;

    const response = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'Unable to generate analysis for this listing.';

  } catch (error) {
    console.error('❌ Error during Ollama analysis:', error);
    return 'Unable to generate analysis for this listing.';
  }
}
