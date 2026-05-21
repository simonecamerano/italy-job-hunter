import dotenv from 'dotenv';
dotenv.config();

/**
 * Converts Markdown to Telegram-compatible HTML.
 * Use this on plain-text/Markdown content before embedding it in an HTML message.
 *
 * @param {string} text
 * @returns {string}
 */
export function convertiMarkdownInHtml(text) {
  // Escape HTML special characters first to prevent conflicts with inserted tags
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

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
 * @param {string} testo - Message text already formatted as Telegram HTML
 * @returns {Promise<boolean>} true if the message was delivered successfully
 */
export async function inviaATelegram(testo) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim().replace(/['"]/g, '');
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim().replace(/['"]/g, '');

  if (!token || !chatId) {
    console.error('❌ Error: Telegram credentials missing from .env');
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testo,
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