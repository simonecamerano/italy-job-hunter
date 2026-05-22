import fs from 'fs';
import path from 'path';
import * as p from '@clack/prompts';
import { readEnvKey, writeEnvKey } from './env-writer.js';
import { listOllamaModels, OLLAMA_DEFAULT_BASE_URL } from './ollama-client.js';

const USER_CONFIG_PATH = path.join(process.cwd(), 'data', 'user-config.json');
const CV_PATH = path.join(process.cwd(), 'data', 'cv.md');

export function parseKeywords(raw) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function loadUserConfig() {
  try {
    return JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function isSetupComplete() {
  if (!fs.existsSync(USER_CONFIG_PATH)) return false;
  if (!fs.existsSync(CV_PATH)) return false;
  if (!process.env.TAVILY_API_KEY && !readEnvKey('TAVILY_API_KEY')) return false;
  if (!process.env.GROQ_API_KEY && !readEnvKey('GROQ_API_KEY')) return false;
  return true;
}

function cancelCheck(value) {
  if (p.isCancel(value)) {
    p.cancel('Setup cancelled.');
    process.exit(0);
  }
  return value;
}

async function askWhichScript(autoScript) {
  if (autoScript) {
    p.outro(`Starting ${autoScript === 'hunter' ? 'hunt' : 'scout'}...`);
    return autoScript;
  }
  const script = cancelCheck(
    await p.select({
      message: 'What do you want to run?',
      options: [
        {
          value: 'hunter',
          label: 'Job Hunter',
          hint: 'Scan job listings, analyze against your CV, deliver a match report',
        },
        {
          value: 'scout',
          label: 'Company Scout',
          hint: 'Discover Italian tech companies and craft cold-outreach pitches',
        },
      ],
    }),
  );
  p.outro(`Starting ${script === 'hunter' ? 'hunt' : 'scout'}...`);
  return script;
}

export async function ensureSetup({ dryRun = false, autoScript = null } = {}) {
  if (isSetupComplete()) {
    if (dryRun || !process.stdin.isTTY) return autoScript ?? 'hunter';

    const existing = loadUserConfig();
    const summaryLines = [
      `Roles:         ${existing.search.roles.join(', ')}`,
      `Stack:         ${existing.search.stack.join(', ')}`,
      `Company types: ${existing.scout.companyTypes.join(', ')}`,
      `Provider:      ${existing.analysis.provider} (${existing.analysis.model})`,
    ];
    p.note(summaryLines.join('\n'), 'Current configuration');

    const reconfigure = cancelCheck(
      await p.confirm({
        message: 'Reconfigure? (No = run with existing config)',
        initialValue: false,
      }),
    );
    if (!reconfigure) return askWhichScript(autoScript);
  }

  p.intro('🇮🇹  Italy Job Hunter — First-run Setup');

  // ── Search preferences ────────────────────────────────────────────
  const rolesRaw = cancelCheck(
    await p.text({
      message:
        'Which roles are you targeting? (comma-separated, e.g. Full Stack Developer, Backend Developer)',
      placeholder: 'Full Stack Developer, Backend Developer',
      validate: (v) =>
        !v || parseKeywords(v).length === 0 ? 'Enter at least one role' : undefined,
    }),
  );
  const roles = parseKeywords(rolesRaw);

  const stackRaw = cancelCheck(
    await p.text({
      message:
        'Which technologies are you targeting? (comma-separated, e.g. Vue.js, Node.js, TypeScript)',
      placeholder: 'Vue.js, Node.js, TypeScript',
      validate: (v) =>
        !v || parseKeywords(v).length === 0 ? 'Enter at least one technology' : undefined,
    }),
  );
  const stack = parseKeywords(stackRaw);

  const remoteOnly = cancelCheck(
    await p.select({
      message: 'Work preference?',
      options: [
        { value: true, label: 'Remote only', hint: 'filters to fully remote positions' },
        { value: false, label: 'All locations', hint: 'includes hybrid and on-site positions' },
      ],
    }),
  );

  const companyTypesRaw = cancelCheck(
    await p.text({
      message:
        'Which company types do you want to scout? (comma-separated, e.g. startup, software house, tech company)',
      placeholder: 'startup, software house, tech company',
      validate: (v) =>
        !v || parseKeywords(v).length === 0 ? 'Enter at least one company type' : undefined,
    }),
  );
  const companyTypes = parseKeywords(companyTypesRaw);

  // ── CV setup ──────────────────────────────────────────────────────
  const cvInput = cancelCheck(
    await p.text({
      message: 'Full path to your CV file (must be Markdown .md format):',
      placeholder: '/Users/you/Documents/cv.md',
      validate(v) {
        if (!v) return 'Path is required';
        if (!fs.existsSync(v)) return 'File not found at this path';
        if (!v.endsWith('.md')) return 'File must have a .md extension';
      },
    }),
  );
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
  fs.copyFileSync(cvInput, CV_PATH);
  p.log.success('CV copied to data/cv.md');

  // ── Required API keys ─────────────────────────────────────────────
  if (!process.env.TAVILY_API_KEY && !readEnvKey('TAVILY_API_KEY')) {
    const key = cancelCheck(
      await p.text({
        message: 'Tavily API key (required — sign up free at tavily.com):',
        validate: (v) => (v ? undefined : 'Key is required'),
      }),
    );
    writeEnvKey('TAVILY_API_KEY', key);
    process.env.TAVILY_API_KEY = key;
  }

  if (!process.env.GROQ_API_KEY && !readEnvKey('GROQ_API_KEY')) {
    const key = cancelCheck(
      await p.text({
        message: 'Groq API key (required — sign up free at console.groq.com):',
        validate: (v) => (v ? undefined : 'Key is required'),
      }),
    );
    writeEnvKey('GROQ_API_KEY', key);
    process.env.GROQ_API_KEY = key;
  }

  // ── Telegram (optional) ───────────────────────────────────────────
  if (!process.env.TELEGRAM_BOT_TOKEN && !readEnvKey('TELEGRAM_BOT_TOKEN')) {
    const wantTelegram = cancelCheck(
      await p.confirm({
        message: 'Set up Telegram notifications? (skip to print results to terminal instead)',
        initialValue: true,
      }),
    );
    if (wantTelegram) {
      const token = cancelCheck(
        await p.text({
          message: 'Telegram bot token (from @BotFather on Telegram):',
          validate: (v) => (v ? undefined : 'Token is required'),
        }),
      );
      const chatId = cancelCheck(
        await p.text({
          message: 'Telegram chat ID (send any message to @userinfobot to find yours):',
          validate: (v) => (v ? undefined : 'Chat ID is required'),
        }),
      );
      writeEnvKey('TELEGRAM_BOT_TOKEN', token);
      writeEnvKey('TELEGRAM_CHAT_ID', chatId);
      process.env.TELEGRAM_BOT_TOKEN = token;
      process.env.TELEGRAM_CHAT_ID = chatId;
    }
  }

  // ── Analysis provider ─────────────────────────────────────────────
  const provider = cancelCheck(
    await p.select({
      message: 'Which AI engine should analyze job listings against your CV?',
      options: [
        {
          value: 'ollama',
          label: 'Ollama (local, free)',
          hint: 'runs on your machine — requires Ollama installed',
        },
        {
          value: 'deepseek',
          label: 'DeepSeek (cloud, ~$0.001 per analysis)',
          hint: 'requires a DeepSeek API key',
        },
      ],
    }),
  );

  let analysisConfig;

  if (provider === 'ollama') {
    const spinner = p.spinner();
    spinner.start('Checking for locally installed Ollama models...');
    const models = await listOllamaModels();
    spinner.stop();

    if (models.length === 0) {
      p.note(
        [
          'No Ollama models found. Make sure Ollama is running:',
          '  ollama serve',
          '',
          'Then install a model (recommended):',
          '  ollama pull qwen3.5:latest',
          '',
          'After that, run the command again.',
        ].join('\n'),
        'Ollama not ready',
      );
      process.exit(1);
    }

    const model = cancelCheck(
      await p.select({
        message: 'Select the model to use for CV analysis:',
        options: models.map((m) => ({ value: m, label: m })),
      }),
    );

    analysisConfig = {
      provider: 'ollama',
      model,
      baseUrl: `${OLLAMA_DEFAULT_BASE_URL}/v1`,
    };
  } else {
    if (!process.env.DEEPSEEK_API_KEY && !readEnvKey('DEEPSEEK_API_KEY')) {
      const key = cancelCheck(
        await p.text({
          message: 'DeepSeek API key (get one at platform.deepseek.com):',
          validate: (v) => (v ? undefined : 'Key is required'),
        }),
      );
      writeEnvKey('DEEPSEEK_API_KEY', key);
      process.env.DEEPSEEK_API_KEY = key;
    }
    analysisConfig = {
      provider: 'deepseek',
      model: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com/v1',
    };
  }

  // ── Write user-config.json ────────────────────────────────────────
  const userConfig = {
    search: {
      roles,
      stack,
      remoteOnly,
      keywords: ['offerte di lavoro', 'assunzione', 'candidati'],
    },
    scout: {
      companyTypes,
      location: 'Italia',
      workMode: ['remote', 'lavoro remoto', 'full remote', 'da remoto'],
      contract: ['full-time', 'tempo pieno', 'indeterminato'],
    },
    analysis: analysisConfig,
  };

  fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(userConfig, null, 2), 'utf-8');
  p.log.success('Configuration saved to data/user-config.json');

  const summaryLines = [
    `Roles:         ${roles.join(', ')}`,
    `Stack:         ${stack.join(', ')}`,
    `Company types: ${companyTypes.join(', ')}`,
    `Provider:      ${analysisConfig.provider} (${analysisConfig.model})`,
  ];
  p.note(summaryLines.join('\n'), 'Setup complete — summary');

  return askWhichScript(autoScript);
}
