// ES module for client-side database using sql.js (SQLite compiled to WASM)
// Persistence via IndexedDB storing the SQLite database file as a Uint8Array.

// Usage:
// import { initClientDB, dbAPI } from '/static/js/db.js';
// await initClientDB();
// await dbAPI.addFriend('Alice');

const IDB_DB_NAME = 'biblipartage_idb';
const IDB_STORE = 'sqlite_store';
const IDB_KEY = 'main_db';

let SQL = null;
let db = null;

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(IDB_STORE)) {
        d.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const dbi = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const dbi = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = dbi.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function saveDB() {
  if (!db) return;
  const data = db.export(); // Uint8Array
  await idbSet(IDB_KEY, data);
}

function rowsFromResult(res) {
  if (!res || !res.length) return [];
  const { columns, values } = res[0];
  return values.map((row) => Object.fromEntries(row.map((v, i) => [columns[i], v])));
}

function exec(sql, params = []) {
  db.run(sql, params);
}

function query(sql, params = []) {
  const res = db.exec(sql, params);
  return rowsFromResult(res);
}

// Ensure sql.js (window.initSqlJs) is available. If not, inject the CDN script and wait for it.
async function ensureSqlJsLoaded() {
  if (window.initSqlJs) return;
  await new Promise((resolve, reject) => {
    // If a loader script is already present, just wait for the global
    const existing = document.getElementById('sqljs-cdn');
    if (existing) {
      const check = setInterval(() => {
        if (window.initSqlJs) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        if (window.initSqlJs) resolve();
        else reject(new Error('sql.js not loaded after waiting for existing script'));
      }, 10000);
      return;
    }

    // Inject the script
    const script = document.createElement('script');
    script.id = 'sqljs-cdn';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load sql.js (sql-wasm.js)'));
    document.head.appendChild(script);
  });
}

export async function initClientDB() {
  if (db) return;
  
  // Ensure sql.js is loaded; auto-inject if missing
  await ensureSqlJsLoaded();
  
  SQL = await window.initSqlJs({
    locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
  });
  const saved = await idbGet(IDB_KEY);
  db = saved ? new SQL.Database(saved) : new SQL.Database();

  // Schema
  exec(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT,
    cover_url TEXT,
    description TEXT
  );`);
  exec('CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);');

  exec(`CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );`);

  exec(`CREATE TABLE IF NOT EXISTS exchanges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    book_title TEXT,
    status TEXT NOT NULL DEFAULT 'en prêt',
    created_at TEXT DEFAULT (datetime('now'))
  );`);

  exec('CREATE INDEX IF NOT EXISTS idx_exchanges_book_id ON exchanges(book_id);');
  exec('CREATE INDEX IF NOT EXISTS idx_exchanges_friend_id ON exchanges(friend_id);');

  await saveDB();
}

export const dbAPI = {
  // Books
  async listBooks(q = '') {
    if (!q.trim()) {
      return query('SELECT * FROM books ORDER BY id DESC');
    }
    const pattern = `%${q}%`;
    return query(
      'SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? ORDER BY id DESC',
      [pattern, pattern, pattern]
    );
  },
  async getBook(id) {
    const rows = query('SELECT * FROM books WHERE id = ?', [id]);
    return rows[0] || null;
  },
  async addBook(title, author, isbn, cover_url, description) {
    if (!title || !title.trim()) return { ok: false, error: 'Titre manquant' };
    exec('INSERT INTO books (title, author, isbn, cover_url, description) VALUES (?, ?, ?, ?, ?)', 
      [title.trim(), author || '', isbn || '', cover_url || '', description || '']);
    await saveDB();
    const row = query('SELECT * FROM books WHERE title = ? ORDER BY id DESC LIMIT 1', [title.trim()])[0];
    
    return { ok: true, book: row };
  },
  async updateBookCover(id, cover_url) {
    if (!cover_url || !cover_url.match(/^https?:\/\//)) {
      return { ok: false, error: 'Veuillez fournir une URL valide commençant par http(s)://' };
    }
    exec('UPDATE books SET cover_url = ? WHERE id = ?', [cover_url, id]);
    await saveDB();
    return { ok: true };
  },
  async deleteBook(id) {
    const has = query('SELECT 1 AS x FROM exchanges WHERE book_id = ? LIMIT 1', [id]);
  if (has.length) return { ok: false, error: 'Impossible de supprimer ce livre : un prêt est en cours.' };
    exec('DELETE FROM books WHERE id = ?', [id]);
    await saveDB();
    return { ok: true };
  },

  // Friends
  async listFriends() {
    return query('SELECT id, name FROM friends ORDER BY id DESC');
  },
  async addFriend(name) {
    name = (name || '').trim();
    if (!name) return { ok: false, error: 'Nom manquant' };
    const dup = query('SELECT id FROM friends WHERE name = ?', [name]);
    if (dup.length) return { ok: false, error: `Un ami nommé "${name}" existe déjà.` };
    exec('INSERT INTO friends (name) VALUES (?)', [name]);
    await saveDB();
    const row = query('SELECT id, name FROM friends WHERE name = ? ORDER BY id DESC LIMIT 1', [name])[0];
    return { ok: true, friend: row };
  },
  async deleteFriend(id) {
    const has = query('SELECT 1 AS x FROM exchanges WHERE friend_id = ? LIMIT 1', [id]);
  if (has.length) return { ok: false, error: 'Impossible de supprimer : un prêt est en cours.' };
    exec('DELETE FROM friends WHERE id = ?', [id]);
    await saveDB();
    return { ok: true };
  },

  // Exchanges
  async listExchanges() {
    return query('SELECT id, status, created_at, friend_id, book_id, book_title FROM exchanges ORDER BY id DESC');
  },
  async createExchange(book_id, friend_id, book_title) {
    if (!book_id || !friend_id) return { ok: false, error: 'Sélectionnez un livre et un ami.' };
    const dup = query('SELECT id FROM exchanges WHERE book_id = ? AND friend_id = ? LIMIT 1', [book_id, friend_id]);
  if (dup.length) return { ok: false, error: 'Une demande de prêt pour ce livre avec cet ami existe déjà.' };
    exec('INSERT INTO exchanges (book_id, friend_id, book_title, status) VALUES (?, ?, ?, ?)', [book_id, friend_id, book_title || '', 'en prêt']);
    await saveDB();
    return { ok: true };
  },
  async deleteExchange(id) {
    exec('DELETE FROM exchanges WHERE id = ?', [id]);
    await saveDB();
    return { ok: true };
  },
  async exchangeBookIds() {
    const rows = query('SELECT DISTINCT book_id FROM exchanges');
    return new Set(rows.map(r => r.book_id));
  },
  async exchangeFriendIds() {
    const rows = query('SELECT DISTINCT friend_id FROM exchanges');
    return new Set(rows.map(r => r.friend_id));
  },
  async getExchangeForBook(book_id) {
    const rows = query(
      'SELECT e.id, e.created_at, f.name as friend_name FROM exchanges e JOIN friends f ON f.id = e.friend_id WHERE e.book_id = ? LIMIT 1',
      [book_id]
    );
    return rows[0] || null;
  }
};

// Export/Import de la base de données
/**
 * Exporte la base de données SQLite en tant que fichier téléchargeable
 * @returns {Blob} Un blob du fichier SQLite
 */
export function exportDB() {
  if (!db) throw new Error('DB non initialisée');
  const data = db.export(); // Uint8Array
  return new Blob([data], { type: 'application/x-sqlite3' });
}

/**
 * Importe une base de données SQLite depuis un fichier
 * @param {File} file - Fichier SQLite à importer
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function importDB(file) {
  try {
    if (!SQL) {
      await ensureSqlJsLoaded();
      SQL = await window.initSqlJs({
        locateFile: (f) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}`,
      });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Valider que c'est bien un fichier SQLite
    const header = new TextDecoder().decode(uint8Array.slice(0, 16));
    if (!header.startsWith('SQLite format 3')) {
      return { ok: false, error: 'Fichier invalide: ce n\'est pas une base SQLite.' };
    }
    
    // Remplacer la DB actuelle
    if (db) db.close();
    db = new SQL.Database(uint8Array);
    
    // Sauvegarder dans IndexedDB
    await idbSet(IDB_KEY, uint8Array);
    
    return { ok: true };
  } catch (err) {
    console.error('Erreur import DB:', err);
    return { ok: false, error: `Erreur lors de l'import: ${err.message}` };
  }
}
