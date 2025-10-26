// 抽取选中文本或页面正文的快速方案
function getSelectedText() {
  const sel = window.getSelection();
  return sel && String(sel).trim();
}

function getPageText() {
  // 简化正文抽取：优先 article/main，退化到 body 文本
  const candidates = [...document.querySelectorAll('article, main, [role="main"]')];
  let text = '';
  if (candidates.length) {
    text = candidates.map(el => el.innerText).join('\n');
  } else {
    text = document.body ? document.body.innerText : '';
  }
  // 去除脚注/脚本噪音
  return (text || '').replace(/\n{3,}/g, '\n\n').trim();
}

// 供 popup.js 调用
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'EXTRACT_TEXT') {
    const mode = msg.payload?.mode || 'auto';
    let text = '';
    if (mode === 'selection') {
      text = getSelectedText() || getPageText();
    } else {
      text = getPageText();
    }
    sendResponse({ ok: true, data: { text } });
    return true;
  }
});
