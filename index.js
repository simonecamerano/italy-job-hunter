import { cercaLavoriItalia } from './src/search_engine.js';
import { eseguiTriage } from './src/triage_filter.js';
import { analizzaConDeepSeek } from './src/deepseek_analyzer.js';
import { inviaATelegram } from './src/telegram_sender.js';
import { loadSeen, saveSeen } from './src/seen_store.js';
import { API_DELAY_MS, TELEGRAM_MAX_CHARS, MIN_MATCH_SCORE } from './src/config.js';

/** Extracts the numeric match score from a DeepSeek report string. Returns null if not found. */
function parseMatchScore(report) {
  const match = report.match(/MATCH SCORE[^:]*:\s*(\d+)%/i);
  return match ? parseInt(match[1], 10) : null;
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runHunter() {
  console.log('=====================================================');
  console.log(`🚀 ITALY-JOB-HUNTER LIVE: ${new Date().toLocaleString('it-IT')}`);
  console.log('=====================================================');

  // Stage 1: web search
  console.log('🔍 [STAGE 1] Scanning the web with Tavily...');
  const rawListings = await cercaLavoriItalia();
  console.log(`📊 Found ${rawListings.length} raw listings.`);

  if (rawListings.length === 0) {
    console.log('🏁 No listings found. Ending run.');
    return;
  }

  // Skip URLs already processed in previous runs to avoid duplicate notifications
  const seen = loadSeen();
  const newListings = rawListings.filter(a => !seen.has(a.url));
  console.log(`🗂  ${newListings.length} new listings after deduplication (${rawListings.length - newListings.length} skipped).`);

  if (newListings.length === 0) {
    console.log('🏁 All listings already processed. Ending run.');
    return;
  }

  console.log('-----------------------------------------------------');
  console.log('🧠 [STAGE 2] Triage with Groq + DeepSeek analysis...');

  const approvedCards = [];

  for (const listing of newListings) {
    const passed = await eseguiTriage(listing);

    if (passed) {
      console.log(`🔥 [APPROVED] Match found: "${listing.title}"`);
      console.log('🤖 [STAGE 3] Generating analysis with DeepSeek-V3...');
      const report = await analizzaConDeepSeek(listing);
      const score = parseMatchScore(report);

      if (score !== null && score < MIN_MATCH_SCORE) {
        console.log(`📉 [FILTERED] "${listing.title}" — score ${score}% below threshold (${MIN_MATCH_SCORE}%).`);
      } else {
        const card = `💼 <b>${listing.title.toUpperCase()}</b>\n\n${report}\n\n🔗 <a href="${listing.url}">View original listing</a>`;
        approvedCards.push(card);
      }
    } else {
      console.log(`❌ [REJECTED] "${listing.title}" does not match.`);
    }

    // Mark URL as seen and add courtesy delay to avoid hitting API rate limits
    seen.add(listing.url);
    await wait(API_DELAY_MS);
  }

  // Persist the updated seen set before sending notifications
  saveSeen(seen);

  // Stage 4: send accumulated report to Telegram
  console.log('-----------------------------------------------------');
  if (approvedCards.length === 0) {
    console.log('🏁 Zero matches today. No notification sent.');
    console.log('=====================================================');
    return;
  }

  console.log(`📬 Sending report for ${approvedCards.length} position(s)...`);

  let buffer = `🔔 <b>ITALY-JOB-HUNTER - OPPORTUNITY REPORT</b>\n\n`;
  buffer += `${approvedCards.length} match(es) found in the last 24 hours.\n\n`;
  buffer += `═`.repeat(15) + `\n\n`;

  let sentCount = 0;

  for (const card of approvedCards) {
    // Chunk messages to stay safely below Telegram's 4096-character hard limit
    if ((buffer + card).length > TELEGRAM_MAX_CHARS) {
      const sent = await inviaATelegram(buffer);
      if (sent) sentCount++;
      buffer = `📦 <b>OPPORTUNITY REPORT (Continued...)</b>\n\n`;
    }
    buffer += card + `\n\n` + `═`.repeat(15) + `\n\n`;
  }

  if (buffer.trim() !== '') {
    const sent = await inviaATelegram(buffer);
    if (sent) sentCount++;
  }

  console.log(`✅ Report delivered! Total messages sent: ${sentCount}`);
  console.log('=====================================================');
}

runHunter();
