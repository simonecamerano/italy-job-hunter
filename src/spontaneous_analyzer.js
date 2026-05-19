import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ANALYSIS_MODEL } from './config.js';
dotenv.config();

/**
 * Generates a spontaneous application strategy and cold-outreach pitch for a target company.
 * Reads the local CV and uses DeepSeek to craft a tailored message.
 *
 * @param {{ name: string, url: string, content: string }} azienda
 * @returns {Promise<string>} formatted pitch report, or an error string on failure
 */
export async function analizzaPerCandidaturaSpontanea(azienda) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    console.error('❌ Error: DEEPSEEK_API_KEY not configured.');
    return 'Analysis unavailable.';
  }

  const cvPath = path.join(process.cwd(), 'data', 'cv.md');
  let cvContesto = '';

  if (fs.existsSync(cvPath)) {
    try {
      cvContesto = fs.readFileSync(cvPath, 'utf-8');
      console.log('📖 [OK] CV loaded from: "data/cv.md"');
    } catch {
      console.warn('⚠️ Warning: CV file found but could not be read. Analysis will be generic.');
    }
  } else {
    console.warn('⚠️ Warning: CV not found at data/cv.md. Analysis will be generic.');
  }

  const systemPrompt = `
    You are a Senior Headhunter and Business Development expert in the Italian tech market.
    Your task is to help Simone Camerano apply spontaneously to a target tech company.

    Here is Simone's real CV:
    ${cvContesto}

    Analyze the provided company description and generate a structured report exactly like this (use HTML tags for formatting):

    🚀 <b>WHY THIS COMPANY?</b>
    (Explain in two lines what this company does and why it is interesting for Simone's stack)

    🎯 <b>THE STRATEGIC HOOK (YOUR VALUE)</b>
    (Highlight the synergy between the company's products/services and Simone's 26 years of operational experience
    in retail management, team coordination, and commercial relationships. Explain how Simone deeply understands
    the business logic of their clients or software.)

    ✉️ <b>COLD OUTREACH PITCH (EMAIL / LINKEDIN)</b>
    (Write a short, sharp, professional cover letter ready to send to the CTO or HR Manager.
    Tone: confident, focused on solving business problems and Node.js/Vue.js development.)
  `;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Analyze this company for a spontaneous application:\nName/Site: ${azienda.name} (${azienda.url})\nContext: ${azienda.content}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'Analysis unavailable.';
  } catch (error) {
    console.error('❌ DeepSeek Spontaneous Error:', error.message);
    return 'Error generating pitch.';
  }
}