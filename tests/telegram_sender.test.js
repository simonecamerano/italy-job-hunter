import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  convertMarkdownToHtml,
  sendToTelegram,
  sendBatchedReport,
} from '../src/telegram_sender.js';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

describe('convertMarkdownToHtml', () => {
  it('converts **bold** to <b>bold</b>', () => {
    expect(convertMarkdownToHtml('**hello**')).toBe('<b>hello</b>');
  });

  it('converts [text](url) to an HTML anchor', () => {
    expect(convertMarkdownToHtml('[click here](https://example.com)')).toBe(
      '<a href="https://example.com">click here</a>',
    );
  });

  it('escapes & to &amp;', () => {
    expect(convertMarkdownToHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes < to &lt;', () => {
    expect(convertMarkdownToHtml('a < b')).toBe('a &lt; b');
  });

  it('escapes > to &gt;', () => {
    expect(convertMarkdownToHtml('a > b')).toBe('a &gt; b');
  });
});

describe('sendToTelegram', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '12345';
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    vi.restoreAllMocks();
  });

  it('returns true on a successful send', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const result = await sendToTelegram('Hello!');
    expect(result).toBe(true);
  });

  it('logs to console and returns true when bot token is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await sendToTelegram('Hello!');
    expect(result).toBe(true);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('logs to console and returns true when chat ID is missing', async () => {
    delete process.env.TELEGRAM_CHAT_ID;
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await sendToTelegram('Hello!');
    expect(result).toBe(true);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns false when Telegram API returns an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ description: 'Bad Request' }),
      }),
    );
    const result = await sendToTelegram('Hello!');
    expect(result).toBe(false);
  });
});

describe('sendBatchedReport', () => {
  it('sends one message when all cards fit within the limit', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '12345';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    const count = await sendBatchedReport('Header\n\n', ['Card 1', 'Card 2'], '📦 Continued\n\n');
    expect(count).toBe(1);

    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
  });

  it('returns 0 when sendToTelegram fails', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '12345';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );

    const count = await sendBatchedReport('Header\n\n', ['Card 1'], '📦 Continued\n\n');
    expect(count).toBe(0);

    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
  });

  it('returns 1 when no Telegram configured (fallback print counts as sent)', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const count = await sendBatchedReport('Header\n\n', ['Card 1'], '📦 Continued\n\n');
    expect(count).toBe(1);
  });
});
