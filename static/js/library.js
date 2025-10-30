// ES module for Library page (client-side rendering)
import { initClientDB, dbAPI, exportDB, importDB } from './db.js';
import { toast, showLoader, hideLoader } from './ui.js';

function el(sel, root=document){ return root.querySelector(sel); }

async function renderBooks(query = '') {
  try {
    const books = await dbAPI.listBooks(query);
    const exchangeIds = await dbAPI.exchangeBookIds();
    const grid = el('#booksGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    if (!books.length) {
      const msg = document.createElement('div');
      msg.className = 'muted';
      msg.textContent = query ? 'Aucun livre trouvé.' : 'Votre bibliothèque est vide.';
      grid.appendChild(msg);
      return;
    }

    books.forEach(b => {
      // Guard types for id (string vs number)
      const inExchange = exchangeIds.has(Number(b.id));
      const card = document.createElement('a');
      card.href = `#/book/${b.id}`;
      card.className = 'book';
      if (inExchange) {
        card.classList.add('book-in-exchange');
      }
      
      const img = document.createElement('img');
      img.className = 'book-cover';
      img.src = b.cover_url || '../nocover300x450.svg';
      img.alt = b.title;
      img.loading = 'lazy'; // Lazy loading pour performance
      // Force dimensions even if image fails to load
      img.onerror = function() {
        this.src = '../nocover300x450.svg';
      };
      
      const body = document.createElement('div');
      body.className = 'book-body';
      
      const title = document.createElement('div');
      title.className = 'book-title';
      title.title = b.title;
      title.textContent = b.title;
      
      const author = document.createElement('div');
      author.className = 'book-author';
      author.textContent = b.author || '';
      
      body.appendChild(title);
      body.appendChild(author);
      
      if (inExchange) {
        const badge = document.createElement('div');
        badge.className = 'exchange-badge';
  badge.textContent = 'En prêt';
        body.appendChild(badge);
      }
      
      card.appendChild(img);
      card.appendChild(body);
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Erreur lors du rendu des livres:', err);
    toast('Erreur lors du chargement des livres', 'error');
  }
}

async function main() {
  try {
    showLoader();
    await initClientDB();
  } catch (err) {
    console.error('Erreur init DB:', err);
    toast('Erreur lors de l\'initialisation de la base de données', 'error');
    hideLoader();
    return;
  }
  
  const searchForm = el('#searchForm');
  const searchInput = el('#searchInput');
  
  if (searchForm && searchInput) {
    // Get initial query from URL
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') || '';
    searchInput.value = initialQuery;
    
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      // Update URL without reload
      const url = new URL(window.location);
      if (query) {
        url.searchParams.set('q', query);
      } else {
        url.searchParams.delete('q');
      }
      window.history.pushState({}, '', url);
      showLoader();
      try { await renderBooks(query); } finally { hideLoader(); }
    });
  }
  try { await renderBooks(searchInput?.value || ''); } finally { hideLoader(); }
  
  // Wire export/import buttons
  const exportBtn = el('#exportDB');
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportDB);
  }
  
  const importInput = el('#importDB');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleImportDB(file);
    });
  }
}

// Export DB handler
function handleExportDB() {
  try {
    const blob = exportDB();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biblipartage_${new Date().toISOString().slice(0,10)}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Base de données exportée avec succès.', 'success');
  } catch (err) {
    console.error('Erreur export:', err);
    toast('Erreur lors de l\'export de la base de données.', 'error');
  }
}

// Import DB handler
async function handleImportDB(file) {
  if (!file) return;
  
  if (!confirm('⚠️ L\'import remplacera toutes vos données actuelles. Voulez-vous continuer ?')) {
    return;
  }
  
  showLoader();
  try {
    const res = await importDB(file);
    if (!res.ok) {
      toast(res.error, 'error');
      return;
    }
    toast('Base de données importée avec succès.', 'success');
    // Recharger la page pour afficher les nouvelles données
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    console.error('Erreur import:', err);
    toast('Erreur lors de l\'import de la base de données.', 'error');
  } finally {
    hideLoader();
  }
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', main);
}else{
  main();
}
