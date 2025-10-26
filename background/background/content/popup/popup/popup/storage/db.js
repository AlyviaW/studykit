// 轻量 IndexedDB：不引第三方库，按对象仓库 "notes"
const DB_NAME = 'ai-studykit-db';
const STORE = 'notes';
const VERSION = 1;

export function currentTimeISO() {
  return new Date().toISOString();
}

export function makeNote({ url, title, lang, createdAt, summary, quiz, cards }) {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    url, title, lang, createdAt,
    summary, quiz, cards
  };
}

function getDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveNote(note) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(note);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
