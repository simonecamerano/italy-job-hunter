import { TELEGRAM_MAX_CHARS } from './config.js';

/**
 * Converts Markdown to Telegram-compatible HTML.
 * Use this on plain-text/Markdown content before embedding it in an HTML message.
 *
 * @param {string} text
 * @returns {string}
 */
export function convertMarkdownToHtml(text) {
  // Escape HTML special characters first to prevent conflicts with inserted tags
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Convert **bold** to <b>
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Convert [text](url) to <a href="url">
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  return html;
}

/**
 * Sends an HTML-formatted message to the configured Telegram chat.
 * The caller is responsible for providing valid Telegram HTML
 * (supported tags: <b>, <i>, <u>, <s>, <code>, <pre>, <a href="...">).
 *
 * @param {string} text - Message text already formatted as Telegram HTML
 * @returns {Promise<boolean>} true if the message was delivered successfully
 */
export async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim().replace(/['"]/g, '');
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim().replace(/['"]/g, '');

  if (!token || !chatId) {
    console.log('\n📋 --- REPORT (Telegram not configured) ---');
    console.log(
      text
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>'),
    );
    console.log('--- END REPORT ---\n');
    return true;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Telegram API Error: ${response.status} - ${errData.description}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending to Telegram:', error.message);
    return false;
  }
}

/**
 * Sends an array of formatted card strings as one or more chunked Telegram messages.
 * Splits the delivery into multiple messages if content exceeds TELEGRAM_MAX_CHARS.
 *
 * @param {string} header - Opening message block (already includes separator line).
 * @param {string[]} cards - Array of pre-formatted HTML card strings.
 * @param {string} continuedLabel - Opening line for overflow messages.
 * @returns {Promise<number>} number of Telegram messages successfully sent
 */
export async function sendBatchedReport(header, cards, continuedLabel) {
  const SEPARATOR = `═`.repeat(15) + `\n\n`;
  let buffer = header;
  let sentCount = 0;

  for (const card of cards) {
    if ((buffer + card).length > TELEGRAM_MAX_CHARS) {
      const sent = await sendToTelegram(buffer);
      if (sent) sentCount++;
      buffer = continuedLabel;
    }
    buffer += card + `\n\n` + SEPARATOR;
  }

  if (buffer.trim() !== '') {
    const sent = await sendToTelegram(buffer);
    if (sent) sentCount++;
  }

  return sentCount;
}
