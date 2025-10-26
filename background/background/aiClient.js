export const aiClient = {
  useMock: false, // 改成 false，启用真实 API

  // 1️⃣ Summarizer
  async summarize(text, { lang = 'en' } = {}) {
    const summarizer = await window.ai.summarizer.create({
      type: 'tl;dr',
      format: 'bullets+keywords+tldr',
      inputLanguage: lang
    });
    const output = await summarizer.summarize(text);
    return {
      tldr: output.tldr,
      bullets: output.bullets,
      keywords: output.keywords
    };
  },

  // 2️⃣ Prompt（生成测验）
  async generateQuiz(text, { lang = 'en', num = 8 } = {}) {
    const prompt = await window.ai.prompt.create();
    const res = await prompt.prompt(
      `Create ${num} single-choice quiz questions (with 4 options and one correct answer each) about the following text. 
      Return JSON array with {stem, options, answerIndex, explanation, sourceAnchor}.`, 
      text
    );
    return JSON.parse(res);
  },

  // 3️⃣ Writer/Rewriter（生成闪卡）
  async generateFlashcards(summary, { lang = 'en' } = {}) {
    const writer = await window.ai.writer.create({ task: 'make_flashcards' });
    const text = summary.bullets.join('\n');
    const result = await writer.write(text, {
      outputFormat: 'json',
      fields: ['front', 'back', 'tags']
    });
    return JSON.parse(result);
  },

  // 4️⃣ Translator
  async translate(text, to = 'zh') {
    const translator = await window.ai.translator.create({ targetLanguage: to });
    const res = await translator.translate(text);
    return res.text;
  },

  // 5️⃣ Proofreader
  async proofread(text) {
    const proof = await window.ai.proofreader.create({ style: 'academic' });
    const res = await proof.proofread(text);
    return res.text;
  }
};


/*********** 以下是本地可跑的 mock 工具 ***********/
function mockTLDR(text) {
  const t = text.slice(0, 200).replace(/\s+/g, ' ').trim();
  return t.length ? `${t}...（TL;DR：该文本核心内容如上）` : '无有效文本';
}
function mockBullets(text) {
  const lines = text.split(/[。.!?]\s+/).slice(0, 10);
  return lines.map((l, i) => `• 要点${i + 1}：${l.slice(0, 120)}`);
}
function mockKeywords(text) {
  const words = [...new Set(text.toLowerCase().match(/[a-zA-Z]{5,}/g) || [])].slice(0, 5);
  return words.length ? words : ['concept', 'method', 'evidence', 'argument', 'implication'];
}
function mockQuizFromText(text, n = 8, lang = 'en') {
  const base = (i) => ({
    id: `q_${i}`,
    type: 'single',
    stem: lang.startsWith('zh') ? `根据以上内容，以下哪项说法更准确？（题${i + 1}）` : `Which statement best fits the passage? (Q${i + 1})`,
    options: [
      '核心概念A最重要', '背景信息B最关键', '方法论C起主导作用', '结论D具有普适性'
    ],
    answerIndex: Math.floor(Math.random() * 4),
    explanation: lang.startsWith('zh') ? '解析：依据段落主旨与论证重心。' : 'Explanation: based on the main claim and evidence.',
    sourceAnchor: { quote: text.slice(0, 80) }
  });
  return Array.from({ length: n }, (_, i) => base(i));
}
function mockCards(summary, lang = 'en') {
  const { bullets = [] } = summary || {};
  return bullets.slice(0, 12).map((b, i) => ({
    id: `card_${i}`,
    front: lang.startsWith('zh') ? `该要点的关键词是什么？` : `What is the key term of this point?`,
    back: b.replace(/^•\s?/, ''),
    tags: ['auto', 'summary']
  }));
}
