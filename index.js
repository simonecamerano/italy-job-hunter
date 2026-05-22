import dotenv from 'dotenv';
dotenv.config();
import { ensureSetup } from './src/setup/wizard.js';
import { runScouting } from './scouting.js';
import { searchJobListings } from './src/search_engine.js';
import { searchCareerListings } from './src/career_search.js';
import { runTriage } from './src/triage_filter.js';
import { analyzeJobListing } from './src/job_analyzer.js';
import { sendBatchedReport } from './src/telegram_sender.js';
import { loadSeen, saveSeen } from './src/seen_store.js';
import { wait, deduplicateByUrl, parseMatchScore } from './src/utils.js';
import { API_DELAY_MS, MIN_MATCH_SCORE, getAnalysisProvider } from './src/config.js';

async function runHunter() {
  console.log('=====================================================');
  console.log(`🚀 ITALY-JOB-HUNTER LIVE: ${new Date().toLocaleString('it-IT')}`);
  console.log('=====================================================');

  // Stage 1: web search (generic listings + curated company career pages) in parallel
  console.log('🔍 [STAGE 1] Scanning the web with Tavily...');
  const [webListings, careerListings] = await Promise.all([
    searchJobListings(),
    searchCareerListings(),
  ]);
  const rawListings = deduplicateByUrl([...webListings, ...careerListings]);
  console.log(
    `📊 Found ${rawListings.length} raw listings (${webListings.length} web + ${careerListings.length} career pages, deduped).`,
  );

  if (rawListings.length === 0) {
    console.log('🏁 No listings found. Ending run.');
    return;
  }

  // Skip URLs already seen in previous runs to avoid duplicate notifications
  const seen = loadSeen();
  const newListings = rawListings.filter((listing) => !seen.has(listing.url));
  console.log(
    `🗂  ${newListings.length} new listings after deduplication (${rawListings.length - newListings.length} skipped).`,
  );

  if (newListings.length === 0) {
    console.log('🏁 All listings already processed. Ending run.');
    return;
  }

  console.log('-----------------------------------------------------');
  console.log(`🧠 [STAGE 2] Triage with Groq + ${getAnalysisProvider()} analysis...`);

  const approvedCards = [];

  for (const listing of newListings) {
    const passed = await runTriage(listing);

    if (passed) {
      console.log(`🔥 [APPROVED] Match found: "${listing.title}"`);
      console.log(`🤖 [STAGE 3] Generating analysis with ${getAnalysisProvider()}...`);
      const report = await analyzeJobListing(listing);
      const score = parseMatchScore(report);

      if (score !== null && score < MIN_MATCH_SCORE) {
        console.log(
          `📉 [FILTERED] "${listing.title}" — score ${score}% below threshold (${MIN_MATCH_SCORE}%).`,
        );
      } else {
        approvedCards.push(
          `💼 <b>${listing.title.toUpperCase()}</b>\n\n${report}\n\n🔗 <a href="${listing.url}">Apply: ${listing.title}</a>`,
        );
      }
    } else {
      console.log(`❌ [REJECTED] "${listing.title}" does not match.`);
    }

    seen.add(listing.url);
    await wait(API_DELAY_MS);
  }

  // Persist seen URLs before sending to avoid re-processing on failure
  saveSeen(seen);

  console.log('-----------------------------------------------------');
  if (approvedCards.length === 0) {
    console.log('🏁 Zero matches today. No notification sent.');
    console.log('=====================================================');
    return;
  }

  console.log(`📬 Sending report for ${approvedCards.length} position(s)...`);

  const header =
    `🔔 <b>ITALY-JOB-HUNTER - OPPORTUNITY REPORT</b>\n\n` +
    `${approvedCards.length} match(es) found in the last 24 hours.\n\n` +
    `═`.repeat(15) +
    `\n\n`;

  const sentCount = await sendBatchedReport(
    header,
    approvedCards,
    `📦 <b>OPPORTUNITY REPORT (Continued...)</b>\n\n`,
  );

  console.log(`✅ Report delivered! Total messages sent: ${sentCount}`);
  console.log('=====================================================');
}

const dryRun = process.argv.includes('--dry-run');
const script = await ensureSetup({ dryRun });
if (script === 'scout') {
  runScouting();
} else {
  runHunter();
}
