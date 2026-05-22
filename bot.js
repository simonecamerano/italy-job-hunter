import { spawn } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();
import { ensureSetup } from './src/setup/wizard.js';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const CHAT_ID = String(process.env.TELEGRAM_CHAT_ID?.trim());
const API_BASE = `https://api.telegram.org/bot${TOKEN}`;

if (!TOKEN || !CHAT_ID) {
  console.error('❌ TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required.');
  process.exit(1);
}

let offset = 0;
let pipelineRunning = false;

async function sendMessage(text) {
  try {
    await fetch(`${API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.error('❌ Failed to send Telegram message:', err.message);
  }
}

function runPipeline(scriptPath, label) {
  if (pipelineRunning) {
    sendMessage('⚠️ Una pipeline è già in esecuzione. Attendi che finisca.');
    return;
  }

  pipelineRunning = true;
  sendMessage(`🚀 <b>${label}</b> avviato...`);

  const child = spawn('node', [scriptPath], { stdio: 'inherit' });

  child.on('close', (code) => {
    pipelineRunning = false;
    if (code === 0) {
      sendMessage(`✅ <b>${label}</b> completato.`);
    } else {
      sendMessage(`❌ <b>${label}</b> terminato con errore (codice ${code}).`);
    }
  });
}

// Long-polling loop with exponential backoff on error (max 30s between retries)
let backoffMs = 1000;

async function poll() {
  try {
    const res = await fetch(`${API_BASE}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();

    for (const update of data.result ?? []) {
      offset = update.update_id + 1;

      const fromId = String(update.message?.chat?.id);
      const text = update.message?.text?.trim();

      // Ignore messages from anyone other than the configured chat
      if (fromId !== CHAT_ID) continue;

      if (text === '/hunt') {
        runPipeline('index.js', 'Job Hunt');
      } else if (text === '/scout') {
        runPipeline('scouting.js', 'Company Scout');
      } else if (text === '/status') {
        sendMessage(pipelineRunning ? '⏳ Pipeline in esecuzione...' : '💤 Bot in attesa.');
      } else if (text?.startsWith('/')) {
        sendMessage(
          'Comandi disponibili:\n/hunt — avvia la ricerca lavoro\n/scout — avvia lo scouting aziende\n/status — controlla se una pipeline è in corso',
        );
      }
    }

    backoffMs = 1000; // reset on success
  } catch (err) {
    console.error('❌ Poll error:', err.message);
    // Exponential backoff: wait progressively longer on repeated failures, cap at 30s
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    backoffMs = Math.min(backoffMs * 2, 30_000);
  }

  // Reschedule via setImmediate so the call stack never grows unboundedly
  setImmediate(poll);
}

await ensureSetup();
console.log('🤖 Bot is running. Listening for /hunt, /scout, /status...');
poll();
