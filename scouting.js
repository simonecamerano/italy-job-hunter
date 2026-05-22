import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
import { ensureSetup } from './src/setup/wizard.js';
import { scoutRetailTechCompanies } from './src/company_scouter.js';
import { runCompanyTriage } from './src/triage_filter.js';
import { analyzeSpontaneousApplication } from './src/spontaneous_analyzer.js';
import { sendBatchedReport } from './src/telegram_sender.js';
import { wait } from './src/utils.js';
import { API_DELAY_MS } from './src/config.js';

export async function runScouting() {
  console.log('=====================================================');
  console.log(`🔍 COMPANY MAPPING STARTED: ${new Date().toLocaleString('it-IT')}`);
  console.log('=====================================================');

  console.log('📡 Scanning the web for Retail-Tech companies in Italy...');
  const companies = await scoutRetailTechCompanies();
  console.log(`📊 Found ${companies.length} potential target companies.`);

  if (companies.length === 0) {
    console.log('🏁 No companies found in this session.');
    return;
  }

  const pitchCards = [];

  for (const company of companies) {
    const isItalian = await runCompanyTriage(company);
    if (!isItalian) {
      console.log(`❌ [REJECTED] "${company.name}" — not an Italian company.`);
      await wait(API_DELAY_MS);
      continue;
    }

    console.log(`\n🏢 Analyzing positioning for: "${company.name}"...`);
    const report = await analyzeSpontaneousApplication(company);
    pitchCards.push(
      `🏢 <b>COMPANY: ${company.name.toUpperCase()}</b>\n🌐 <a href="${company.url}">Visit website</a>\n\n${report}`,
    );

    await wait(API_DELAY_MS);
  }

  console.log('\n-----------------------------------------------------');
  console.log('📬 Assembling and sending Spontaneous Applications Dossier...');

  const header =
    `🚀 <b>SPONTANEOUS APPLICATIONS DOSSIER</b>\n` +
    `Target companies identified today with their strategic pitches.\n\n` +
    `═`.repeat(15) +
    `\n\n`;

  const sentCount = await sendBatchedReport(
    header,
    pitchCards,
    `📦 <b>SPONTANEOUS DOSSIER (Continued...)</b>\n\n`,
  );

  console.log(`✅ Dossier sent to Telegram! Total messages: ${sentCount}`);
  console.log('=====================================================');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dryRun = process.argv.includes('--dry-run');
  await ensureSetup({ dryRun, autoScript: 'scout' });
  runScouting();
}
