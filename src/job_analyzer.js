import fs from 'fs';
import path from 'path';
import { callLLM } from './llm_client.js';
import { getAnalysisProvider, getUserConfig } from './config.js';

const CV_PATH = path.join(process.cwd(), 'data', 'cv.md');

/**
 * Reads the local CV and runs a CV-vs-listing compatibility analysis via the configured LLM.
 * Returns a Telegram-optimized HTML report with match score, gap analysis, and recruiter hook.
 *
 * @param {{ title: string, url: string, content: string }} listing
 * @returns {Promise<string>} compatibility report, or an error string on failure
 */
export async function analyzeJobListing(listing) {
  try {
    const cvContent = fs.readFileSync(CV_PATH, 'utf-8');

    const config = getUserConfig();
    const stack = config?.search?.stack ?? ['Node.js', 'Vue.js', 'Nuxt', 'Typescript', 'React'];
    const stackList = stack.join(', ');

    const systemPrompt = `You are a Senior Headhunter and Career Counselor expert in the Italian tech market.
Analyze a job listing and cross-reference it with the user's CV to assess real compatibility,
highlighting strategic strengths (soft skills, business/management background) and technical gaps.

Generate a report in ITALIAN, optimized for Telegram. Use HTML tags for formatting (not Markdown).
Keep it scannable — no walls of text.

Structure the response EXACTLY like this:
🎯 <b>MATCH SCORE TECNICO</b>: [Percentage based on required ${stackList} stack]
📈 <b>IL SUPERPOTERE (SINERGIA DI BACKGROUND)</b>: [How the user's can provide value to the company]
⚠️ <b>ANALISI DEL GAP</b>: [What is missing or should be studied/mentioned in the interview]
📝 <b>GANCIO PER MESSAGGIO / COPERTINA</b>: [3-4 line text ready to use for a recruiter or LinkedIn message]`;

    const userContent = `### MY CV:\n${cvContent}\n\n### JOB LISTING:\nTitle: ${listing.title}\nLink: ${listing.url}\nText: ${listing.content}`;

    return await callLLM(systemPrompt, userContent);
  } catch (error) {
    console.error(`❌ Error during ${getAnalysisProvider()} analysis:`, error);
    return 'Unable to generate analysis for this listing.';
  }
}
