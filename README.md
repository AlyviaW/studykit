# studykit
# Chrome AI StudyKit

Turn any page/selection into **Summary + Interactive Quiz + Flashcards**, save to IndexedDB, and export to **Markdown / CSV(Anki) / JSON**. Built for Google Chrome Built-in AI Challenge 2025. Uses Chrome AI (Gemini Nano) APIs via an adapter (mock by default).

## How it works
1. Extract page/selection text.
2. Summarize (TL;DR + bullets + keywords).
3. Generate quiz (single-choice) with explanations.
4. Generate flashcards (Front/Back/Tags).
5. Save locally; export to MD/CSV/JSON (Notion/Anki-friendly).

## Chrome AI integration
- Replace `background/aiClient.js` `useMock = false`
- Fill the `TODO` parts with official **Summarizer / Prompt / Writer / Rewriter / Translator / Proofreader** API calls.
- Keep the normalized return shapes:
  - `summary = { tldr, bullets[], keywords[] }`
  - `quiz = [{ stem, options[], answerIndex, explanation, sourceAnchor }]`
  - `cards = [{ front, back, tags[] }]`

## Privacy
- Only processes current tab content on demand.
- Notes saved locally in IndexedDB.
