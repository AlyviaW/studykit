import { aiClient } from './aiClient.js';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === 'GENERATE_ALL') {
        const { text, lang } = msg.payload;
        const summary = await aiClient.summarize(text, { lang });
        const quiz = await aiClient.generateQuiz(text, { lang, num: 8 });
        const cards = await aiClient.generateFlashcards(summary, { lang });
        sendResponse({ ok: true, data: { summary, quiz, cards } });
      } else if (msg.type === 'TRANSLATE') {
        const { text, to } = msg.payload;
        const translated = await aiClient.translate(text, to);
        sendResponse({ ok: true, data: translated });
      } else {
        sendResponse({ ok: false, error: 'Unknown message type' });
      }
    } catch (e) {
      console.error(e);
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  })();
  return true; // keep channel open for async response
});
