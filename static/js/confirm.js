// ES module for Confirm book page (client-side)
import { initClientDB, dbAPI } from '/static/js/db.js';
import { toast, showLoader, hideLoader } from '/static/js/ui.js';
import { fetchBookByISBN } from '/static/js/isbn.js';

function el(sel, root=document){ return root.querySelector(sel); }

async function main() {
  showLoader();
  try { 
    await initClientDB();
    
    // Récupérer l'ISBN depuis sessionStorage ou URL
    let isbn = sessionStorage.getItem('scanned_isbn');
    if (!isbn) {
      // Fallback sur URL query param pour rétrocompatibilité
      const params = new URLSearchParams(window.location.search);
      isbn = params.get('isbn');
    }
    
    if (!isbn) {
      toast('ISBN manquant.', 'error');
      setTimeout(() => window.location.href = '/scan', 1500);
      return;
    }
    
    // Nettoyer le sessionStorage
    sessionStorage.removeItem('scanned_isbn');
    
    // Récupérer les métadonnées du livre
    const bookData = await fetchBookByISBN(isbn);
    
    // Pré-remplir le formulaire
    el('#title').value = bookData.title;
    el('#author').value = bookData.author;
    el('#isbn').value = bookData.isbn;
    el('#cover_url').value = bookData.cover_url;
    el('#description').value = bookData.description;
    
    // Mettre à jour l'aperçu de la couverture
    const coverImg = document.querySelector('.cover-preview');
    if (coverImg) {
      coverImg.src = bookData.cover_url || '/static/nocover300x450.svg';
      coverImg.alt = 'Couverture';
    }
    
  } finally { 
    hideLoader(); 
  }

  const form = el('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = el('#title', form).value.trim();
    const author = el('#author', form).value.trim();
    const isbn = el('#isbn', form).value.trim();
    const cover_url = el('#cover_url', form).value.trim();
    const description = el('#description', form).value.trim();

    showLoader();
    const res = await dbAPI.addBook(title, author, isbn, cover_url, description);
    
    if (!res.ok) {
      toast(res.error, 'error');
      hideLoader();
      return;
    }

    toast('Livre ajouté à votre bibliothèque.', 'success');
    setTimeout(() => window.location.href = '/library', 1000);
    hideLoader();
  });
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
