import { saveNote, makeNote, currentTimeISO } from '../storage/db.js';
import { toMarkdown, toCSV, toJSON } from '../storage/export.js';

let extractedText = '';
let currentData = null; // { summary, quiz, cards }
let currentURL = '';
let currentTitle = '';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function setLoading(on) {
  $('#generateAll').disabled = on || !extractedText;
  $('#saveNote').disabled = on || !currentData;
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ? tab.id : null;
}

async function extract(mode = 'auto') {
  const tabId = await getActiveTabId();
  if (!tabId) return;
  const tab = (await chrome.tabs.query({active: true, currentWindow: true}))[0] || {};
  currentURL = tab.url || '';
  currentTitle = tab.title || '';

  const res = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_TEXT', payload: { mode } });
  if (res?.ok) {
    extractedText = res.data.text || '';
    if (!extractedText) alert('未获取到有效文本，请尝试切换提取方式或手动选择文本。');
    $('#generateAll').disabled = !extractedText;
  } else {
    alert('提取失败');
  }
}

async function generateAll() {
  const lang = $('#lang').value || 'en';
  setLoading(true);
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GENERATE_ALL', payload: { text: extractedText, lang } });
    if (!res?.ok) throw new Error(res?.error || '生成失败');
    currentData = res.data;
    renderSummary(currentData.summary);
    renderQuiz(currentData.quiz);
    renderCards(currentData.cards);
    $('#saveNote').disabled = false;
  } catch (e) {
    alert(String(e.message || e));
  } finally {
    setLoading(false);
  }
}

function renderSummary(s) {
  $('#tldr').textContent = s?.tldr || '';
  $('#bullets').innerHTML = (s?.bullets || []).map(b => `<li>${escapeHTML(b)}</li>`).join('');
  $('#keywords').textContent = (s?.keywords || []).join(', ');
}

function renderQuiz(quiz = []) {
  const list = $('#quizList');
  list.innerHTML = '';
  quiz.forEach((q, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="stem">${escapeHTML(q.stem)}</div>
      <ul class="options">
        ${q.options.map((opt, i) => `<li><label><input type="radio" name="q${idx}" value="${i}"> ${escapeHTML(opt)}</label></li>`).join('')}
      </ul>
      <button class="check" data-idx="${idx}">检查</button>
      <div class="explain" id="exp_${idx}" style="display:none;"></div>
    `;
    list.appendChild(li);
  });
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.check');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const q = quiz[idx];
    const chosen = [...document.getElementsByName(`q${idx}`)].find(n => n.checked);
    const exp = $(`#exp_${idx}`);
    if (!chosen) {
      exp.style.display = 'block';
      exp.textContent = '请选择一个答案';
      return;
    }
    const val = Number(chosen.value);
    const correct = Array.isArray(q.answerIndex) ? q.answerIndex.includes(val) : q.answerIndex === val;
    exp.style.display = 'block';
    exp.textContent = `你的答案：${val + 1}；${correct ? '✅ 正确' : '❌ 错误'}。解析：${q.explanation || ''}`;
  }, { once: true });
}

function renderCards(cards = []) {
  const ul = $('#cardList');
  ul.innerHTML = cards.map(c => `
    <li><strong>Q:</strong> ${escapeHTML(c.front)}<br/><strong>A:</strong> ${escapeHTML(c.back)}<br/><em>Tags:</em> ${(c.tags || []).join(', ')}</li>
  `).join('');
}

function switchTab(tab) {
  $$('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $$('.tab').forEach(el => el.classList.toggle('active', el.id === tab));
}

async function saveCurrentNote() {
  if (!currentData) return;
  const note = makeNote({
    url: currentURL,
    title: currentTitle,
    lang: $('#lang').value || 'en',
    createdAt: Date.now(),
    summary: currentData.summary,
    quiz: currentData.quiz,
    cards: currentData.cards
  });
  await saveNote(note);
  alert('已保存到本地（IndexedDB）');
}

function doExport(type) {
  if (!currentData) return;
  const meta = { url: currentURL, title: currentTitle, at: currentTimeISO() };
  if (type === 'md') download('note.md', toMarkdown(currentData, meta));
  if (type === 'csv') download('cards.csv', toCSV(currentData, meta));
  if (type === 'json') download('note.json', toJSON(currentData, meta));
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename }, () => URL.revokeObjectURL(url));
}

function escapeHTML(s = '') {
  return s.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

/************ 事件绑定 ************/
$('#extractPage').addEventListener('click', () => extract('page'));
$('#extractSelection').addEventListener('click', () => extract('selection'));
$('#generateAll').addEventListener('click', generateAll);
$('#saveNote').addEventListener('click', saveCurrentNote);
$('#exportMD').addEventListener('click', () => doExport('md'));
$('#exportCSV').addEventListener('click', () => doExport('csv'));
$('#exportJSON').addEventListener('click', () => doExport('json'));
$('#tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (btn) switchTab(btn.dataset.tab);
});
