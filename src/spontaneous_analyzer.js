import fs from 'fs';
import path from 'path';
import { callLLM } from './llm_client.js';
import { getAnalysisProvider } from './config.js';

const CV_PATH = path.join(process.cwd(), 'data', 'cv.md');
const PROFILE_CACHE_PATH = path.join(process.cwd(), 'data', 'spontaneous_application.md');

/**
 * Returns a compact profile card derived from the CV file.
 * Reads from a local cache file if available; generates and saves one on first use.
 *
 * @returns {Promise<string>} the profile card text, or empty string on failure
 */
async function getProfileCard() {
  if (fs.existsSync(PROFILE_CACHE_PATH)) {
    console.log('📋 [OK] Profile card loaded from cache: "data/spontaneous_application.md"');
    return fs.readFileSync(PROFILE_CACHE_PATH, 'utf-8');
  }

  console.log('🔄 Profile card not found — generating from CV...');

  if (!fs.existsSync(CV_PATH)) {
    console.warn('⚠️ CV not found at data/cv.md. Profile card generation skipped.');
    return '';
  }

  const cvContent = fs.readFileSync(CV_PATH, 'utf-8');
  const profile = await callLLM(
    'You are a career coach expert in the Italian tech market. Extract and summarize the candidate profile from the provided CV into a concise, sharp profile card for use in spontaneous job applications. Include: full name, current role, years of experience, core tech stack, key strengths, measurable achievements, and communication tone. Write in third person. Keep it under 300 words.',
    `Here is the candidate's CV:\n\n${cvContent}`,
  );

  fs.writeFileSync(PROFILE_CACHE_PATH, profile, 'utf-8');
  console.log('✅ Profile card generated and saved to "data/spontaneous_application.md"');
  return profile;
}

/**
 * Generates a spontaneous application strategy and cold-outreach pitch for a target company.
 * Uses a cached profile card derived from the local CV.
 *
 * @param {{ name: string, url: string, content: string }} company
 * @returns {Promise<string>} formatted pitch report, or an error string on failure
 */
export async function analyzeSpontaneousApplication(company) {
  let profileCard = '';
  try {
    profileCard = await getProfileCard();
  } catch (err) {
    console.warn('⚠️ Could not load profile card:', err.message);
  }

  const systemPrompt = `
    You are a Senior Headhunter and Business Development expert in the Italian tech market.
    Your task is to help the candidate apply spontaneously to a target tech company.

    Here is the candidate's profile:
    ${profileCard || 'No profile available — generate a generic analysis.'}

    Analyze the provided company description and generate a structured report exactly like this (use HTML tags for formatting):

    🚀 <b>WHY THIS COMPANY?</b>
    (Explain in two lines what this company does and why it is interesting for the candidate's stack)

    🎯 <b>THE STRATEGIC HOOK (YOUR VALUE)</b>
    (Highlight the synergy between the company's products/services and the candidate's experience and skills.)

    ✉️ <b>COLD OUTREACH PITCH (EMAIL / LINKEDIN)</b>
    (Write a short, sharp, professional cover letter ready to send to the CTO or HR Manager.
    Tone: confident, focused on solving business problems with the candidate's core tech stack.)
  `;

  try {
    return await callLLM(
      systemPrompt,
      `Analyze this company for a spontaneous application:\nName/Site: ${company.name} (${company.url})\nContext: ${company.content}`,
    );
  } catch (error) {
    console.error(`❌ ${getAnalysisProvider()} Spontaneous Error:`, error.message);
    return 'Error generating pitch.';
  }
}
