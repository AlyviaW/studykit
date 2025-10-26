export function toMarkdown(data, meta = {}) {
  const { summary, quiz = [], cards = [] } = data || {};
  const { url = '', title = '', at = '' } = meta;
  const bullets = (summary?.bullets || []).map(b => `- ${b}`).join('\n');
  const keywords = (summary?.keywords || []).join(', ');

  const quizMd = quiz.map((q, i) => {
    const opts = q.options.map((o, j) => `  - [${j === q.answerIndex ? 'x' : ' '}] ${o}`).join('\n');
    return `**Q${i+1}.** ${q.stem}\n${opts}\n> 解析：${q.explanation || ''}\n`;
  }).join('\n');

  const cardsMd = cards.map((c, i) => `**Card ${i+1}**\n- Front: ${c.front}\n- Back: ${c.back}\n- Tags: ${(c.tags || []).join(', ')}\n`).join('\n');

  return `# ${title || 'Untitled'}\n\n- URL: ${url}\n- Exported At: ${at}\n\n## TL;DR\n${summary?.tldr || ''}\n\n## 要点\n${bullets}\n\n**关键词**: ${keywords}\n\n## 测验\n${quizMd}\n\n## 闪卡\n${cardsMd}\n`;
}

export function toCSV(data, meta = {}) {
  // Anki: Front,Back,Tags
  const { cards = [] } = data || {};
  const rows = [['Front','Back','Tags']];
  cards.forEach(c => rows.push([esc(c.front), esc(c.back), esc((c.tags || []).join(' '))]));
  return rows.map(r => r.map(csvCell).join(',')).join('\n');

  function esc(s=''){ return s.replace(/\n/g, ' '); }
  function csvCell(s=''){ return `"${s.replace(/"/g, '""')}"`; }
}

export function toJSON(data, meta = {}) {
  return JSON.stringify({ meta, data }, null, 2);
}
