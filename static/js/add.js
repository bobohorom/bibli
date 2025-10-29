// ES module for Add book page (client-side)
import { initClientDB, dbAPI } from '/static/js/db.js';
import { toast, showLoader, hideLoader } from '/static/js/ui.js';

function el(sel, root=document){ return root.querySelector(sel); }

async function main() {
  showLoader();
  try { await initClientDB(); } finally { hideLoader(); }

  const form = el('#addBookForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = el('input[name="title"]', form).value.trim();
    const author = el('input[name="author"]', form).value.trim();
    const isbn = el('input[name="isbn"]', form).value.trim();
    const cover_url = el('input[name="cover_url"]', form).value.trim();
    const description = el('textarea[name="description"]', form).value.trim();

    console.log('[add.js] Tentative d\'ajout:', { title, author, isbn, cover_url, description });
    showLoader();
    const res = await dbAPI.addBook(title, author, isbn, cover_url, description);
    console.log('[add.js] Résultat addBook:', res);
    if (!res.ok) return toast(res.error, 'error');

    toast('Livre ajouté à votre bibliothèque.', 'success');
    setTimeout(() => window.location.href = '/library', 1000);
    hideLoader();
  });
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', main);
}else{
  main();
}
